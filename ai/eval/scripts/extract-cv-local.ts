/**
 * Deterministic offline CV extractor — heuristic baseline for the w2_onboarding_cv schema.
 *
 * Usage:
 *   npx tsx ai/eval/scripts/extract-cv-local.ts <file.txt>
 *   cat cv.txt | npx tsx ai/eval/scripts/extract-cv-local.ts
 *
 * As of 2026-07-15 this is the extraction engine for w2_onboarding_cv — the AI prompt is
 * retired (see ai/prompts/onboarding/cv-extraction.md). No API key, no model, no network.
 * Known limits: it parses with regexes and maps skills by keyword lookup, so it only finds
 * what the rules anticipate — unconventional CV layouts or skills demonstrated in prose the
 * keyword table doesn't cover are silently missed. Extend SKILL_RULES as gaps show up.
 *
 * Owner: AI Behavior workstream. Scope: validation tooling only.
 */
import * as fs from 'fs';

export interface CvExtraction {
  education: { institution: string; degree: string; field: string; period: string }[];
  experience: { organization: string; role: string; period: string; summary: string }[];
  suggested_skills: { skill: string; evidence: string; confidence: 'high' | 'medium' | 'low' }[];
  extraction_notes: string;
}

const PERIOD_RE = /(?:19|20)\d{2}\s*[–—-]\s*(?:(?:19|20)\d{2}|present)|\(?\b(?:spring|summer|autumn|fall|winter)?\s*(?:19|20)\d{2}\)?/i;
const DEGREE_RE = /\b(?:PhD|MSc|MA|MBA|BSc|BA|BEng|MEng|Master(?:'s)?|Bachelor(?:'s)?|Doctorate|Diploma)\b/i;
const INSTITUTION_RE = /\b(?:university|institute|college|school|academy|polytechnic|politecnico)\b/i;

// Lines that read as directives to the model rather than CV content. Treated as data per the
// prompt's G4 rule: quarantined from parsing and skill matching, flagged in extraction_notes.
const INJECTION_RE =
  /\b(?:ignore|disregard)\b.*\b(?:previous|all|your)\b.*\b(?:rules|instructions?)\b|system instruction|note to the ai|please (?:also )?include\b.*\bskills?\b|\b(?:rate|rated|ratings?)\b.*\bstars?\b|\d-star|five-star|pre-?verified|at (?:high|medium|low) confidence/i;

// confidence: "high" only where the keyword itself is an explicit demonstration; keyword
// inference is "medium"; ambient signals are "low". Evidence is always the matched source line.
const SKILL_RULES: { skill: string; re: RegExp; confidence: 'high' | 'medium' | 'low' }[] = [
  { skill: 'Public Speaking', re: /\bkeynote|conference speaker|public speaking\b/i, confidence: 'high' },
  { skill: 'Public Speaking', re: /\bpresent(?:ed|ing|ation)|pitch(?:ed)?\b.*\b(?:audience|panel|jury)/i, confidence: 'medium' },
  { skill: 'Digital Literacy', re: /\b(?:python|sql|java|c\+\+|programming|software|dashboards?|data analysis|spreadsheets?|digital tools?)\b/i, confidence: 'medium' },
  { skill: 'Group Learning Facilitation', re: /\bfacilitat\w+\b.*\b(?:group|workshop|session)|study groups?|tutor(?:ed|ing)?\b/i, confidence: 'medium' },
  { skill: 'Cross-Cultural Communication', re: /\bexchange (?:semester|year|student)|cross-cultural|intercultural\b/i, confidence: 'low' },
  { skill: 'Cultural Sensitivity', re: /\b(?:different|foreign|business) cultures?\b/i, confidence: 'low' },
  { skill: 'Problem Solving', re: /\bproblem[- ]solving|resolved\b.*\b(?:conflicts?|issues?|blockers?)\b/i, confidence: 'medium' },
  { skill: 'Critical Thinking', re: /\bcritical think/i, confidence: 'medium' },
  { skill: 'Creative Problem Solving', re: /\bcreative(?:ly)?\b.*\b(?:solv|solution)/i, confidence: 'medium' },
  { skill: 'Solution Design', re: /\bdesigned\b.*\b(?:solution|system|prototype)s?\b/i, confidence: 'medium' },
  { skill: 'Constructive Feedback', re: /\b(?:gave|provided|peer) feedback\b/i, confidence: 'medium' },
  { skill: 'Sustainability Awareness', re: /\bsustainab|recycl/i, confidence: 'low' },
  { skill: 'UN SDG Knowledge', re: /\bSDGs?\b|sustainable development goals?/i, confidence: 'medium' },
  { skill: 'Stakeholder Impact Assessment', re: /\bstakeholders?\b/i, confidence: 'low' },
  { skill: 'Inclusive Collaboration', re: /\binclusi(?:ve|on)\b/i, confidence: 'low' },
  { skill: 'Interdisciplinary Connection', re: /\binterdisciplinary\b/i, confidence: 'medium' },
  { skill: 'Lifelong Learning', re: /\blifelong learning|continuous learning\b/i, confidence: 'medium' },
  { skill: 'Professional Conduct', re: /\bprofessional conduct\b/i, confidence: 'medium' },
];

const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1 };

