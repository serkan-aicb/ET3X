# AI Behavior Workstream — Integration & Handoff

> **Owner:** Steve (Language Intelligence)
> **Date:** 2026-07-08 · **Status:** v0.2 — reconciled against teammates' confirmed task scopes (see §8 for discrepancies this surfaced)
> **Companion docs:** `workstream-status-report.md` (full status), `validation-strategy.md` (quality gates), `behavior-framework.md` (behavior rules)

---

## 1. What the Language Intelligence layer is, and why it matters

The platform's core principle: **Talent3X is a capability platform, not an AI app.** Capability scores are deterministic — swap the AI provider tomorrow and the numbers don't change. AI only *explains and interprets*; it never decides or writes capability scores. This workstream owns that guarantee at the language layer:

- **Prompts** — a frozen shared stack (system prompt + behavior rules + guardrails) composed with one feature prompt per AI feature (`ai/prompts/`)
- **Feature flags** — `ai/config/features.json`: 12 flags, one per feature; a feature is deliverable only when its flag is `enabled: true`
- **Validation** — 12 JSONL datasets (93 cases incl. adversarial injection/fabrication batteries), an eval harness (`npm run test:feature`), and a promotion gate: 100% guardrail + role-boundary pass, ≥90% functional, 100% format
- **Production model: Qwen** (confirmed 2026-07-08), executed exclusively through Nivin's AI service layer. Eval must run on the same Qwen model/deployment production uses.

The hard architectural rule this layer enforces in language: **AI_INTERACTIONS stay separate — AI suggests and interprets only, and NEVER writes capability scores.** Every prompt output is advisory by design (guardrail G3, behavior rule 4). Any prompt whose output could be read as *deciding* a score is a severity-1 defect against the core IP separation.

## 2. Ownership map — four layers, four owners (confirmed scopes)

