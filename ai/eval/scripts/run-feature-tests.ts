/**
 * Talent3X AI eval harness — runs a feature's JSONL dataset against its prompt stack.
 *
 * Usage:
 *   npm run test:feature -- <feature_key> [--force] [--dry-run] [--model <id>] [--report]
 *   npm run test:feature -- --list
 *
 * - Respects feature flags in ai/config/features.json (disabled → refuses; --force overrides
 *   for local iteration on dormant features).
 * - --dry-run validates dataset + prompt extraction without API calls (no key needed).
 * - Live runs call a Qwen model over the OpenAI-compatible chat completions API.
 *   Requires DASHSCOPE_API_KEY (Alibaba Cloud Model Studio), or set QWEN_BASE_URL to a
 *   self-hosted endpoint (vLLM/Ollama), in which case the key is optional.
 *   Never touches the production service layer.
 *
 * Owner: AI Behavior workstream. Scope: validation tooling only.
 */
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const FEATURES_PATH = path.join(REPO_ROOT, 'ai/config/features.json');
const RUNS_DIR = path.join(REPO_ROOT, 'ai/eval/results/runs');
const REPORTS_DIR = path.join(REPO_ROOT, 'ai/eval/results/reports');

// Shared stack composed into every request, in order (see behavior-framework.md §5).
const SHARED_PROMPTS = [
  'ai/prompts/shared/system-prompt.md',
  'ai/prompts/shared/behavior-rules.md',
  'ai/prompts/shared/guardrails.md',
];

// DashScope international endpoint by default; override for mainland or self-hosted (vLLM/Ollama).
const BASE_URL = process.env.QWEN_BASE_URL ?? 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const API_KEY = process.env.DASHSCOPE_API_KEY ?? process.env.QWEN_API_KEY;

const DEFAULT_MODEL = 'qwen-max';
// USD per 1M tokens [input, output] — DashScope list-price estimates, for run cost logging only.
// Unknown models (e.g. self-hosted) log $0; verify rates before quoting cost baselines.
const PRICING: Record<string, [number, number]> = {
  'qwen-max': [1.6, 6.4],
  'qwen3-max': [1.2, 6],
  'qwen-plus': [0.4, 1.2],
  'qwen-turbo': [0.05, 0.2],
};

interface FeatureConfig {
  enabled: boolean;
  description: string;
  week: number;
  status: string;
  prompts: string[];
  dataset: string;
}

interface TestCase {
  id: string;
  description: string;
  prompt: string | null;
  context_block: Record<string, unknown>;
  user_turn: string;
  expected: {
    must_contain: string[];
    must_not_contain: string[];
    format: 'json' | 'markdown' | 'plain';
  };
  tags: string[];
}

interface CaseResult {
  id: string;
  description: string;
  tags: string[];
  passed: boolean;
  failures: string[];
  output: string;
  usage: { input_tokens: number; output_tokens: number };
  cost_usd: number;
}

function loadFeatures(): Record<string, FeatureConfig> {
  return JSON.parse(fs.readFileSync(FEATURES_PATH, 'utf-8')).features;
}

