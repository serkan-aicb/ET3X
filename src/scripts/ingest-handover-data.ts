/**
 * Ingest 260713_Talent3X_DEV_Handover_Ingestion.xlsx into the database.
 *
 * Per the v1.6 handover: "Ingest in the order listed. Fail the import
 * loudly on any count mismatch." Run this AFTER schema-v3-handover-aligned.sql
 * has been applied.
 *
 * Usage: npx tsx src/scripts/ingest-handover-data.ts <path-to-xlsx>
 *
 * DEPENDENCY: requires the `xlsx` package, which is not yet in package.json.
 * Run `npm install xlsx` before using this script.
 *
 * FLAG: this is a first pass covering the 5 core reference tables
 * (capabilities, skills, packages, package_capabilities, rubrics) plus
 * enums and scoring_policy. It does NOT yet:
 *   - handle re-ingestion / idempotency beyond simple upserts
 *   - validate the full CI acceptance criteria from handover section 10
 *     (e.g. "every non-dormant capability has >=2 skills", "every capability
 *     in packages E4-E7 has >=4") — only the raw row counts are checked here
 *   - run automatically in CI / nightly, per section 10's "run on ingest +
 *     nightly" requirement
 * Treat this as a starting point, not the finished ingestion pipeline.
 */

import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const EXPECTED_COUNTS: Record<string, number> = {
  capabilities: 119,
  skills: 497,
  packages: 10,
  package_capabilities: 124,
  rubrics: 714,
};

const EXPECTED_ACTIVATION_SCOPE_DISTRIBUTION: Record<string, number> = {
  validated_pilot: 43,
  launch_unvalidated: 66,
  dormant: 10,
};

function fail(message: string): never {
  console.error(`\n❌ INGESTION FAILED: ${message}\n`);
  process.exit(1);
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    fail('Usage: npx tsx src/scripts/ingest-handover-data.ts <path-to-xlsx>');
  }
  if (!fs.existsSync(filePath)) {
    fail(`File not found: ${filePath}`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    fail('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. This script bypasses RLS by design (service role) — never run it client-side.');
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const workbook = XLSX.readFile(filePath);

  function sheetRows(sheetName: string): Record<string, unknown>[] {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) fail(`Expected sheet "${sheetName}" not found in workbook.`);
    return XLSX.utils.sheet_to_json(sheet, { defval: null });
  }

  // ---- 1. Pre-flight: verify all counts BEFORE writing anything ----
  console.log('Verifying row counts against handover section 10 acceptance criteria...');
  const rowsBySheet: Record<string, Record<string, unknown>[]> = {};
  for (const [sheetName, expectedCount] of Object.entries(EXPECTED_COUNTS)) {
    const rows = sheetRows(sheetName);
    rowsBySheet[sheetName] = rows;
    if (rows.length !== expectedCount) {
      fail(`Sheet "${sheetName}" has ${rows.length} rows, expected ${expectedCount}. Aborting before any writes — do not ingest from a file that fails this check.`);
    }
    console.log(`  ✓ ${sheetName}: ${rows.length} rows`);
  }

  const capabilityRows = rowsBySheet.capabilities;
  const scopeCounts: Record<string, number> = {};
  for (const row of capabilityRows) {
    const scope = String(row.activation_scope);
    scopeCounts[scope] = (scopeCounts[scope] || 0) + 1;
  }
  for (const [scope, expected] of Object.entries(EXPECTED_ACTIVATION_SCOPE_DISTRIBUTION)) {
    if (scopeCounts[scope] !== expected) {
      fail(`activation_scope="${scope}" has ${scopeCounts[scope] || 0} capabilities, expected ${expected}. Aborting.`);
    }
  }
  console.log(`  ✓ activation_scope distribution matches (${JSON.stringify(scopeCounts)})`);

  // ---- 2. Ingest in the required order ----
  console.log('\nIngesting capabilities...');
  {
    const { error } = await supabase.from('capabilities').upsert(
      capabilityRows.map((r) => ({
        capability_id: r.capability_id,
        name: r.name,
        family: r.family,
        tier: r.tier,
        description: r.description,
        activation_scope: r.activation_scope,
        oulu_validated: String(r.oulu_validated).toLowerCase() === 'true',
        version: r.version,
        status: r.status,
      })),
      { onConflict: 'capability_id' }
    );
    if (error) fail(`capabilities upsert failed: ${error.message}`);
  }

  console.log('Ingesting skills...');
  {
    const { error } = await supabase.from('skills').upsert(
      rowsBySheet.skills.map((r) => ({
        skill_id: r.skill_id,
        label: r.label,
        capability_id: r.capability_id,
        description: r.description,
      })),
      { onConflict: 'skill_id' }
    );
    if (error) fail(`skills upsert failed: ${error.message}`);
  }

  console.log('Ingesting packages...');
  {
    const { error } = await supabase.from('packages').upsert(
      rowsBySheet.packages.map((r) => ({
        package_id: r.package_id,
        name: r.name,
        segment: r.segment,
        description: r.description,
      })),
      { onConflict: 'package_id' }
    );
    if (error) fail(`packages upsert failed: ${error.message}`);
  }

  console.log('Ingesting package_capabilities...');
  {
    const { error } = await supabase.from('package_capabilities').upsert(
      rowsBySheet.package_capabilities.map((r) => ({
        package_id: r.package_id,
        capability_id: r.capability_id,
      })),
      { onConflict: 'package_id,capability_id' }
    );
    if (error) fail(`package_capabilities upsert failed: ${error.message}`);
  }

  console.log('Ingesting rubrics...');
  {
    const { error } = await supabase.from('rubrics').upsert(
      rowsBySheet.rubrics.map((r) => ({
        capability_id: r.capability_id,
        level: r.level,
        anchor_text: r.anchor_text,
        rubric_version: r.rubric_version,
      })),
      { onConflict: 'capability_id,level,rubric_version' }
    );
    if (error) fail(`rubrics upsert failed: ${error.message}`);
  }

  console.log('Ingesting enums (reference table)...');
  {
    const enumRows = sheetRows('enums');
    const { error } = await supabase.from('enum_reference').upsert(
      enumRows.map((r) => ({
        enum_name: r.enum,
        value: r.value,
        meaning: r.meaning,
      })),
      { onConflict: 'enum_name,value' }
    );
    if (error) fail(`enum_reference upsert failed: ${error.message}`);
  }

  console.log('Ingesting scoring_policy...');
  {
    const policyRows = sheetRows('scoring_policy');
    const { error } = await supabase.from('scoring_policy').upsert(
      policyRows.map((r) => ({
        parameter: r.parameter,
        value: String(r.value),
        notes: r.notes,
      })),
      { onConflict: 'parameter' }
    );
    if (error) fail(`scoring_policy upsert failed: ${error.message}`);
  }

  console.log('\n✅ Ingestion complete. All counts verified, all sheets loaded.');
  console.log('NOTE: this does not yet run the full CI acceptance criteria from');
  console.log('section 10 (per-capability skill-count minimums, permission');
  console.log('assertions, etc.) — those still need to be built separately.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});