# Sources — verbatim quotes, dates, and what each can support

Every claim in this repository traces to one of the entries below. Where a source cannot support a claim,
it is marked. Retrieved **2026-10-23**.

---

## S1 — Pi Whitepaper, December 2021 (official)

**URL:** <https://minepi.com/white-paper/> → tab **December 2021** → *Token Model and Mining* → *Lockup Reward*
**Publisher:** Pi Network (minepi.com)

### S1.1 The formula

> "The lockup reward formula is reprinted here:
> **L(B) = Lt • Lp • log(N) • B**"

### S1.2 Duration multiplier

> "Lt is the *Lockup Time period multiplier* of B.
> 0 → Lt = 0
> 2 weeks → Lt = 0.1
> 6 months → Lt = 0.5
> 1 year → Lt = 1
> 3 years → Lt = 2"

### S1.3 Percentage multiplier

> "Lp is the *Lockup Percentage multiplier* of B, where the Lockup Percentage is the lockup amount over the
> Mainnet Balance transferred from one's previous mining rewards (Lb)…
> 0% → Lp = 0
> 25% → Lp = 0.25
> 50% → Lp = 0.5
> 90% → Lp = 0.9
> 100% → Lp = 1.0
> 150% → Lp = 1.5
> 200% → Lp = 2"

### S1.4 Mining history

> "log(N) is the logarithmic value of the total number of previous mining sessions (N)."
> "if a Pioneer mined almost everyday for the last 3 years, their total previous mining sessions (N) will be
> about 1,000. In this scenario, Log(1,000) equals 3"

### S1.5 No boost without mining

> "the prerequisite of the lockup reward is that the Pioneer must be actively mining. … there will be no
> lockup rewards if B is 0 (which means the Pioneer is not mining)."

### S1.6 Setting, not a vault

> "Pioneers can decide their lockup duration and lockup percentage of their transferable balance anytime they
> want as an overall account setting in the Pi app. … At the moment of the migration of their Transferable
> Balance to Mainnet, their preselected setting of lockup duration and percentage will automatically apply to
> the amount of balance transferred, resulting in two types of balances on the Mainnet: lockup balance and
> free balance, both of which will be recorded on the Mainnet blockchain…"

> "Any changes to this Pioneer's lockup setting will take effect in their next balance transfer to the
> Mainnet."

### S1.7 Irreversibility

> "lockups cannot be reversed once confirmed and must remain locked up for the entirety of the chosen duration
> due to the nature of blockchain."

### S1.8 Caps: 100 % at migration, 200 % afterwards

> "This account-wide lockup setting allows Pioneers to lock up a maximum of 100% of their transferable balance
> from mobile to Mainnet. After Mainnet launches and Pioneers transfer their balances, Pioneers can also lock
> up more Pi directly on the Mainnet through a slightly different lockup interface later on. At that time,
> Pioneers can lock up as much as 200% of their already-transferred Mainnet balance acquired from their
> previous mining."

### What S1 supports / does not

| ✅ supports | ❌ cannot support |
|---|---|
| the formula, the two multiplier tables, `log(N)` | any wallet-screen multiplier table (not in S1) |
| ≥ 90 % appearing as a *tier* of `Lp` | that 90 % is the PiPower threshold (that is S2, different document) |
| the setting-vs-migrated distinction | the current app's 200 % option on the mining-app screen (S1 says 200 % is the later interface) |
| irreversibility and no-boost-without-mining | any price, yield, or profitability claim |

---

## S2 — PiRC1, §3 *Participation Window* (official RFC)

**URL:** <https://github.com/PiNetwork/PiRC/blob/main/PiRC1/3-participation.md>
**Publisher:** PiNetwork (official GitHub organisation)

> "**Baseline PiPower Rule for only the highest tier of the Long-Term Lockers**
> Any user with an active Pi lockup of ≥90% of their mined tokens for at least 3 years at the time of a token
> launch created before February 20, 2026 automatically receives a standardized, platform-defined baseline
> PiPower `PiPower_Baseline`. The time limit was to prevent future accounts created to exploit this baseline
> PiPower, and to acknowledge Long-Term Lockers with high percentages who may not have enough Pi unlocked to
> participate in the launchpad. The number for `PiPower_Baseline` will be calibrated."

> "`PiPower_i = T_available × (StakedPi_i / Σ StakedPi + PiPower_Baseline)`"

> "PiPower for each participant determines the *maximum* number of tokens they can commit Pi to buy…"

### What S2 supports / does not

| ✅ supports | ❌ cannot support |
|---|---|
| the ≥ 90 % / 3-year baseline exists **as a proposal** | that `PiPower_Baseline` has a published value |
| "calibrated" = no fixed number in the text | which lockup screen qualifies ("active Pi lockup" is not mapped) |
| PiPower = participation capacity | that the feature is live in the current Launchpad build |
| — | a resolution of "at the time of a token launch **created** before…" (see PIPOWER.md §3) |