| Owner | Layer | Owns | Does NOT own |
|---|---|---|---|
| **Cyprian** | Mathematical Intelligence (the brain / core IP) | The schemas (Action, Evaluation, Capability, Confidence); Evaluation Engine; Capability Engine (aggregates score × evaluation_weight); Analytics Calculation Engine; Benchmarking | Trust tiers, independence, per-evaluation weight — supplied by the **verification layer**, which he consumes; how results are narrated (Steve); how they're served (Nivin) |
| **Nivin** | AI Service Layer (the bridge) | LLM integration, prompt execution, response parsing, retry/fallback logic, the AI APIs. **Everything AI flows through his services — nothing else in the app calls an LLM directly** | Prompt content (Steve); calculations (Cyprian). He receives structured requests, runs the appropriate prompt, returns structured JSON |
| **Klenis** | UI / User Experience | Profile Studio, Actions, Evaluations, Analytics dashboards, Reports. Renders config supplied by the verification layer — never hardcodes roles/difficulty/score lists | Business logic (none); output shape/word caps (Steve's spec, which he consumes) |
| **Steve** | Language Intelligence | Prompts, guardrails, explanations, recommendations, summaries, AI quality, prompt libraries | Executing prompts in production (Nivin); computing any number (Cyprian); writing capability scores (nobody — scores come only from the deterministic engine) |

Plus one supplier outside the four: the **verification layer** provides trust tiers, independence, per-evaluation weights (consumed by Cyprian) and the config Klenis renders. It also implies the **capability catalogue** (families → capabilities → skills, with aliases) is supplied centrally — see §8.1.

**The boundary rule:** Cyprian computes → Nivin transports and executes → Steve constrains what the model may say → Klenis displays. If a number is wrong, that's Cyprian's or Nivin's layer; if a *sentence* is wrong (fabricated, leaked, off-role, off-format, score-deciding), that's Steve's.

## 3. Integration flow

```
  VERIFICATION LAYER                CYPRIAN                     STEVE (build-time)
  trust tiers, weights,      deterministic engines:            prompts + flags + eval
  central config          ─► Evaluation, Capability             │
                             (score × evaluation_weight),       │ delivers: features.json +
                             Analytics, Benchmarking ─┐         ▼ prompt files (## System Prompt)
                                                      ▼
 user action ─► KLENIS UI ─► NIVIN AI service layer ─► structured request: context block ─► QWEN
                             [the ONLY LLM caller;     (role + catalogue + pre-computed
                              prompt execution,         evidence ONLY) + composed stack
                              parsing, retry/fallback]                                │
                KLENIS UI ◄─ structured JSON / markdown back up the same path ◄──────┘
                renders per   parsed by Nivin; stored as NON-CANONICAL, regenerable,
                format spec   advisory content — NEVER written to capability scores
```

Validation runs the same composition offline: dataset case → composed stack → Qwen → assertions. What passes eval must be byte-identical to what Nivin's service composes — that identity is the whole point of the handoff format.

## 4. Per-feature dependencies and handoffs

| Feature (flag) | Needs from Cyprian | Needs from Nivin | Delivers to Klenis |
|---|---|---|---|
| W2 CV / LinkedIn extraction (`w2_*`) | **Capability catalogue schema incl. aliases** (extraction normalizes imported skills to canonical capabilities — see three-way dependency below) | Request/response contract; raw pasted text in context block; input size caps | Extraction JSON schema for onboarding UI, incl. empty/`extraction_notes` states |
| W3 capability suggestion (`w3_capability_suggestion`) | Catalogue supplied per call (canonical labels + aliases) | Context block = action/submission text + catalogue slice | JSON array `{skill, evidence, confidence}`, ordered strongest-first, may be `[]` — always advisory |
| W3/W5 capability explanation & growth (`w3_capability_validation`, `w5_*`) | Capability Engine semantics (score × evaluation_weight aggregation) frozen, so narration matches displayed numbers | Context block = per-capability scores + evidence, pre-computed | Markdown ≤150 words; explicit "no evidence yet" states to design for |
| W4 evaluation interpretation & feedback (`w4_*`) | Evaluation Engine output shape | Context block = submission + evaluator's own evaluations only | Markdown feedback drafts; educator-only surfaces; must read as *suggestion*, never verdict |
| W6 analytics insights (`w6_*`) | **Analytics Calculation Engine payloads + small-N suppression** (hard dependency — AI narrates, never computes) | Context block = Cyprian's aggregates only — never raw rows | Markdown with one-line headline finding first |
| W7 reporting (`w7_reporting`) | Analytics + Benchmarking payloads (same contract as W6) | Same as W6, admin role asserted | Executive-summary markdown structure |

**The flagship three-way dependency — capability normalization:** imported LinkedIn/CV skills "normalise to a canonical capability via the AI suggestion service." That service is **Steve's W2/W3 prompt work, executed through Nivin's layer, consuming Cyprian's catalogue schema**. It cannot ship until: Cyprian's catalogue schema (families → capabilities → skills + aliases) is final → Steve's extraction/suggestion prompts consume it via the context block → Nivin's service injects it per call. This is the first feature where all three layers must agree, and the natural pilot for the request/response contract.

**What happens after handoff:** Nivin wires each enabled feature into his AI APIs and his parser consumes outputs matching Steve's format spec; Klenis builds panels against the response shapes above (validation reports carry real sample outputs to design from); Cyprian's numbers appear verbatim in narration — never recomputed, never overwritten.

## 5. Answers to the standing questions

**Q1 — Cyprian:** W6/W7 depend on him *hard* (Analytics Calculation Engine + Benchmarking payloads are the only permitted analytics input — the AI is forbidden from computing aggregates). W2/W3 depend on his **catalogue schema** (canonical capabilities + aliases) for extraction/normalization. W3/W5 explanations need his **Capability Engine semantics** (score × evaluation_weight) frozen so explanations describe the real math. Schemas I need from him: the catalogue shape, the Capability/Confidence schemas, the analytics aggregate payload shape, and the small-N threshold applied *before* data reaches the context block.

**Q2 — Nivin:** Confirmed: he executes my prompts; nothing else in the app calls an LLM. Delivery format is the repo itself: `features.json` flags marked `enabled: true` + the referenced prompt files. His service must (a) extract the `## System Prompt` section of each file, (b) compose in the fixed order `system-prompt + behavior-rules + guardrails + feature prompt`, (c) send as the system message to **Qwen** (OpenAI-compatible chat completions) with the context block + user turn as the user message — `ai/eval/scripts/run-feature-tests.ts` is the reference implementation (~300 lines). Two contracts to co-design: the **structured request/response format** his AI APIs expose (my output schemas must be exactly what his parser expects), and his **retry/fallback behavior** — if he re-asks on malformed JSON, my 100%-format gate and his parser tolerance must be specified together, or format failures will be silently masked in production but visible in eval (or vice versa). He also logs the prompt file version header per call and runs the eval-validated Qwen deployment.

**Q3 — Klenis:** Response shapes are documented per feature prompt (JSON schemas inline in W2/W3 prompts; markdown word caps in `behavior-framework.md` §2), and validation reports will carry real sample outputs per case once live runs happen. He must design for the *refusal/degradation* state — a one-short-paragraph note ("no rated evidence yet") is an expected, common output, not an error. Two constraints from his confirmed scope: he never hardcodes lists (so AI outputs must also stay config-driven — no prompt may bake in labels his UI receives from config, see §8.1), and no UI affordance may present AI text as a score or decision (A7). In return, Steve needs his real panel constraints (width, truncation, char limits) to confirm word caps before W8.

**Q4 — Circular dependencies:** One soft loop per feature: my datasets *propose* a context-block schema → Nivin/Cyprian confirm or amend → I re-validate on the confirmed shape. Resolved by propose→confirm→freeze, not by waiting. Genuinely blocking order: (1) Cyprian's catalogue schema before W2/W3 validation counts; (2) his analytics payloads before W6/W7 count; (3) the Qwen deployment decision before *any* validation counts.

**Q5 — Deployment sequence:** Feature-by-feature, gated by flags. Order: W1 shared stack first (prerequisite for everything), then W2→W7 in roadmap order as each passes its gate, W8 full regression + four-way sign-off last. A feature whose flag is `false` doesn't exist to Nivin's layer. Recommended first live integration: W2 capability normalization (the three-way pilot, §4).

## 6. Assumptions and constraints — updated against confirmed scopes

| # | Status | Assumption | Constrains |
|---|---|---|---|
| A1 | Assumed | Context block contains **only** what the requesting role may see | Nivin: privacy is structural at his layer; guardrail G2 is defense-in-depth |
| A2 | **Confirmed** | Analytics/reporting context blocks contain pre-computed engine output only | Cyprian + Nivin: never pass raw rows to W6/W7 calls |
| A3 | **Superseded — see §8.1** | ~~20 stable skill labels~~ → catalogue is families → capabilities → skills with aliases, supplied centrally per call | Steve: prompts must consume the catalogue from the context block, not hardcode labels |
| A4 | Assumed | Production composes prompts byte-identically to the harness, same Qwen deployment | Nivin: any deviation voids validation results |
| A5 | **Confirmed** | AI outputs stored as regenerable, advisory, non-canonical content; never written to capability scores | Nivin: storage schema (AI_INTERACTIONS separate); Klenis: never render AI text as evidence/score |
| A6 | Assumed | Users can paste attacker-controlled text (CVs, submissions) | Nivin: cap input sizes; Steve: G4 injection battery mandatory at 100% |
| A7 | **Confirmed** | Humans issue evaluations; scores come only from the deterministic engine | Klenis: no affordance presenting AI output as rating/decision; Steve: advisory framing in every prompt |

## 7. Handoff checklist — "validated" → "production", per feature area

**Global prerequisites (once):**
- [ ] Qwen deployment decided (DashScope cloud vs self-hosted), fixed for eval and production — *Nivin + Steve*
- [ ] Nivin's AI API request/response contract co-designed with Steve's output schemas, incl. retry/parsing policy — *Nivin + Steve*
- [ ] Capability catalogue schema (families → capabilities → skills + aliases) published — *Cyprian*
- [ ] Shared stack validated: `w1_system_prompt` green at gate — *Steve*
- [ ] Prompt-version logging wired in the service layer — *Nivin*

**Onboarding (W2) — the three-way pilot:**
- [ ] Catalogue + aliases injected into extraction context block — *Cyprian → Nivin*
- [ ] Extraction prompts updated to consume catalogue from context (remove hardcoded labels, §8.1) and re-validated — *Steve*
- [ ] Input size caps agreed — *Nivin*
- [ ] Injection battery (G4) 100% on Qwen — *Steve*
- [ ] Onboarding UI built against extraction JSON, incl. empty/`extraction_notes` states — *Klenis*

**Capability (W3, W5):**
- [ ] Capability Engine semantics (score × evaluation_weight) frozen and documented — *Cyprian*
- [ ] `confidence` naming deconflicted with Cyprian's Confidence schema (§8.2) — *Steve + Cyprian*
- [ ] Suggestion array + explanation word caps validated at gate — *Steve*
- [ ] "No evidence yet" state designed — *Klenis*

**Evaluation (W4):**
- [ ] Context block limited to evaluator's own scope — *Nivin*
- [ ] Feedback rendered as editable draft, never auto-published — *Klenis*
- [ ] Decision-forcing guardrail (G3) cases 100% — *Steve*

**Analytics (W6):**
- [ ] Analytics Calculation Engine payload schema + small-N threshold delivered — *Cyprian*
- [ ] Context block carries engine output only — *Nivin*
- [ ] Insights + summary-validation features at gate — *Steve*

**Reporting (W7):**
- [ ] Analytics + Benchmarking payload contract extended to reports — *Cyprian*
- [ ] Admin-role assertion in context block — *Nivin*
- [ ] Report structure fits export/display surface — *Klenis*

**Final (W8):** all 11 upstream flags `ready`+`enabled`, `w8_e2e_regression` 100%, cost baseline recorded, four-way sign-off per `w8-final-qa.md` §4.

## 8. Reconciliation notes — discrepancies surfaced by the confirmed scopes

**8.1 Capability catalogue vs the hardcoded 20-skill list (action required, W2 prompts).** My current prompts assume a flat list of 20 skills; `cv-extraction.md` *hardcodes all 20 labels*, and `system-prompt.md` summarizes them. The confirmed model is a centrally supplied catalogue (families → capabilities → skills, with **aliases** for normalization). Action: once Cyprian publishes the catalogue schema, the W2 extraction prompts and the system prompt move to consuming it from the context block (`available_skills` in the W3 suggestion prompt already works this way and is the pattern to follow). Until then, W2 validation results are provisional.

**8.2 `confidence` naming collision.** Cyprian owns a **Confidence schema** (deterministic). My suggestion outputs carry a `confidence: high|medium|low` field (AI judgment about evidence strength). These are different concepts with the same name and will be conflated in UI and storage. Action: agree a rename (e.g. `suggestion_strength` on my side) or explicit namespacing before Nivin freezes the response contract.

**8.3 Aggregation semantics: existing code vs Cyprian's engine.** The repo's current `src/lib/profile/aggregation.ts` uses difficulty-weighted scoring; Cyprian's confirmed Capability Engine aggregates **score × evaluation_weight** with weights from the verification layer. My W3/W5 explanation prompts narrate whichever is authoritative — I need Cyprian to confirm which semantics ship, because explanations that describe the wrong math are functionally wrong even when fluent.

**8.4 Terminology: Actions vs tasks.** The confirmed schemas say **Action / Evaluation / Capability / Confidence**; my prompts and datasets say "tasks" and "star ratings" (matching the current app). Prompts should adopt the canonical schema vocabulary when Cyprian's schemas land, in the same pass as 8.1 — one terminology migration, re-validated once.

**8.5 Resolved from v0.1:** Nivin's layer confirmed as the only LLM caller (was open); AI-outputs-as-advisory confirmed as a platform-level architectural rule, not just my guardrail; the verification layer identified as the source of trust tiers/weights/config (was unmodeled).
