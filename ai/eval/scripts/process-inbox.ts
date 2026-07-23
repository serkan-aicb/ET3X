/**
 * CV inbox processor — drop CV files into ai/eval/inbox/ and run `npm run extract:inbox`.
 *
 * Reads .txt/.md directly, converts .docx/.doc/.rtf via textutil (macOS built-in) and .pdf via
 * pdftotext (brew install poppler). Runs the deterministic extractor on each file and writes
 * <name>.extracted.json next to it. The inbox is gitignored — personal CVs never enter version
 * control — and everything runs locally: no model, no key, no network.
 *
 * PDF caveat: some PDFs embed fonts without a ToUnicode map for ligatures (ﬀ ﬁ ﬂ), so pdftotext
 * drops those glyphs entirely — "Software" comes out "So ware". This is unrecoverable at the text
 * layer (the letters are gone, not mis-encoded) and -enc UTF-8 does not help. The parser is built
 * to tolerate it (section-aware, so structure still resolves), but .docx/.txt is the clean path.
 *
 * Owner: AI Behavior workstream. Scope: validation tooling only.
 */
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { extractCv } from './extract-cv-local';

const INBOX = path.resolve(__dirname, '../inbox');

function toText(file: string): string {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.txt' || ext === '.md') return fs.readFileSync(file, 'utf-8');
  if (ext === '.docx' || ext === '.doc' || ext === '.rtf')
    return execFileSync('textutil', ['-convert', 'txt', '-stdout', file], { encoding: 'utf-8' });
  if (ext === '.pdf') {
    try {
      return execFileSync('pdftotext', ['-enc', 'UTF-8', file, '-'], { encoding: 'utf-8' });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT')
        throw new Error('pdftotext not installed — `brew install poppler`, or drop a .txt/.docx instead');
      throw e;
    }
  }
  throw new Error(`unsupported extension "${ext}" (use .txt, .md, .docx, .rtf, or .pdf)`);
}

function main() {
  fs.mkdirSync(INBOX, { recursive: true });
  // Skip hidden files, Word lock files (~$…), and our own outputs.
  const entries = fs
    .readdirSync(INBOX)
    .filter((f) => !f.startsWith('.') && !f.startsWith('~$') && !f.endsWith('.extracted.json'));
  if (!entries.length) {
    console.log(`Inbox is empty. Drop CV files into ${INBOX} and rerun.`);
    return;
  }
  let failed = 0;
  for (const name of entries) {
    const src = path.join(INBOX, name);
    const dest = path.join(INBOX, `${path.parse(name).name}.extracted.json`);
    try {
      const result = extractCv(toText(src));
      fs.writeFileSync(dest, JSON.stringify(result, null, 2));
      console.log(
        `${name} → ${path.basename(dest)}  (${result.education.length} education, ${result.experience.length} experience, ${result.suggested_skills.length} skills)`,
      );
    } catch (e) {
      failed++;
      console.error(`${name}: FAILED — ${(e as Error).message}`);
    }
  }
  console.log(`\n${entries.length - failed}/${entries.length} processed → ${INBOX}`);
  if (failed) process.exit(1);
}

main();
