#!/usr/bin/env node
/**
 * lockup-census.mjs — measure how Pi lockups are encoded on-chain.
 *
 * Read-only. No wallet, no keys, no writes. Zero dependencies (Node >= 18 fetch).
 *
 * METHOD
 *   1. Page through GET /claimable_balances on Pi Mainnet (native asset only).
 *   2. For each claimant whose predicate is `not { abs_before: T }`, record
 *        term = T − last_modified_time
 *      `last_modified_time` is the ledger close time of the write that created the
 *      balance; if the balance was never touched afterwards, term is the chosen
 *      lockup duration.
 *   3. Match each term, to the second, against the four official durations.
 *
 * FINDING (2026-10-23, 2 000 sampled native claimable balances)
 *   The four official lockup durations are written on-chain as exact second counts
 *   derived from a Julian year (365.2425 days):
 *
 *       2 weeks    1 209 600 s      = 14 days
 *       6 months  15 778 476 s      = 365.2425/2 days
 *       1 year    31 556 952 s      = 365.2425 days
 *       3 years   94 670 856 s      = 3 × 365.2425 days
 *
 *   1 709 / 2 000 (85.5 %) matched one of the four to the second.
 *
 * LIMITS
 *   · A sampled page of the global list is a convenience sample, not a census of
 *     all balances: results are indicative, not exhaustive.
 *   · Matching a duration does not prove the Pi wallet's "Create Lockup" button
 *     created the entry — it proves the term equals an official lockup duration.
 *   · `last_modified_time` equals creation time only if the balance was not
 *     modified afterwards. Entries touched later will show a different term and
 *     land in "other".
 *
 * Usage
 *   node examples/lockup-census.mjs
 *   node examples/lockup-census.mjs --sample 5000 --json
 *   node examples/lockup-census.mjs --self-test
 */

const HORIZON = "https://api.mainnet.minepi.com";

/** The four official durations, as exact on-chain second counts. */
export const TIERS = [
  { key: "2w", label: "2 weeks", seconds: 1209600, lt: 0.1 },
  { key: "6m", label: "6 months", seconds: 15778476, lt: 0.5 },
  { key: "1y", label: "1 year", seconds: 31556952, lt: 1 },
  { key: "3y", label: "3 years", seconds: 94670856, lt: 2 },
];

/** Julian year used by the constants above. */
export const JULIAN_YEAR_SECONDS = 31556952;

export function daysFromSeconds(seconds) {
  return seconds / 86400;
}

/** Match a term (in seconds) to an official tier, to the second. */
export function matchTier(seconds, tolerance = 1) {
  return TIERS.find((tier) => Math.abs(tier.seconds - seconds) <= tolerance) || null;
}

/** Extract the unlock timestamp of the first claimant whose predicate time-locks. */
export function unlockFromPredicate(predicate) {
  if (!predicate) return null;
  if (predicate.not && predicate.not.abs_before) return predicate.not.abs_before;
  if (predicate.and) {
    for (const part of predicate.and) {
      const hit = unlockFromPredicate(part);
      if (hit) return hit;
    }
  }
  return null;
}

async function getJson(path) {
  const res = await fetch(`${HORIZON}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET ${path} → HTTP ${res.status}\n${body.slice(0, 300)}`);
  }
  return res.json();
}

