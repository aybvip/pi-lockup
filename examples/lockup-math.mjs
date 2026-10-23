#!/usr/bin/env node
/**
 * lockup-math.mjs — the official lockup formula, with no dependencies.
 *
 *   L(B) = Lt · Lp · log10(N) · B
 *   boost% = Lt · Lp · log10(N) · 100
 *
 * Sources:
 *   Pi Whitepaper (Dec 2021), "Token Model and Mining" → Lockup Reward
 *   https://minepi.com/white-paper/
 *
 * Read-only, offline, deterministic. No network, no wallet, no keys.
 *
 * Usage
 *   node examples/lockup-math.mjs --lp 100 --duration 3y --sessions 630
 *   node examples/lockup-math.mjs --table
 *   node examples/lockup-math.mjs --ceiling --sessions 1000
 *   node examples/lockup-math.mjs --solve 559.90
 *   node examples/lockup-math.mjs --multi "3y:600,1y:300" --lb 1000 --sessions 900
 *   node examples/lockup-math.mjs --test
 */

/* ── Official tables (whitepaper §Lockup Reward) ─────────────────────────── */

export const LT = [
  { label: "0", seconds: 0, value: 0 },
  { label: "2w", seconds: 14 * 86400, value: 0.1 },
  { label: "6m", seconds: 182 * 86400, value: 0.5 },
  { label: "1y", seconds: 365 * 86400, value: 1 },
  { label: "3y", seconds: 3 * 365 * 86400, value: 2 },
];

export const LP = [
  { pct: 0, value: 0 },
  { pct: 25, value: 0.25 },
  { pct: 50, value: 0.5 },
  { pct: 90, value: 0.9 },
  { pct: 100, value: 1 },
  { pct: 150, value: 1.5 },
  { pct: 200, value: 2 },
];

const DURATION_ALIASES = {
  "0": "0", "2w": "2w", "2weeks": "2w", "2week": "2w", "14d": "2w",
  "6m": "6m", "6months": "6m", "6month": "6m", "0.5y": "6m",
  "1y": "1y", "1year": "1y", "12m": "1y",
  "3y": "3y", "3years": "3y", "36m": "3y",
};

export function parseDuration(input) {
  const key = String(input).toLowerCase().replace(/[\s_-]/g, "");
  const canonical = DURATION_ALIASES[key];
  if (!canonical) {
    throw new Error(`Unknown duration "${input}". Use one of: 0, 2w, 6m, 1y, 3y.`);
  }
  return LT.find((row) => row.label === canonical);
}

/** Lift a percentage onto the nearest official tier; report the exact multiplier used. */
export function parsePercentage(input) {
  const pct = Number(input);
  if (!Number.isFinite(pct) || pct < 0 || pct > 200) {
    throw new Error(`Lockup percentage must be between 0 and 200 (got "${input}").`);
  }
  const exact = LP.find((row) => row.pct === pct);
  if (exact) return { ...exact, exactMatch: true };
  /* The whitepaper only defines tiers; anything between them is not specified.
     We refuse to interpolate — we use the nearest lower tier and say so. */
  const lower = [...LP].reverse().find((row) => row.pct <= pct);
  return { ...lower, requested: pct, exactMatch: false };
}

/* ── Core arithmetic ─────────────────────────────────────────────────────── */

/** log base 10, per the whitepaper's "Log(1,000) = 3" example. */
export function log10n(sessions) {
  if (!Number.isFinite(sessions) || sessions < 1) {
    throw new Error("Mining sessions N must be a number >= 1.");
  }
  return Math.log10(sessions);
}

/** L(B)/B — the multiplier applied to the base rate. */
export function lockupMultiplier({ ltValue, lpValue, sessions }) {
  return ltValue * lpValue * log10n(sessions);
}

/** The percentage the app shows as "Estimated Lockup Boost". */
export function boostPercent({ ltValue, lpValue, sessions }) {
  return lockupMultiplier({ ltValue, lpValue, sessions }) * 100;
}

/**
 * Multiple simultaneous lockups (whitepaper, second formula):
 *   L(B) = log(N) · B · Σ (Lt_i · Lc_i) / Lb
 */
export function multiLockupMultiplier({ lockups, lb, sessions }) {
  if (!(lb > 0)) throw new Error("Lb (migrated mining balance) must be > 0.");
  const weighted = lockups.reduce((sum, l) => sum + l.ltValue * l.amount, 0);
  return log10n(sessions) * (weighted / lb);
}

