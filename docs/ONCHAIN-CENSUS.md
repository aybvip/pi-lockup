# On-chain census — how Pi lockups are actually written to the ledger

An empirical measurement, reproducible in one command. It answers a question the documentation does not:
**in what units are the four lockup durations stored on-chain?**

Short answer: **exact second counts derived from a Julian year (365.2425 days).**

## 1. Method (no trust required)

```bash
node examples/lockup-census.mjs --sample 2000
```

1. Page through `GET /claimable_balances?limit=200&order=desc` on Pi Mainnet.
2. Keep native (`"asset": "native"`) balances.
3. Find claimants whose predicate time-locks the balance: `not { abs_before: T }`.
4. Compute the **term** as `T − last_modified_time`.
5. Match the term, **to the second**, against four candidate constants.

`last_modified_time` is the ledger time of the write that produced the balance. For a balance that was
created once and never modified afterwards, `term` **is** the chosen lockup duration — no assumption about
the UI is needed.

## 2. Result

Run on **2026-10-23**, most recent 2 000 native claimable balances:

| Official duration | Term in seconds | In days | Count | Share | Median amount |
|---|---:|---:|---:|---:|---:|
| 2 weeks | `1209600` | 14 | 798 | 39.9 % | 238.79 π |
| 6 months | `15778476` | 182.6213 | 362 | 18.1 % | 225.43 π |
| 1 year | `31556952` | 365.2425 | 378 | 18.9 % | 55.38 π |
| 3 years | `94670856` | 1095.7275 | 170 | 8.5 % | 110.76 π |
| **matched** | | | **1 708** | **85.4 %** | |
| other terms | e.g. `2591981` (≈30 d) | | 292 | 14.6 % | |

**1 708 of 2 000 (85.4 %) matched an official duration to the exact second.**

An earlier run minutes before this one gave 799 / 362 / 379 / 169 = **1 709 (85.5 %)**. The difference is one
entry. That is the honest level of precision: the sample is the *newest* balances, so it moves as new
balances are created.

## 3. The constants

```
2 weeks   =            1 209 600 s  = 14 × 86 400
6 months  =           15 778 476 s  = (365.2425 / 2) × 86 400
1 year    =           31 556 952 s  =  365.2425      × 86 400
3 years   =           94 670 856 s  = (365.2425 × 3)  × 86 400
```

Two structural facts fall out of the numbers:

1. **The year is 365.2425 days** — a Julian year, not 365 days. A naive implementation would write
   `31 536 000 s` for one year; the ledger contains `31 556 952 s`, which is **20 952 s (5 h 49 m) longer**.
   `365.2425 × 86400 = 31 556 952` exactly, so this is not a coincidence or a rounding artifact.
2. **6 months is exactly half a year and 3 years is exactly three years** in the same unit:
   `15 778 476 × 2 = 31 556 952` and `31 556 952 × 3 = 94 670 856`. The tiers are one constant, scaled —
   not four independently-chosen day counts.

The 2-week tier is the odd one out in *kind*: `14 × 86 400` is an exact whole number of days, so it is
consistent with either a day-based or a week-based definition.

## 4. What this settles

| Question | Answer | Status |
|---|---|---|
| Are the wallet's four durations the same four as the whitepaper's `Lt` tiers? | Yes — the on-chain terms are exactly `2 weeks`, `6 months`, `1 year`, `3 years` | ✅ measured |
| Is a wallet lockup a **time predicate on a native balance**? | Yes — `not { abs_before: T }` on `"asset": "native"` | ✅ measured |
| Is 1 year = 365 days? | No — 365.2425 days (`31 556 952 s`) | ✅ measured |
| Is the time-lock expressible without a new asset type? | Yes — no `locked π` asset exists in the sample | ✅ measured |

That last row is the fungibility result, confirmed from the lockup side: **the ledger has no "locked π"
asset.** The only difference between a spendable and a time-locked π is the predicate attached to the
claimable balance.

## 5. What this does **not** settle

| Not settled | Why |
|---|---|
| That every matched entry came from the wallet's *Create Lockup* button | The ledger shows a term, not an origin. Other flows could use the same constants. |
| The **boost multiplier** for each tier | The term is on-chain; `Lt` is applied off-chain to the mining rate. |
| Why the wallet screen showed `× 25 %` for a 2-week selection | Still unexplained — see [FORMULA.md](FORMULA.md) §7. A `2-week` term on-chain does not tell us what multiplier the UI displayed. |
| The **population** share of each tier | The sample is the 2 000 *most recent* balances, not a random sample of all balances, and definitely not a random sample of Pioneers. |
| That all 2 000 are user lockups | 14.6 % carry other terms (clustered at ≈30 days). Some may be payment or app escrows. |
| Anything about a specific person | No addresses are published by this script's default output. |

### On the 30-day cluster

The non-tier terms are dominated by variants of `2 591 9xx s` — i.e. **≈30 days minus 15–32 seconds**.
They are *not* one constant (hundreds of distinct values, each appearing a handful of times), which is what
you would expect from a term computed as "now + 30 days" against a slightly later creation timestamp, rather
than from a fixed duration constant. They are not one of the four lockup tiers and this repo does not
attribute them to a lockup feature.

## 6. Reproduce it

```bash
node examples/lockup-census.mjs                  # human report
node examples/lockup-census.mjs --sample 5000    # bigger sample
node examples/lockup-census.mjs --json           # machine-readable
node examples/lockup-census.mjs --self-test      # 17 offline assertions
```

The self-test is offline and deterministic, so CI can run it without network access. The live sample cannot
be deterministic — a ledger grows.

## 7. Why this matters

Before this measurement, the four durations were known only from the whitepaper's table and the app's
labels. Now there is a **one-command, third-party-verifiable** statement about what the chain actually
contains, down to the second — including the fact that the year constant is a Julian year. That is a
stronger claim than "the UI says 1 year", and it is falsifiable: re-run it, and if the constants change,
this document is wrong.
