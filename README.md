# π🔒 — What a Pi lockup actually is

> **Independent & unofficial.** Not affiliated with Pi Network. This is a source-verified reading of
> what a Pi lockup does on the ledger, in the mining app, and in the Launchpad/PiPower rules —
> **not** financial advice, and **not** an official product.

[![Independent](https://img.shields.io/badge/Independent-unofficial-orange)](DISCLAIMER.md)
[![Not affiliated with Pi Network](https://img.shields.io/badge/not%20affiliated-Pi%20Network-critical)](DISCLAIMER.md)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](examples/)
[![Read-only](https://img.shields.io/badge/ledger%20access-read--only-blue)](SECURITY.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🌐 Website: <https://aybvip.github.io/pi-lockup/> · 🤖 Machine index: [`llms.txt`](llms.txt) · 📖 [العربية](README.ar.md)

---

## 🎯 TL;DR

A Pi lockup is **a state and a setting — never a different coin.**

| # | Claim | Status |
|---|---|---|
| 1 | A lockup is **time-locked π**, not a new asset, not an IOU, not "locked Pi that trades separately" | ✅ shown from the ledger primitives + whitepaper |
| 2 | The mining-app lockup is a **multiplier on your mining rate**, never on your balance | ✅ `L(B) = Lt · Lp · log(N) · B` (official formula) |
| 3 | There are **two different lockups** that people constantly confuse | ✅ documented below |
| 4 | The wallet lockup **starts boosting from the next mining session** but **does not change** the mining-app lockup config used for your next Mainnet migration | ⚠️ app UI (user-observed); see [docs/TWO-LOCKUPS.md](docs/TWO-LOCKUPS.md) |
| 5 | The PiPower "long-term locker" baseline is a **participation privilege**, not free Pi and not a fixed number | ✅ PiRC1 §3 (quoted verbatim) |
| 6 | A confirmed lockup **cannot be reversed** for its chosen duration | ✅ whitepaper |
| 7 | On-chain, the four durations are stored as **exact second counts derived from a Julian year** (`1y = 31 556 952 s`, not `365 × 86 400`) | ✅ measured, [census](docs/ONCHAIN-CENSUS.md) |

> **The one-sentence version:** locking π buys you a **higher mining rate** (and, for the highest tier,
> a **baseline PiPower** when a launch qualifies) — it never changes what a π *is*.

---

## 🧩 The two lockups people confuse

| | **A — Mining-app lockup (settings)** | **B — Wallet lockup ("Create Lockup")** |
|---|---|---|
| Where | Pi mining app → Lockup settings | Pi Browser wallet → Create Lockup |
| What you choose | a **percentage** of your transferable balance + a **duration** | a **π amount** from your available balance + a **duration** |
| When it takes effect | on your **next transfer to Mainnet** | **immediately** — the π is locked at once |
| Boost starts | applied to the migrated balance | **next mining session** |
| Does it change the other one? | no | **no** — it explicitly does not alter the app setting for the next migration |
| On-chain trace | the resulting lockup balance after migration | a time-locked balance (claimable-balance primitive) |

Both are **the same native π**. The difference is **state**, not asset — see
[`docs/TWO-LOCKUPS.md`](docs/TWO-LOCKUPS.md).

---

## 📐 The official formula (and what it is *not*)

From the **December 2021 whitepaper, "Token Model and Mining" → Lockup Reward**:

```
L(B) = Lt · Lp · log(N) · B
```

| Lockup duration | `Lt` | | Lockup percentage | `Lp` |
|---|---|---|---|---|
| 0 | 0 | | 0% | 0 |
| 2 weeks | 0.1 | | 25% | 0.25 |
| 6 months | 0.5 | | 50% | 0.5 |
| 1 year | 1 | | 90% | 0.9 |
| 3 years | 2 | | 100% | 1.0 |
| | | | 150% | 1.5 |
| | | | 200% | 2.0 |

`log(N)` is the decimal log of your **total previous mining sessions** (≈ 3 for 1 000 sessions).

**Three consequences that are widely misread:**

1. The output is **`L(B)` — a reward term that is added to your mining rate**, not a bonus paid in coins.
   `B` is the base rate; locking does not touch your balance.
2. The multipliers **multiply**: `Lt × Lp`. `3 years` + `100%` = `2 × 1 = 2 → +200%` of `B`,
   and with `log(N) ≈ 2.8` that becomes `≈ +560%`. That is exactly how a real app estimate of
   **+559.90 %** decomposes — see the worked example in [`docs/FORMULA.md`](docs/FORMULA.md).
3. `log(N)` grows **logarithmically**: going from 100 to 1 000 sessions adds `1.0` to the multiplier,
   not `10×`. Long history helps, but it is capped by design.

**Reproduce the arithmetic yourself (offline, deterministic):**

```bash
node examples/lockup-math.mjs --lp 100 --duration 3y --sessions 630
```

---

## 🏛️ PiPower: the ≥90 % / 3-year rule (verbatim)

PiRC1 §3, the only official statement of the "long-term locker" baseline:

> "Any user with an **active Pi lockup of ≥90% of their mined tokens for at least 3 years at the time of
> a token launch created before February 20, 2026** automatically receives a standardized,
> platform-defined baseline PiPower `PiPower_Baseline`. The time limit was to prevent future accounts
> created to exploit this baseline PiPower, and to acknowledge Long-Term Lockers with high percentages
> who may not have enough Pi unlocked to participate in the launchpad. **The number for `PiPower_Baseline`
> will be calibrated.**"

Three things this does **and does not** say:

- ✅ It is a **participation right** (a floor under how many launch tokens you may commit to buy).
- ✅ The value is **not fixed** in the text — "will be calibrated" is the whole specification.
- ⚠️ "**at the time of a token launch created before February 20, 2026**" is genuinely ambiguous:
  does *created* attach to the **launch** or to the **lockup**? The RFC does not disambiguate. We refuse to
  pretend it does — [docs/PIPOWER.md](docs/PIPOWER.md) lays out both readings and what would settle it.

It is **not** free π, **not** a yield, and **not** a guarantee that the mechanism is live in the current
Launchpad build. A proposal is not a deployment.

---

## 🔍 Check your own address (read-only)

```bash
node examples/inspect-lockups.mjs G...YOUR_ADDRESS
```

The script asks Horizon `GET /claimable_balances?claimant=...`, then decodes each **time predicate** into
a human unlock date. If a wallet lockup is expressed with the ledger's time-lock primitive, this is where
it shows up — and if it is not, the script says so instead of guessing.

> `GET /claimable_balances` on Pi Mainnet returns live records with `predicate.abs_before` /
> `predicate.not.abs_before` fields. Verified 2026-10-23.

---

## 📡 On-chain, measured

The docs above say what *should* happen. The ledger says what *does*:

```bash
node examples/lockup-census.mjs --sample 2000
```

Sampling the 2 000 most recent native claimable balances on Pi Mainnet (2026-10-23), **1 708 (85.4 %)**
carry a term equal — **to the exact second** — to one of the four official durations:

| term | seconds | days | share of timed sample |
|---|---:|---:|---:|
| 2 weeks | `1 209 600` | 14 | 39.9 % |
| 6 months | `15 778 476` | 182.6213 | 18.1 % |
| 1 year | `31 556 952` | 365.2425 | 18.9 % |
| 3 years | `94 670 856` | 1095.7275 | 8.5 % |

The year constant is a **Julian year (365.2425 d)** — `365 × 86 400 = 31 536 000`, which is `20 952 s`
shorter than what the chain actually contains. The four tiers are one constant scaled (`6m = 1y / 2`,
`3y = 1y × 3`), not four independent day counts.

→ Method, caveats, and what this does *not* prove: [`docs/ONCHAIN-CENSUS.md`](docs/ONCHAIN-CENSUS.md).

---

## 🚫 What a lockup is **not**

| Misreading | Reality |
|---|---|
| "Locked π is a different token / a receipt / an IOU" | Same native asset. Balances are scalars on an Account model. |
| "Lockup = staking with APY" | No interest is paid. You get a **mining-rate multiplier**; the π itself does not grow. |
| "Locking 200 % gives me 200 % more coins" | `Lp` is a multiplier on `B`. It changes the **rate**, never the **balance**. |
| "It's a guaranteed profit" | It is a rate boost with **no price guarantee** and **no liquidity** until the term ends. |
| "I can unlock early" | "Lockups cannot be reversed once confirmed and must remain locked up for the entirety of the chosen duration." |
| "The 90 % rule gives everyone free PiPower" | It gives eligible lockers a **baseline PiPower**, whose value the RFC leaves to be calibrated. |

---

## 📚 Sources (verified 2026-10-23)

| Source | Used for | Link |
|---|---|---|
| Pi Whitepaper, Dec 2021 — *Token Model and Mining* | `L(B) = Lt·Lp·log(N)·B`, multiplier tables, irreversibility, 100 %/200 % caps | <https://minepi.com/white-paper/> |
| PiRC1 §3 — *Participation Window* | the ≥90 %/3-year baseline PiPower rule, quoted verbatim | <https://github.com/PiNetwork/PiRC/blob/main/PiRC1/3-participation.md> |
| Horizon API — *Claimable Balances* | the time-lock primitive and its `predicate` fields | <https://developers.stellar.org/docs/data/apis/horizon/api-reference/resources/claimable-balances> |
| Pi Mainnet Horizon (live) | confirms native claimable balances with time predicates exist on Pi | <https://api.mainnet.minepi.com/claimable_balances?limit=1> |
| This repo's census (2026-10-23) | the exact on-chain second counts for the four durations | [docs/ONCHAIN-CENSUS.md](docs/ONCHAIN-CENSUS.md) |
| Pi mining-app / wallet UI (observed 2026-10-23) | the two lockup screens, their wording and their independence | marked ⚠️ *observed*, not a documented spec |

Full quotes, retrieval dates, and what each source can/cannot support: [`docs/SOURCES.md`](docs/SOURCES.md).

---

## 🧭 Scope — honest boundaries

**Proven here ✅**

- The lockup reward is a **multiplier on the mining rate** with the exact official tables.
- `Lt × Lp` composes multiplicatively, and the numeric estimate in the app is reproducible from `log(N)`.
- π remains **one native asset** whether locked or free; a lockup is a **state**.
- The PiPower rule exists in PiRC1, with a **calibrated** (i.e. unspecified) value and a genuinely
  ambiguous date clause.

**Not claimed ❌**

- No price prediction, no yield/APY figure, no "best settings" recommendation.
- No claim that the PiPower baseline is **currently live** in the Launchpad.
- No claim about how much any specific screenshot boost is "worth" in fiat.
- Not an audit. Everything is reproducible from public data; see [`docs/AUDIT-REQUEST.md`](docs/AUDIT-REQUEST.md).

See [`docs/SCOPE.md`](docs/SCOPE.md) for the claim-by-claim table.

---

## 🧾 Cite

```bibtex
@misc{pi-lockup,
  title  = {π🔒 — What a Pi lockup actually is},
  author = {aybvip},
  year   = {2026},
  url    = {https://github.com/aybvip/pi-lockup}
}
```

## License

MIT — see [`LICENSE`](LICENSE).