/** Invert a boost figure: which (Lt, Lp, N) triples reproduce it?
 *  `maxSessions` bounds the search to a physically plausible mining history
 *  (20 000 daily sessions ≈ 54 years), otherwise the algebra admits absurd
 *  solutions like N = 10^223 that no account could ever reach. */
export function solveBoost(boost, { tolerance = 0.005, maxSessions = 20000 } = {}) {
  const target = boost / 100;
  const out = [];
  for (const lt of LT.filter((r) => r.value > 0)) {
    for (const lp of LP.filter((r) => r.value > 0)) {
      const logNeeded = target / (lt.value * lp.value);
      if (logNeeded <= 0) continue;
      const sessions = Math.pow(10, logNeeded);
      if (!Number.isFinite(sessions) || sessions < 1 || sessions > maxSessions) continue;
      /* Only report combos whose rounded boost matches the target. */
      const reproduced = lt.value * lp.value * Math.log10(Math.max(1, Math.round(sessions)));
      if (Math.abs(reproduced - target) <= tolerance) {
        out.push({
          duration: lt.label,
          lt: lt.value,
          percentage: lp.pct,
          lp: lp.value,
          log10N: logNeeded,
          sessions: Math.round(sessions),
        });
      }
    }
  }
  return out.sort((a, b) => a.sessions - b.sessions);
}

/* ── CLI ─────────────────────────────────────────────────────────────────── */

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) { args._.push(token); continue; }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) { args[key] = true; continue; }
    args[key] = next;
    i++;
  }
  return args;
}

const f2 = (n) => n.toFixed(2);
const f3 = (n) => n.toFixed(3);

function printSingle({ lt, lp, sessions, exactMatch, requested }) {
  const logN = log10n(sessions);
  const mult = lockupMultiplier({ ltValue: lt.value, lpValue: lp.value, sessions });

  console.log("");
  console.log("  Official formula:  L(B) = Lt · Lp · log10(N) · B");
  console.log("  ─────────────────────────────────────────────────────────────");
  console.log(`  duration          ${lt.label.padEnd(4)} → Lt = ${lt.value}`);
  console.log(`  lockup percentage ${String(lp.pct + " %").padEnd(4)} → Lp = ${lp.value}${exactMatch ? "" : `   (requested ${requested} %, nearest tier used)`}`);
  console.log(`  mining sessions   N = ${sessions} → log10(N) = ${logN.toFixed(4)}`);
  console.log("  ─────────────────────────────────────────────────────────────");
  console.log(`  L(B) / B          = ${mult.toFixed(4)}`);
  console.log(`  Estimated boost   = +${f2(mult * 100)} %`);
  console.log("");
  console.log("  What this does NOT mean:");
  console.log(`    · your balance does not change (${f3(mult)}× is a multiplier on the RATE, not on π)`);
  console.log("    · no interest is paid, and there is no APY");
  console.log("    · the lockup cannot be undone before its term ends");
  if (!exactMatch) {
    console.log("");
    console.log("  Note: the whitepaper defines tiers only. Values between tiers are unspecified,");
    console.log("        so this used the nearest lower tier instead of interpolating.");
  }
  console.log("");
}

function printTable() {
  const sessions = [30, 100, 365, 630, 1000, 3000];
  console.log("");
  console.log("  Lt · Lp for every official combination (base-rate multiplier)\n");
  const header = ["Lt\\Lp", ...LP.filter((r) => r.value > 0).map((r) => `${r.pct}%`)];
  console.log("  " + header.map((h) => h.padEnd(7)).join(""));
  console.log("  " + "-".repeat(7 * header.length));
  for (const lt of LT.filter((r) => r.value > 0)) {
    const row = [lt.label, ...LP.filter((r) => r.value > 0).map((lp) => f2(lt.value * lp.value))];
    console.log("  " + row.map((c) => c.padEnd(7)).join(""));
  }
  console.log("");
  console.log("  Boost with log10(N) applied (percent):");
  for (const n of sessions) {
    const logN = Math.log10(n);
    const max = 2 * 2 * logN * 100; // 3y × 200 %
    console.log(`    N = ${String(n).padStart(4)}  log10(N)=${logN.toFixed(3)}   ceiling (3y × 200%) = +${f2(max)} %`);
  }
  console.log("");
  console.log("  Ceiling formula: boost ≤ 4 · log10(N) · 100  %");
  console.log("");
}