**RFC status matters:** PiRC1 is a Request for Comment, explicitly "subject to further revisions". Quoting it
as shipped behaviour is a category error.

---

## S3 — Horizon API, Claimable Balances (Stellar protocol)

**URL:** <https://developers.stellar.org/docs/data/apis/horizon/api-reference/resources/claimable-balances>
**Relevance:** Pi uses the Stellar protocol; Pi Mainnet exposes the same Horizon resource.

Fields used by this repo's script:

| field | meaning |
|---|---|
| `asset` | `"native"` for π, or `code:issuer` for a token |
| `amount` | scalar amount, as a string |
| `claimants[].destination` | `G…` account allowed to claim |
| `claimants[].predicate` | time/condition tree: `abs_before`, `not`, `and`, `or`, `unconditional` |
| `sponsor` | account paying the reserve |

### What S3 supports / does not

| ✅ supports | ❌ cannot support |
|---|---|
| that time-locking is expressible as `not { abs_before: T }` | that the Pi **wallet's** Create Lockup uses this exact primitive |
| that the asset stays `native` — no "locked π" asset type | any statement about Pi's UI behaviour |
| how to decode a predicate into an unlock date | who created the balance or why |

---

## S4 — Live Pi Mainnet read (verification, not a document)

**URL:** `https://api.mainnet.minepi.com/claimable_balances?limit=1`
**Retrieved:** 2026-10-23

Observed shape (abridged):

```jsonc
{
  "asset": "native",
  "amount": "2754.7790627",
  "claimants": [
    { "destination": "GC5R…3BNJ", "predicate": { "abs_before": "2022-07-09T07:20:53Z" } },
    { "destination": "GDJG…BX2MB", "predicate": { "not": { "abs_before": "2022-07-09T07:20:53Z" } } }
  ],
  "flags": { "clawback_enabled": false }
}
```

This is **reachability-dependent** evidence: it shows the primitive exists on Pi Mainnet, and it can be
re-run. It says nothing about how many lockups exist or who owns them.

---

## S5 — Product screens (observed, ⚠️ not a spec)

Observed in the Pi app and Pi Browser wallet on **2026-10-23**:

| Screen | Observed text (translated/summarised) | Used for |
|---|---|---|
| Mining app → Lockup settings | "Lock up a portion of your Pi to boost your mining rate… Each adjustment of your settings will take effect on your next transfer to the Mainnet." | the setting-vs-migration wording |
| Mining app → Lockup settings | percentage options 25 / 50 / 90 / 100 / 200 %; durations 2 weeks / 6 months / 1 year / 3 years; an *Estimated Lockup Boost* percentage | that a 200 % option is offered (newer than S1 §S1.8) |
| Wallet → Create Lockup | "This Pi will be locked immediately and you will begin receiving the corresponding mining boost starting from the next mining session. This does not affect the lockup configuration in the mining app for the next Mainnet migration." | the independence claim in TWO-LOCKUPS.md |
| Wallet → Create Lockup | duration rows show a per-selection rate; **1 year → × 100 %**, and a **2-week** selection showed **× 25 %** | the unresolved discrepancy in FORMULA.md §7 |

**S5 is the weakest source class in this repo.** It is a snapshot of a UI that can change without notice,
in one locale, on one account. It cannot establish a formula, and it is explicitly not used to derive one.

---

## S6 — This repository's own measurement (reproducible, not authoritative)

**Artifact:** [`examples/lockup-census.mjs`](../examples/lockup-census.mjs) → [`ONCHAIN-CENSUS.md`](ONCHAIN-CENSUS.md)
**Run:** 2026-10-23, 2 000 most recent native claimable balances.

> Terms matching official durations to the exact second: 2 weeks `1 209 600`, 6 months `15 778 476`,
> 1 year `31 556 952`, 3 years `94 670 856`. 1 708 / 2 000 matched (85.4 %).

### What S6 supports / does not

| ✅ supports | ❌ cannot support |
|---|---|
| the exact on-chain second counts for the four durations | which screen created a given balance |
| that the year constant is 365.2425 days | the boost multiplier applied to a tier |
| that time-locked native balances exist at scale on Pi | population shares (convenience sample of the newest page) |

S6 is **evidence, not authority**: it is this repo's measurement, and re-running it is the test. It is listed
separately so it is never confused with S1–S4.

---

## Deliberately absent sources

| Not used | Why |
|---|---|
| Social media / influencer threads about "lockup APY" | no formula, no accountability, frequently wrong by an order of magnitude |
| Third-party calculators | unverifiable assumptions about `N` and `B` |
| Exchange pages listing Pi | no bearing on the lockup mechanism |

If a source is not here, it does not support a claim in this repo — including claims that happen to be true.