// Section headers sitting on their own short line. Used to disambiguate lines that match more
// than one entry shape — and to recover education entries when ligature loss (see file header)
// corrupts the institution word so INSTITUTION_RE alone can't fire.
const SECTION_HEADERS: { section: 'education' | 'experience' | 'other'; re: RegExp }[] = [
  { section: 'education', re: /^(education|academic|qualifications?)\b/i },
  { section: 'experience', re: /^(experience|employment|work history|professional experience|projects?|systems? ?& ?research)/i },
  { section: 'other', re: /^(skills?|technical skills|profile|summary|other|hobbies|interests|contact|references)\b/i },
];

function sectionHeaderOf(line: string): 'education' | 'experience' | 'other' | null {
  if (line.length > 40) return null; // a header is a short line of its own, never a content line
  for (const h of SECTION_HEADERS) if (h.re.test(line.trim())) return h.section;
  return null;
}

function classifyEducationLine(line: string) {
  // Em-dash (—) separates degree from institution/award; en-dash (–) stays — it joins date ranges.
  const segments = line.split(/[,|\t—]/).map((s) => s.trim()).filter(Boolean);
  let degree = '';
  let institution = '';
  let period = '';
  let field = '';
  for (const seg of segments) {
    const periodMatch = seg.match(PERIOD_RE);
    if (!institution && INSTITUTION_RE.test(seg)) institution = seg;
    else if (!degree && DEGREE_RE.test(seg)) degree = seg;
    else if (!period && periodMatch) period = periodMatch[0];
    else if (!field) field = seg;
  }
  return { institution, degree, field, period };
}

export function extractCv(text: string): CvExtraction {
  const notes: string[] = ['Deterministic rule-based extraction (no AI model).'];
  const result: CvExtraction = { education: [], experience: [], suggested_skills: [], extraction_notes: '' };

  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 20) {
    notes.push(trimmed ? 'cv_text is too short to be a CV; nothing extracted.' : 'cv_text is empty; nothing to extract.');
    result.extraction_notes = notes.join(' ');
    return result;
  }

  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
  const contentLines: string[] = [];
  let injectionSeen = false;
  for (const line of lines) {
    if (INJECTION_RE.test(line)) injectionSeen = true;
    else contentLines.push(line);
  }
  if (injectionSeen) {
    notes.push('Embedded instruction-like text detected; it was treated as data and excluded from extraction per guardrail G4.');
  }

  const skillBest = new Map<string, { evidence: string; confidence: 'high' | 'medium' | 'low' }>();
  let lastExperience: CvExtraction['experience'][number] | null = null;
  let section: 'education' | 'experience' | 'other' | null = null;
  for (const line of contentLines) {
    const header = sectionHeaderOf(line);
    if (header) {
      section = header;
      lastExperience = null;
      continue; // the header line itself carries no entry data
    }
    const bullet = line.match(/^[•·▪-]\s*(.+)$/);
    if (bullet && lastExperience) {
      // Bullets belong to the entry above them; cap the summary so it stays a summary.
      lastExperience.summary = `${lastExperience.summary} ${bullet[1]}`.trim().slice(0, 400);
    } else if (DEGREE_RE.test(line) && (INSTITUTION_RE.test(line) || PERIOD_RE.test(line) || section === 'education')) {
      result.education.push(classifyEducationLine(line));
      lastExperience = null;
    } else {
      // Entry shapes: "Role, Organization (period): summary" and "Role | Organization <tab> period".
      const paren = line.match(/^(.{2,60}?),\s*(.{2,80}?)\s*\(([^)]+)\)\s*:\s*(.+)$/);
      const [head, ...tail] = line.split(/\t+/);
      const pipe = head.match(/^(.{2,60}?)\s*\|\s*(.{2,80})$/);
      if (paren) {
        lastExperience = { role: paren[1], organization: paren[2], period: paren[3], summary: paren[4] };
        result.experience.push(lastExperience);
      } else if (pipe) {
        const tailStr = tail.join(' ').trim();
        let organization = pipe[2].trim();
        let period = /(?:19|20)\d{2}|present|ongoing/i.test(tailStr) ? tailStr : '';
        if (!period) {
          // PDF conversion collapses the tab before the period into a space — peel it off the org.
          const trailing = organization.match(
            /^(.*?)\s*((?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+)?(?:19|20)\d{2}\s*[–—-]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+)?(?:(?:19|20)\d{2}|present)|ongoing|in development)$/i,
          );
          if (trailing) {
            organization = trailing[1].replace(/[|\s]+$/, '').trim();
            period = trailing[2];
          }
        }
        lastExperience = { role: pipe[1], organization, period, summary: '' };
        result.experience.push(lastExperience);
      }
    }

    for (const rule of SKILL_RULES) {
      if (!rule.re.test(line)) continue;
      const prev = skillBest.get(rule.skill);
      if (!prev || CONFIDENCE_RANK[rule.confidence] > CONFIDENCE_RANK[prev.confidence]) {
        skillBest.set(rule.skill, { evidence: line.slice(0, 160), confidence: rule.confidence });
      }
    }
  }
  result.suggested_skills = [...skillBest.entries()].map(([skill, s]) => ({ skill, ...s }));

  if (!result.education.length && !result.experience.length) {
    notes.push(
      result.suggested_skills.length
        ? 'No education or experience entries matched; input may be a sparse or unconventional CV.'
        : 'Input does not look like a CV (no education, experience, or skill signals found); nothing extracted.',
    );
  }

  result.extraction_notes = notes.join(' ');
  return result;
}

// CLI entry: file argument, or stdin when piped.
if (require.main === module) {
  const arg = process.argv[2];
  const input = arg ? fs.readFileSync(arg, 'utf-8') : fs.readFileSync(0, 'utf-8');
  console.log(JSON.stringify(extractCv(input), null, 2));
}