export async function sampleBalances(target) {
  const out = [];
  let path = "/claimable_balances?limit=200&order=desc";
  let pages = 0;
  while (path && out.length < target && pages < 100) {
    const body = await getJson(path);
    const records = body._embedded?.records || [];
    out.push(...records);
    const next = body._links?.next?.href;
    path = next ? next.replace(HORIZON, "") : null;
    pages++;
    if (!records.length) break;
  }
  return out.slice(0, target);
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function analyze(records) {
  const buckets = new Map(TIERS.map((t) => [t.key, { count: 0, amounts: [] }]));
  const other = { count: 0, amounts: [], terms: new Map() };
  let native = 0;
  let timed = 0;
  let unattributed = 0;

  for (const cb of records) {
    if (cb.asset !== "native") continue;
    native++;
    const modified = cb.last_modified_time ? new Date(cb.last_modified_time) : null;
    if (!modified) continue;

    let claimed = false;
    for (const claimant of cb.claimants || []) {
      const unlock = unlockFromPredicate(claimant.predicate);
      if (!unlock) continue;
      timed++;
      const seconds = Math.round((new Date(unlock) - modified) / 1000);
      const tier = matchTier(seconds);
      if (tier) {
        const bucket = buckets.get(tier.key);
        bucket.count++;
        bucket.amounts.push(Number(cb.amount));
        claimed = true;
      } else {
        other.count++;
        other.amounts.push(Number(cb.amount));
        other.terms.set(seconds, (other.terms.get(seconds) || 0) + 1);
      }
      break;
    }
    if (!claimed && !timed) unattributed++;
  }

  const matched = [...buckets.values()].reduce((s, b) => s + b.count, 0);
  const topOther = [...other.terms.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return {
    sampled: records.length,
    native,
    timed,
    matched,
    matchedShare: timed ? matched / timed : 0,
    tiers: TIERS.map((t) => {
      const b = buckets.get(t.key);
      return {
        key: t.key,
        label: t.label,
        seconds: t.seconds,
        days: Number(daysFromSeconds(t.seconds).toFixed(4)),
        count: b.count,
        share: timed ? b.count / timed : 0,
        medianAmount: Number(median(b.amounts).toFixed(2)),
      };
    }),
    other: {
      count: other.count,
      share: timed ? other.count / timed : 0,
      topTerms: topOther.map(([seconds, count]) => ({
        seconds,
        days: Number(daysFromSeconds(seconds).toFixed(3)),
        count,
      })),
    },
    unattributed,
  };
}

function pct(value) {
  return `${(value * 100).toFixed(1)} %`;
}

function printReport(result, { sample }) {
  console.log("");
  console.log("  Pi Mainnet lockup census (read-only sample)");
  console.log(`  ${HORIZON}`);
  console.log("  " + "─".repeat(70));
  console.log(`  sampled native claimable balances   ${result.sampled}`);
  console.log(`  time-locked (has not(abs_before))   ${result.timed}`);
  console.log("");
  console.log("  Duration      seconds        days        count    share   median π");
  console.log("  " + "─".repeat(70));
  for (const tier of result.tiers) {
    console.log(
      `  ${tier.label.padEnd(12)} ${String(tier.seconds).padStart(9)} ${String(tier.days).padStart(11)} ${String(tier.count).padStart(9)} ${pct(tier.share).padStart(8)} ${String(tier.medianAmount).padStart(10)}`,
    );
  }
  console.log("  " + "─".repeat(70));
  console.log(
    `  ${"other terms".padEnd(12)} ${"".padStart(9)} ${"".padStart(11)} ${String(result.other.count).padStart(9)} ${pct(result.other.share).padStart(8)}`,
  );
  console.log("");
  console.log(`  matched to an official duration: ${result.matched} / ${result.timed}  (${pct(result.matchedShare)})`);
  console.log("");
  if (result.other.topTerms.length) {
    console.log("  Most common non-tier terms (seconds → days):");
    for (const t of result.other.topTerms) {
      console.log(`    ${String(t.seconds).padStart(10)} s  = ${String(t.days).padStart(9)} d   × ${t.count}`);
    }
    console.log("");
  }
  console.log("  Derived constant:");
  console.log(`    ${JULIAN_YEAR_SECONDS} s / 86400 = ${(JULIAN_YEAR_SECONDS / 86400).toFixed(4)} days  ← a Julian year`);
  console.log(`    6 months = ${TIERS[1].seconds} s = exactly half of it`);
  console.log(`    3 years  = ${TIERS[3].seconds} s = exactly three times it`);
  console.log("");
  console.log("  What this shows: the durations written on-chain are the four official");
  console.log("  lockup tiers, to the second, computed with a 365.2425-day year.");
  console.log("");
  console.log("  What this does NOT show: which UI created them, or that every sampled");
  console.log("  entry is a user lockup. See docs/ONCHAIN-CENSUS.md §Limits.");
  console.log("");
  if (sample !== result.sampled) {
    console.log(`  Note: asked for ${sample}, analysed ${result.sampled}.`);
    console.log("");
  }
}

export function selfTest() {
  const results = [];
  const eq = (name, got, want) => results.push({ name, ok: JSON.stringify(got) === JSON.stringify(want), got, want });

  eq("2 weeks constant", TIERS.find((t) => t.key === "2w").seconds, 14 * 86400);
  eq("1 year is a Julian year", TIERS.find((t) => t.key === "1y").seconds, Math.round(365.2425 * 86400));
  eq("6 months is half a Julian year", TIERS.find((t) => t.key === "6m").seconds, Math.round((365.2425 / 2) * 86400));
  eq("3 years is three Julian years", TIERS.find((t) => t.key === "3y").seconds, Math.round(3 * 365.2425 * 86400));
  eq("1 year is NOT 365 days", TIERS.find((t) => t.key === "1y").seconds === 365 * 86400, false);

  eq("matchTier 1209600", matchTier(1209600)?.key, "2w");
  eq("matchTier tolerates ±1 s", matchTier(1209601)?.key, "2w");
  eq("matchTier rejects 30 days", matchTier(2592000), null);

  eq("unlock from not(abs_before)",
    unlockFromPredicate({ not: { abs_before: "2027-01-01T00:00:00Z" } }), "2027-01-01T00:00:00Z");
  eq("unlock from and()",
    unlockFromPredicate({ and: [{ abs_before: "2028-01-01T00:00:00Z" }, { not: { abs_before: "2027-01-01T00:00:00Z" } }] }),
    "2027-01-01T00:00:00Z");
  eq("no unlock for unconditional", unlockFromPredicate({ unconditional: true }), null);

  /* analyze() on synthetic records: 2w, 1y, 3y, plus one 30-day outlier */
  const mk = (days, amount = "10") => ({
    asset: "native",
    amount,
    last_modified_time: "2026-01-01T00:00:00Z",
    claimants: [{ destination: "G…", predicate: { not: { abs_before: new Date(Date.parse("2026-01-01T00:00:00Z") + days * 86400000).toISOString() } } }],
  });
  const synthetic = [
    mk(14), mk(14), mk(14, "20"),
    mk(365.2425), mk(365.2425),
    mk(1095.7275),
    mk(30),
    { asset: "native", amount: "5", last_modified_time: "2026-01-01T00:00:00Z", claimants: [{ destination: "G…", predicate: { unconditional: true } }] },
  ];
  const a = analyze(synthetic);
  eq("synthetic: 3 two-week entries", a.tiers.find((t) => t.key === "2w").count, 3);
  eq("synthetic: 2 one-year entries", a.tiers.find((t) => t.key === "1y").count, 2);
  eq("synthetic: 1 three-year entry", a.tiers.find((t) => t.key === "3y").count, 1);
  eq("synthetic: 1 other", a.other.count, 1);
  eq("synthetic: mid tier unmatched", a.tiers.find((t) => t.key === "6m").count, 0);
  eq("synthetic: median of 2w set [10,10,20]", a.tiers.find((t) => t.key === "2w").medianAmount, 10);

  const passed = results.filter((r) => r.ok).length;
  console.log("");
  for (const r of results) {
    console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : `  (got ${JSON.stringify(r.got)})`}`);
  }
  console.log("");
  console.log(`  ${passed}/${results.length} checks passed`);
  console.log("");
  return { passed, total: results.length };
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv.includes("--self-test") || argv.includes("--offline")) {
    const { passed, total } = selfTest();
    return passed === total ? 0 : 1;
  }

  const sampleIdx = argv.indexOf("--sample");
  const sample = sampleIdx >= 0 && argv[sampleIdx + 1] ? Number(argv[sampleIdx + 1]) : 2000;
  if (!Number.isFinite(sample) || sample < 1) {
    console.error("--sample needs a positive integer");
    return 1;
  }

  const records = await sampleBalances(sample);
  const result = analyze(records);

  if (argv.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
    return 0;
  }
  printReport(result, { sample });
  return 0;
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href;
if (isDirectRun) {
  main().then((c) => process.exit(c)).catch((err) => { console.error("\n  Error:", err.message, "\n"); process.exit(1); });
}