function printCeiling({ sessions }) {
  const logN = log10n(sessions);
  console.log("");
  console.log(`  N = ${sessions} → log10(N) = ${logN.toFixed(4)}`);
  console.log("  ─────────────────────────────────────────────────────────────");
  for (const lt of LT.filter((r) => r.value > 0)) {
    const row = [];
    for (const lp of LP.filter((r) => r.value > 0)) {
      row.push(`${lp.pct}%:+${f2(lt.value * lp.value * logN * 100)}%`);
    }
    console.log(`  ${lt.label.padEnd(4)} ${row.join("  ")}`);
  }
  console.log("  ─────────────────────────────────────────────────────────────");
  console.log(`  Absolute ceiling: +${f2(4 * logN * 100)} %  (3 years × 200 %)`);
  console.log("");
}

function printSolve(boost) {
  const combos = solveBoost(boost);
  console.log("");
  console.log(`  A displayed boost of +${f2(boost)} % is under-determined.`);
  console.log(`  It equals Lt · Lp · log10(N) = ${(boost / 100).toFixed(4)}, and ${combos.length} official combination(s)`);
  console.log("  reproduce it within a plausible mining history (N ≤ 20 000 sessions):\n");
  console.log("  duration  Lt    percentage  Lp     log10(N)   implied N");
  console.log("  " + "-".repeat(58));
  for (const c of combos) {
    console.log(
      `  ${c.duration.padEnd(9)} ${String(c.lt).padEnd(5)} ${String(c.percentage + "%").padEnd(11)} ${String(c.lp).padEnd(6)} ${c.log10N.toFixed(4).padEnd(10)} ${c.sessions}`,
    );
  }
  console.log("");
  if (combos.length > 1) {
    console.log("  You cannot recover the settings from the headline number alone.");
  } else {
    console.log("  With this bound, the combination is unique — but only because of the bound,");
    console.log("  not because the formula distinguishes the settings.");
  }
  console.log("");
}

function printMulti({ spec, lb, sessions }) {
  const lockups = spec.split(",").map((part) => {
    const [dur, amount] = part.split(":").map((s) => s.trim());
    const lt = parseDuration(dur);
    return { ltValue: lt.value, label: lt.label, amount: Number(amount) };
  });
  const weighted = lockups.reduce((s, l) => s + l.ltValue * l.amount, 0);
  const logN = log10n(sessions);
  const mult = multiLockupMultiplier({ lockups, lb, sessions });
  console.log("");
  console.log("  Multiple lockups:  L(B) = log10(N) · B · Σ(Lt_i · Lc_i) / Lb\n");
  for (const l of lockups) {
    console.log(`    ${l.label.padEnd(4)} × ${String(l.amount).padEnd(10)} π   → Lt·Lc = ${f2(l.ltValue * l.amount)}`);
  }
  console.log(`    ${"".padEnd(4)}   ${"Lb".padEnd(10)}   = ${lb} π`);
  console.log("  " + "-".repeat(50));
  console.log(`    Σ(Lt·Lc) / Lb = ${f2(weighted)} / ${lb} = ${(weighted / lb).toFixed(4)}`);
  console.log(`    log10(N)      = ${logN.toFixed(4)}`);
  console.log(`    L(B) / B      = ${mult.toFixed(4)}  →  +${f2(mult * 100)} %`);
  console.log("");
  console.log("  Stacking lockups averages their duration multipliers (weighted by size);");
  console.log("  it does not create a tier above the ceiling of 4 · log10(N).");
  console.log("");
}

/* ── Offline self-test ───────────────────────────────────────────────────── */

