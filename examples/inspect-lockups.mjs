#!/usr/bin/env node
/**
 * inspect-lockups.mjs — show what is *actually* time-locked on-chain for an address.
 *
 * Read-only. No wallet connection, no passphrase, no keys, no signing, no writes.
 * Zero dependencies: uses Node's built-in fetch (Node >= 18).
 *
 * What it does
 *   1. GET /accounts/{G}                         -> native balance + subentries
 *   2. GET /claimable_balances?claimant={G}       -> balances this account may claim
 *   3. decodes each predicate into a human unlock date
 *
 * What it does NOT do
 *   · claim anything
 *   · assert that the Pi wallet's "Create Lockup" produced a given balance
 *   · infer your mining-app setting (that is off-chain state, not on a ledger)
 *
 * Usage
 *   node examples/inspect-lockups.mjs G...
 *   node examples/inspect-lockups.mjs G... --json
 *   node examples/inspect-lockups.mjs --self-test       (offline predicate decoder tests)
 */

const HORIZON = "https://api.mainnet.minepi.com";

/* ── StrKey sanity check (a G address is 56 chars, base32, starts with G) ── */

export function isAccountId(value) {
  return typeof value === "string" && /^G[A-Z2-7]{55}$/.test(value);
}

/* ── Predicate decoding ──────────────────────────────────────────────────── */

/**
 * Turn a Stellar claim predicate into semantic intervals.
 * Returns { always, notBefore, notAfter, nested, raw } — see README for the
 * `not { abs_before: T }` = "only after T" convention.
 */
export function describePredicate(predicate, now = new Date()) {
  if (!predicate || predicate.unconditional === true) {
    return { always: true, notBefore: null, notAfter: null, raw: "unconditional" };
  }
  if (predicate.abs_before) {
    return {
      always: false,
      notBefore: null,
      notAfter: new Date(predicate.abs_before),
      raw: `abs_before ${predicate.abs_before}`,
    };
  }
  if (predicate.not) {
    const inner = describePredicate(predicate.not, now);
    if (inner.notAfter) {
      /* not(claimable before T) === claimable only from T onwards */
      return {
        always: false,
        notBefore: inner.notAfter,
        notAfter: null,
        raw: `not(abs_before ${predicate.not.abs_before}) => unlock at ${inner.notAfter.toISOString()}`,
      };
    }
    return { always: false, notBefore: inner.notBefore, notAfter: null, raw: `not(${inner.raw})` };
  }
  if (predicate.and || predicate.or) {
    const key = predicate.and ? "and" : "or";
    const parts = predicate[key].map((p) => describePredicate(p, now));
    const starts = parts.map((p) => p.notBefore).filter(Boolean);
    const ends = parts.map((p) => p.notAfter).filter(Boolean);
    const notBefore = key === "or" ? pick(starts, Math.min) : pick(starts, Math.max);
    const notAfter = key === "or" ? pick(ends, Math.max) : pick(ends, Math.min);
    return {
      always: false,
      notBefore,
      notAfter,
      raw: `${key}(${parts.map((p) => p.raw).join(", ")})`,
    };
  }
  return { always: false, notBefore: null, notAfter: null, raw: JSON.stringify(predicate) };
}

function pick(list, fn) {
  if (!list.length) return null;
  return list.reduce((a, b) => (fn(a, b) ? a : b));
}

/** Is the balance claimable right now? */
export function isClaimableNow(desc, now = new Date()) {
  if (desc.always) return true;
  if (desc.notBefore && now < desc.notBefore) return false;
  if (desc.notAfter && now >= desc.notAfter) return false;
  return true;
}

/** Human-friendly "in 43 days" / "184 days ago". */
export function relativeDays(date, now = new Date()) {
  const diffMs = date.getTime() - now.getTime();
  const days = Math.round(diffMs / 86400000);
  if (days === 0) return "today";
  if (days > 0) return `in ${days} day${days === 1 ? "" : "s"}`;
  return `${-days} day${days === -1 ? "" : "s"} ago`;
}