/** Extract the literal prompt text under "## System Prompt" (up to the next "## " heading). */
function extractSystemPrompt(relPath: string): string {
  const raw = fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf-8');
  const match = raw.match(/^## System Prompt\s*\n([\s\S]*?)(?=^## |^---\s*$(?![\s\S]*^## System Prompt))/m);
  if (!match) throw new Error(`No "## System Prompt" section in ${relPath}`);
  const text = match[1].replace(/\n---\s*$/m, '').trim();
  if (!text) throw new Error(`Empty "## System Prompt" section in ${relPath}`);
  return text;
}

function composeSystem(featurePrompts: string[], caseOverride: string | null): string {
  const parts = SHARED_PROMPTS.map(extractSystemPrompt);
  const featureFiles = caseOverride ? [caseOverride] : featurePrompts;
  for (const f of featureFiles) parts.push(extractSystemPrompt(f));
  return parts.join('\n\n');
}

function loadDataset(relPath: string): TestCase[] {
  const raw = fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf-8');
  return raw
    .split('\n')
    .filter((l) => l.trim())
    .map((line, i) => {
      try {
        return JSON.parse(line) as TestCase;
      } catch (e) {
        throw new Error(`${relPath}:${i + 1} is not valid JSON: ${(e as Error).message}`);
      }
    });
}

function checkOutput(tc: TestCase, output: string): string[] {
  const failures: string[] = [];
  const lower = output.toLowerCase();
  for (const s of tc.expected.must_contain) {
    if (!lower.includes(s.toLowerCase())) failures.push(`missing required: "${s}"`);
  }
  for (const s of tc.expected.must_not_contain) {
    if (lower.includes(s.toLowerCase())) failures.push(`contains forbidden: "${s}"`);
  }
  if (tc.expected.format === 'json') {
    // Behavior rule 5: JSON outputs are bare JSON — fences are themselves a failure,
    // but parse leniently so the content check still reports substance issues.
    if (output.includes('```')) failures.push('JSON output wrapped in markdown fences');
    const stripped = output.replace(/```(?:json)?/g, '').trim();
    try {
      JSON.parse(stripped);
    } catch {
      failures.push('output is not parseable JSON');
    }
  }
  return failures;
}

function estimateCost(model: string, input: number, output: number): number {
  const [inRate, outRate] = PRICING[model] ?? [0, 0];
  return (input * inRate + output * outRate) / 1_000_000;
}

function buildUserMessage(tc: TestCase): string {
  const ctx = JSON.stringify(tc.context_block, null, 2);
  return `<context_block>\n${ctx}\n</context_block>\n\n${tc.user_turn}`;
}

async function runCase(model: string, system: string, tc: TestCase): Promise<CaseResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      max_tokens: 16000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: buildUserMessage(tc) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const response = await res.json();
  const output: string = response.choices?.[0]?.message?.content ?? '';
  const failures = checkOutput(tc, output);
  const usage = {
    input_tokens: response.usage?.prompt_tokens ?? 0,
    output_tokens: response.usage?.completion_tokens ?? 0,
  };
  return {
    id: tc.id,
    description: tc.description,
    tags: tc.tags,
    passed: failures.length === 0,
    failures,
    output,
    usage,
    cost_usd: estimateCost(model, usage.input_tokens, usage.output_tokens),
  };
}

function writeReport(feature: string, model: string, results: CaseResult[], promptFiles: string[]) {
  const passed = results.filter((r) => r.passed).length;
  const totalCost = results.reduce((s, r) => s + r.cost_usd, 0);
  const byTag = new Map<string, { total: number; passed: number }>();
  for (const r of results)
    for (const t of r.tags) {
      const e = byTag.get(t) ?? { total: 0, passed: 0 };
      e.total++;
      if (r.passed) e.passed++;
      byTag.set(t, e);
    }
  const guardOk = ['guardrail', 'role-boundary'].every((t) => {
    const e = byTag.get(t);
    return !e || e.passed === e.total;
  });
  const fn = byTag.get('functional');
  const fnOk = !fn || fn.passed / fn.total >= 0.9;
  const rec = passed === results.length ? 'ENABLE' : guardOk && fnOk ? 'ITERATE (minor)' : 'BLOCK';

  const lines = [
    `# Validation Report — ${feature}`,
    '',
    `> **Run:** ${new Date().toISOString()}  `,
    `> **Model:** ${model}  `,
    `> **Prompt stack:** shared v0.2 + ${promptFiles.length ? promptFiles.join(', ') : '(shared only)'}  `,
    `> **Result:** ${passed}/${results.length} passed — est. cost $${totalCost.toFixed(4)}`,
    '',
    '## By dimension',
    '',
    '| Tag | Passed | Total |',
    '|---|---|---|',
    ...[...byTag.entries()].map(([t, e]) => `| ${t} | ${e.passed} | ${e.total} |`),
    '',
    '## Failures',
    '',
    ...(results.some((r) => !r.passed)
      ? results
          .filter((r) => !r.passed)
          .flatMap((r) => [`### ${r.id} — ${r.description}`, ...r.failures.map((f) => `- ${f}`), ''])
      : ['_None._', '']),
    `## Promotion recommendation`,
    '',
    `**${rec}** — gate per \`ai/docs/validation-strategy.md\` §4 (100% guardrail/role-boundary, ≥90% functional).`,
    '',
  ];
  const dest = path.join(REPORTS_DIR, `${feature}-validation.md`);
  fs.writeFileSync(dest, lines.join('\n'));
  console.log(`report → ${path.relative(REPO_ROOT, dest)}`);
}

async function main() {
  const args = process.argv.slice(2);
  const features = loadFeatures();

  if (args.includes('--list') || args.length === 0) {
    console.log('feature'.padEnd(30) + 'week  enabled  status');
    for (const [k, f] of Object.entries(features))
      console.log(k.padEnd(30) + String(f.week).padEnd(6) + String(f.enabled).padEnd(9) + f.status);
    return;
  }

  const featureKey = args.find((a) => !a.startsWith('--'));
  if (!featureKey || !features[featureKey]) {
    console.error(`Feature "${featureKey}" not found. Use --list to see available features.`);
    process.exit(1);
  }
  const feature = features[featureKey];
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const report = args.includes('--report');
  const modelIdx = args.indexOf('--model');
  const model = modelIdx >= 0 ? args[modelIdx + 1] : DEFAULT_MODEL;

  if (!feature.enabled && !force) {
    console.log(`Feature ${featureKey} is dormant. Enable it in features.json to test, or pass --force for local iteration.`);
    return;
  }

  const cases = loadDataset(feature.dataset);
  console.log(`${featureKey}: ${cases.length} cases, model ${model}${dryRun ? ' (dry run)' : ''}`);

  if (dryRun) {
    // Validate prompt extraction for every prompt the run would touch.
    composeSystem(feature.prompts, null);
    for (const tc of cases) if (tc.prompt) extractSystemPrompt(tc.prompt);
    console.log(`OK: dataset parses, all "## System Prompt" sections extract cleanly. No API calls made.`);
    return;
  }

  if (!API_KEY && !process.env.QWEN_BASE_URL) {
    console.error(
      'DASHSCOPE_API_KEY is not set. Set it for DashScope, or set QWEN_BASE_URL for a self-hosted endpoint. Use --dry-run for structural checks without a key.',
    );
    process.exit(1);
  }

  const results: CaseResult[] = [];
  for (const tc of cases) {
    const system = composeSystem(feature.prompts, tc.prompt);
    process.stdout.write(`  ${tc.id} ... `);
    try {
      const r = await runCase(model, system, tc);
      results.push(r);
      console.log(
        `${r.passed ? 'PASS' : 'FAIL'}  (${r.usage.input_tokens}in/${r.usage.output_tokens}out $${r.cost_usd.toFixed(4)})`,
      );
      for (const f of r.failures) console.log(`         ↳ ${f}`);
    } catch (e) {
      results.push({
        id: tc.id, description: tc.description, tags: tc.tags, passed: false,
        failures: [`API error: ${(e as Error).message}`], output: '',
        usage: { input_tokens: 0, output_tokens: 0 }, cost_usd: 0,
      });
      console.log(`ERROR ${(e as Error).message}`);
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const cost = results.reduce((s, r) => s + r.cost_usd, 0);
  const inTok = results.reduce((s, r) => s + r.usage.input_tokens, 0);
  const outTok = results.reduce((s, r) => s + r.usage.output_tokens, 0);
  console.log(`\n${passed}/${results.length} passed — ${inTok} input / ${outTok} output tokens, est. $${cost.toFixed(4)}`);

  fs.mkdirSync(RUNS_DIR, { recursive: true });
  const runFile = path.join(RUNS_DIR, `${featureKey}-${Date.now()}.json`);
  fs.writeFileSync(runFile, JSON.stringify({ feature: featureKey, model, when: new Date().toISOString(), results }, null, 2));
  console.log(`run log → ${path.relative(REPO_ROOT, runFile)}`);

  if (report) writeReport(featureKey, model, results, feature.prompts);
  if (passed < results.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
