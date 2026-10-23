# Scope — claim by claim

The precise claims of this repository. Anything not listed as **Proven** or **Observable** is not claimed.

## A. Proven (from official documents, arithmetic, or protocol rules)

| # | Claim | Evidence | Falsifier |
|---|---|---|---|
| A1 | The lockup reward is `L(B) = Lt · Lp · log(N) · B` | S1.1 | a published formula that differs |
| A2 | `Lt` values are `0, 0.1, 0.5, 1, 2` for `0, 2w, 6m, 1y, 3y` | S1.2 | an official table with other values |
| A3 | `Lp` equals the lockup percentage as a fraction, `0 → 0` … `200 % → 2` | S1.3 | an official table with other values |
| A4 | The lockup term is **added to the mining rate** and yields nothing when `B = 0` | S1.5 | a statement that lockup pays interest on the balance |
| A5 | The mining-app setting applies **at migration**, not before | S1.6 | an official statement that the setting locks mobile balance |
| A6 | A confirmed lockup is **irreversible for its term** | S1.7 | an official early-unlock mechanism |
| A7 | `boost % = Lt · Lp · log10(N) · 100`, so a single boost figure does **not** determine `(Lt, Lp, N)` | arithmetic, §3 of FORMULA.md | a published one-to-one mapping from boost to settings |
| A8 | PiPower is a **capacity to participate**, computed from stake share plus a baseline addend | S2 | a statement that PiPower is a coin or a payout |
| A9 | `PiPower_Baseline` has **no published value** | S2 ("will be calibrated") | a published constant |
| A10 | Locked native π is still **native**; time-locking is a **state** (predicate), not an asset type | S3 + S4 | a `locked` asset code / issuer on Pi |
| A11 | The four lockup durations are stored on-chain as exact second counts based on a **Julian year** (`1y = 31 556 952 s`; `6m = 1y/2`; `3y = 1y×3`) | S6 census | a sample where the terms differ from those constants |

## B. Observable (reproducible, but environment-dependent)

| # | Claim | How to check |
|---|---|---|
| B1 | Pi Mainnet exposes native claimable balances with time predicates | `curl "https://api.mainnet.minepi.com/claimable_balances?limit=1"` |
| B2 | A given address's time-locked balances can be enumerated and decoded | `node examples/inspect-lockups.mjs G…` |
| B3 | The mining-app screen offers durations 2w/6m/1y/3y and percentages up to 200 % | open the app; see S5 |
| B4 | The wallet screen states its lockup is immediate and independent of the app setting | open the wallet; see S5 |
| B5 | ~85 % of a 2 000-balance sample of the newest native claimable balances carry one of the four official terms, to the second | `node examples/lockup-census.mjs --sample 2000` |

B-class claims can go stale. Each is dated in [SOURCES.md](SOURCES.md).

## C. Explicitly **not** claimed

| Not claimed | Note |
|---|---|
| Any price, market cap, or "value of a boost" | out of scope, and unknowable from the mechanism |
| Any APY / yield / interest figure | no interest is paid at all (A4) |
| A "best" lockup setting | depends on `N`, `B`, liquidity needs, and goals we do not know |
| That the PiPower baseline is **live** in the Launchpad | S2 is an RFC, "subject to further revisions" |
| Which screen qualifies for the ≥ 90 % rule | S2 does not map "active Pi lockup" onto either screen |
| That the wallet's Create Lockup uses the claimable-balance primitive | plausible and checkable per address, not established |
| That the 2-week / `× 25 %` wallet display is correct or a bug | unresolved, see FORMULA.md §7 |
| That this analysis is audited | it is not; see [AUDIT-REQUEST.md](AUDIT-REQUEST.md) |
| Anything about a specific person's account | no account data is collected or stored |

## D. The one-line claim

> **A Pi lockup changes your mining rate (and, for the top tier, a calibrated participation baseline) —
> it does not change what a π is, and it does not pay interest.**

No more, no less.