/* ── Horizon access (GET only) ───────────────────────────────────────────── */

async function get(path) {
  const res = await fetch(`${HORIZON}${path}`, { headers: { accept: "application/json" } });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`GET ${path} → HTTP ${res.status}\n${body.slice(0, 400)}`);
  }
  return JSON.parse(body);
}

async function fetchAccount(address) {
  try {
    return await get(`/accounts/${address}`);
  } catch (err) {
    if (String(err.message).includes("HTTP 404")) return null;
    throw err;
  }
}

async function fetchClaimable(address) {
  const out = [];
  let path = `/claimable_balances?claimant=${encodeURIComponent(address)}&limit=200&order=desc`;
  /* Follow pages defensively: stop after 20 pages (4 000 records). */
  for (let page = 0; page < 20 && path; page++) {
    const body = await get(path);
    out.push(...(body._embedded?.records || []));
    const next = body._links?.next?.href;
    path = next ? next.replace(HORIZON, "") : null;
  }
  return out;
}

/* ── Reporting ───────────────────────────────────────────────────────────── */

function formatAmount(value) {
  return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 7 });
}

function report({ address, account, claimables, json, now }) {
  const rows = claimables
    .filter((cb) => cb.asset === "native")
    .map((cb) => {
      const mine = (cb.claimants || []).find((c) => c.destination === address);
      const desc = describePredicate(mine?.predicate, now);
      return {
        id: cb.id,
        amount: Number(cb.amount),
        claimableNow: isClaimableNow(desc, now),
        unlockAt: desc.notBefore ? desc.notBefore.toISOString() : null,
        expiresAt: desc.notAfter ? desc.notAfter.toISOString() : null,
        predicate: mine?.predicate ?? null,
        raw: desc.raw,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const lockedTotal = rows.filter((r) => !r.claimableNow).reduce((s, r) => s + r.amount, 0);
  const claimableTotal = rows.filter((r) => r.claimableNow).reduce((s, r) => s + r.amount, 0);
  const free = Number(account?.balances?.find((b) => b.asset_type === "native")?.balance ?? 0);

  if (json) {
    console.log(JSON.stringify({
      address,
      exists: Boolean(account),
      freeBalance: free,
      timeLockedTotal: lockedTotal,
      claimableNowTotal: claimableTotal,
      entries: rows,
      note: "time-locked = native claimable balance whose predicate forbids claiming before a date",
    }, null, 2));
    return;
  }

  console.log("");
  console.log(`  Address  ${address}`);
  console.log(`  Horizon  ${HORIZON}`);
  console.log("  " + "─".repeat(66));

  if (!account) {
    console.log("  Account not found on Pi Mainnet (never funded, or not migrated yet).");
    console.log("");
    return;
  }

  console.log(`  Free native balance        ${formatAmount(free)} π`);
  console.log(`  Time-locked (not yet)      ${formatAmount(lockedTotal)} π   in ${rows.filter((r) => !r.claimableNow).length} entr${rows.filter((r) => !r.claimableNow).length === 1 ? "y" : "ies"}`);
  console.log(`  Claimable now              ${formatAmount(claimableTotal)} π`);
  console.log(`  Subentries                 ${account.subentry_count ?? "?"}`);
  console.log("");

  if (!rows.length) {
    console.log("  No native claimable balances reference this address as a claimant.");
    console.log("");
    console.log("  Read this as: nothing time-locked is visible with this primitive for this");
    console.log("  address. It does NOT mean a lockup is impossible — a mining-app lockup");
    console.log("  setting only materialises at migration, and other implementations exist.");
    console.log("");
    return;
  }

  console.log("  Time-locked entries (asset is always \"native\" — no special π type):");
  console.log("");
  for (const row of rows) {
    const state = row.claimableNow ? "unlocked" : "LOCKED";
    const when = row.unlockAt
      ? `unlock ${row.unlockAt.slice(0, 10)} (${relativeDays(new Date(row.unlockAt), now)})`
      : row.expiresAt
        ? `expires ${row.expiresAt.slice(0, 10)}`
        : "no time bound";
    console.log(`    ${state.padEnd(8)} ${formatAmount(row.amount).padStart(16)} π   ${when}`);
    console.log(`             ${row.raw}`);
  }
  console.log("");
  console.log("  Reminder: this proves a time lock exists on-chain. It does not prove which");
  console.log("  button created it, and it cannot show your off-chain mining-app setting.");
  console.log("");
}

/* ── Offline tests for the decoder ───────────────────────────────────────── */

export function selfTest() {
  const results = [];
  const eq = (name, got, want) => results.push({ name, ok: JSON.stringify(got) === JSON.stringify(want), got, want });

  const t0 = new Date("2026-01-01T00:00:00Z");
  const t1 = new Date("2027-01-01T00:00:00Z");

  eq("unconditional is always claimable",
    describePredicate({ unconditional: true }, t0).always, true);

  eq("abs_before has no unlock date",
    describePredicate({ abs_before: "2027-01-01T00:00:00Z" }, t0).notBefore, null);

  const notBefore = describePredicate({ not: { abs_before: "2027-01-01T00:00:00Z" } }, t0);
  eq("not(abs_before) becomes an unlock date",
    notBefore.notBefore instanceof Date ? notBefore.notBefore.toISOString() : null,
    "2027-01-01T00:00:00.000Z");
  eq("not(abs_before) is not claimable before that date", isClaimableNow(notBefore, t0), false);
  eq("not(abs_before) is claimable after that date", isClaimableNow(notBefore, t1), true);

  const andPred = describePredicate({
    and: [
      { not: { abs_before: "2026-06-01T00:00:00Z" } },
      { abs_before: "2028-06-01T00:00:00Z" },
    ],
  }, t0);
  eq("and() takes the later start",
    andPred.notBefore?.toISOString(), "2026-06-01T00:00:00.000Z");
  eq("and() takes the earlier end",
    andPred.notAfter?.toISOString(), "2028-06-01T00:00:00.000Z");

  eq("relativeDays future", relativeDays(new Date("2026-02-10T00:00:00Z"), t0), "in 40 days");
  eq("relativeDays past", relativeDays(new Date("2025-12-02T00:00:00Z"), t0), "30 days ago");
  eq("relativeDays same day", relativeDays(t0, t0), "today");

  eq("rejects a bad address", isAccountId("G123"), false);
  eq("accepts a well-formed account ID",
    isAccountId("GABT7EMPGNCQSZM22DIYC4FNKHUVJTXITUF6Y5HNIWPU4GA7BHT4GC5G"), true);
  eq("rejects an M (muxed) address",
    isAccountId("MABT7EMPGNCQSZM22DIYC4FNKHUVJTXITUF6Y5HNIWPU4GA7BHT4GC5G"), false);

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

/* ── Entry point ─────────────────────────────────────────────────────────── */

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--self-test") || argv.includes("--offline")) {
    const { passed, total } = selfTest();
    return passed === total ? 0 : 1;
  }
  const address = argv.find((a) => !a.startsWith("--"));
  const json = argv.includes("--json");

  if (!address) {
    console.log(`
  inspect-lockups.mjs — read-only view of time-locked π for an address

    node examples/inspect-lockups.mjs G...           human report
    node examples/inspect-lockups.mjs G... --json    machine-readable
    node examples/inspect-lockups.mjs --self-test    offline decoder tests

  GET-only against ${HORIZON}. No keys, no signing, no writes.
`);
    return 1;
  }
  if (!isAccountId(address)) {
    console.error(`Not a valid Pi account ID: "${address}"\nExpected 56 chars, starting with G, base32 alphabet A-Z2-7.`);
    return 1;
  }

  const now = new Date();
  const [account, claimables] = await Promise.all([fetchAccount(address), fetchClaimable(address)]);
  report({ address, account, claimables, json, now });
  return 0;
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href;
if (isDirectRun) {
  main().then((code) => process.exit(code)).catch((err) => {
    console.error("\n  Error:", err.message, "\n");
    process.exit(1);
  });
}