export function runTests() {
  const results = [];
  const eq = (name, got, want, tol = 1e-9) => {
    const ok = typeof want === "number" ? Math.abs(got - want) <= tol : got === want;
    results.push({ name, ok, got, want });
  };

  /* Published anchors: the whitepaper's own example, log(1000) = 3. */
  eq("log10(1000) = 3 (whitepaper example)", log10n(1000), 3);
  eq("Lt 3y = 2", parseDuration("3y").value, 2);
  eq("Lt 2 weeks = 0.1", parseDuration("2w").value, 0.1);
  eq("Lp 200% = 2", parsePercentage(200).value, 2);
  eq("Lp 90% = 0.9", parsePercentage(90).value, 0.9);

  /* Ceiling: 3 years × 200 % × log10(1000) = 12 */
  eq("ceiling multiplier at N=1000", lockupMultiplier({ ltValue: 2, lpValue: 2, sessions: 1000 }), 12);
  eq("ceiling boost at N=1000 = +1200%", boostPercent({ ltValue: 2, lpValue: 2, sessions: 1000 }), 1200);

  /* The worked example used in the docs: 3y × 100 % with N≈630 → +559.90 % */
  const ex = boostPercent({ ltValue: 2, lpValue: 1, sessions: 630 });
  eq("3y × 100% at N=630 ≈ +559.90%", Number(ex.toFixed(2)), 559.9, 0.05);

  /* Inversion must find the documented combination set for 559.90. */
  const combos = solveBoost(559.90);
  const has3y100 = combos.some((c) => c.duration === "3y" && c.percentage === 100);
  const has1y200 = combos.some((c) => c.duration === "1y" && c.percentage === 200);
  eq("solve(559.90) contains 3y/100%", has3y100, true);
  eq("solve(559.90) contains 1y/200%", has1y200, true);
  eq("solve(559.90) is not unique", combos.length > 1, true);

  /* Multiple-lockup example from FORMULA.md §5 → +443.1 % */
  const multi = multiLockupMultiplier({
    lockups: [{ ltValue: 2, amount: 600 }, { ltValue: 1, amount: 300 }],
    lb: 1000,
    sessions: 900,
  });
  eq("multi-lockup example ≈ +443.1%", Number((multi * 100).toFixed(1)), 443.1, 0.05);

  /* Tiers only: 95 % must fall back to 90 %, never interpolate. */
  const p95 = parsePercentage(95);
  eq("95% → nearest tier 90%", p95.value, 0.9);
  eq("95% is flagged inexact", p95.exactMatch, false);

  /* No mining → no reward (whitepaper §S1.5). */
  eq("L(B)=0 when B=0", 0 * lockupMultiplier({ ltValue: 2, lpValue: 2, sessions: 1000 }), 0);

  /* Invalid inputs are rejected, not silently coerced. */
  const throws = (name, fn) => {
    let threw = false;
    try { fn(); } catch { threw = true; }
    results.push({ name, ok: threw, got: threw, want: true });
  };
  throws("rejects 250%", () => parsePercentage(250));
  throws("rejects unknown duration", () => parseDuration("5y"));
  throws("rejects N=0", () => log10n(0));

  const passed = results.filter((r) => r.ok).length;
  console.log("");
  for (const r of results) {
    console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : `  (got ${r.got}, want ${r.want})`}`);
  }
  console.log("");
  console.log(`  ${passed}/${results.length} checks passed`);
  console.log("");
  return { passed, total: results.length, results };
}

/* ── Entry point ─────────────────────────────────────────────────────────── */

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`
  lockup-math.mjs — official Pi lockup formula, offline

    --lp <pct>        lockup percentage (0, 25, 50, 90, 100, 150, 200)
    --duration <d>    lockup duration (0, 2w, 6m, 1y, 3y)
    --sessions <n>    total previous mining sessions N (default 630)
    --lb <amount>     migrated mining balance Lb (for --multi)
    --multi <spec>    "3y:600,1y:300"  multiple lockups
    --solve <boost>   list (duration, percentage, N) triples matching a boost
    --ceiling         show every official combination at one N
    --table           show Lt·Lp for all combinations
    --test            run offline assertions
    --help            this text
`);
    return 0;
  }

  if (args.test) {
    const { passed, total } = runTests();
    return passed === total ? 0 : 1;
  }

  if (args.table) { printTable(); return 0; }

  if (args.solve) {
    const boost = Number(args.solve);
    if (!Number.isFinite(boost)) { console.error("--solve needs a number, e.g. --solve 559.90"); return 1; }
    printSolve(boost);
    return 0;
  }

  if (args.multi) {
    const lb = Number(args.lb ?? 1000);
    const sessions = Number(args.sessions ?? 630);
    printMulti({ spec: String(args.multi), lb, sessions });
    return 0;
  }

  const sessions = Number(args.sessions ?? args.n ?? 630);
  const lt = parseDuration(args.duration ?? args.d ?? "3y");

  if (args.ceiling) { printCeiling({ sessions }); return 0; }

  const lp = parsePercentage(args.lp ?? args.percentage ?? 100);
  printSingle({ lt, lp, sessions, exactMatch: lp.exactMatch, requested: lp.requested });
  return 0;
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href;
if (isDirectRun) process.exit(main());
