/**
 * Audit (and optionally migrate) email_events rows to canonical permanent keys.
 *
 * Canonical logical event keys (permanent, no timestamps):
 *   WELCOME:<user_id>
 *   PRODUCT_SUBMITTED:<product_id>
 *   PRODUCT_APPROVED:<product_id>
 *   PRODUCT_REJECTED:<product_id>
 *
 * Legacy keys look like:  TYPE:<id>:<timestamp>
 *
 * Usage:
 *   npx tsx --require ./dotenv-preload.ts scripts/canonicalize-email-events.ts           # audit only
 *   npx tsx --require ./dotenv-preload.ts scripts/canonicalize-email-events.ts --apply   # apply
 */
import { supabaseAdmin } from '../src/lib/supabase.js';

interface Row {
  id: string;
  event_key: string;
  event_type: string;
  status: string;
  recipient: string;
  created_at: string;
  sent_at: string | null;
  provider_message_id: string | null;
}

const APPLY = process.argv.includes('--apply');
const LEGACY_PATTERN = /^(WELCOME|PRODUCT_SUBMITTED|PRODUCT_APPROVED|PRODUCT_REJECTED):([^:]+):(.+)$/;

function canonicalKeyOf(eventKey: string): string | null {
  const match = eventKey.match(LEGACY_PATTERN);
  if (!match) return null;
  return `${match[1]}:${match[2]}`;
}

async function main() {
  const { data, error } = await supabaseAdmin
    .from('email_events')
    .select('id, event_key, event_type, status, recipient, created_at, sent_at, provider_message_id')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to read email_events:', error);
    process.exit(1);
  }

  const rows = (data ?? []) as Row[];
  console.log(`Total email_events rows: ${rows.length}`);

  const byKey = new Map<string, Row[]>();
  for (const row of rows) {
    const list = byKey.get(row.event_key) ?? [];
    list.push(row);
    byKey.set(row.event_key, list);
  }

  const legacyRows: Array<{ row: Row; canonical: string }> = [];
  for (const row of rows) {
    const canonical = canonicalKeyOf(row.event_key);
    if (canonical) legacyRows.push({ row, canonical });
  }

  const duplicateCanonicalKeys = [...byKey.entries()].filter(([, list]) => list.length > 1);

  console.log(`Distinct event keys: ${byKey.size}`);
  console.log(`Legacy timestamped keys: ${legacyRows.length}`);
  console.log(`Keys with duplicate rows: ${duplicateCanonicalKeys.length}`);
  for (const [key, list] of duplicateCanonicalKeys) {
    console.log(`  DUP x${list.length}: ${key}`);
  }

  // Group legacy rows by canonical key
  const legacyGroups = new Map<string, Row[]>();
  for (const { row, canonical } of legacyRows) {
    const group = legacyGroups.get(canonical) ?? [];
    group.push(row);
    legacyGroups.set(canonical, group);
  }

  for (const [canonical, group] of legacyGroups) {
    console.log(
      `  LEGACY -> ${canonical}: ${group.length} row(s) [${group
        .map(g => `${g.event_key}=${g.status}`)
        .join(', ')}]`
    );
  }

  if (!APPLY) {
    console.log('\n(audit only — run with --apply to canonicalize and dedupe)');
    return;
  }

  // ── Apply: canonicalize legacy keys + dedupe to exactly one row per logical email ──
  let rekeyed = 0;
  let deletedDuplicates = 0;

  const allGroups = new Map<string, Row[]>(legacyGroups);
  // Also include canonical rows that already exist (merge with legacy groups)
  for (const [key, list] of byKey) {
    if (LEGACY_PATTERN.test(key)) continue;
    if (!allGroups.has(key)) allGroups.set(key, []);
    allGroups.get(key)!.push(...list);
  }

  for (const [canonical, group] of allGroups) {
    if (group.length === 0) continue;

    // Prefer a SENT row to keep; else the row with provider_message_id; else most recent
    const keep =
      group.find(r => r.status === 'SENT') ??
      group.find(r => r.provider_message_id) ??
      group[group.length - 1];
    const drop = group.filter(r => r.id !== keep.id);

    if (keep.event_key !== canonical) {
      const { error: updateErr } = await supabaseAdmin
        .from('email_events')
        .update({ event_key: canonical })
        .eq('id', keep.id)
        .eq('event_key', keep.event_key);
      if (updateErr) {
        // Likely unique violation if a canonical row already exists — fall through to drop this one too
        console.warn(`  Could not rekey ${keep.event_key} -> ${canonical}:`, updateErr.message);
        drop.push(keep);
      } else {
        rekeyed++;
        console.log(`  REKEYED: ${keep.event_key} -> ${canonical}`);
      }
    }

    for (const row of drop) {
      const { error: delErr } = await supabaseAdmin.from('email_events').delete().eq('id', row.id);
      if (delErr) {
        console.warn(`  Could not delete duplicate row ${row.id} (${row.event_key}):`, delErr.message);
      } else {
        deletedDuplicates++;
        console.log(`  DELETED duplicate: ${row.event_key} [${row.status}]`);
      }
    }
  }

  // Final verification
  const { data: finalRows, error: finalErr } = await supabaseAdmin
    .from('email_events')
    .select('event_key, status')
    .order('event_key');
  if (finalErr) throw finalErr;
  const counts = new Map<string, number>();
  for (const r of finalRows ?? []) {
    counts.set(r.event_key, (counts.get(r.event_key) ?? 0) + 1);
  }
  const stillDuplicated = [...counts.entries()].filter(([, c]) => c > 1);
  const stillLegacy = [...counts.keys()].filter(k => LEGACY_PATTERN.test(k));

  console.log(`\nApplied: rekeyed=${rekeyed}, deletedDuplicates=${deletedDuplicates}`);
  console.log(`Verification: rows=${finalRows?.length}, duplicate keys=${stillDuplicated.length}, legacy keys=${stillLegacy.length}`);
  if (stillDuplicated.length) console.log('  STILL DUPLICATED:', stillDuplicated);
  if (stillLegacy.length) console.log('  STILL LEGACY:', stillLegacy);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
