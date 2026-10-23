# The lockup formula — worked out, with the traps

Everything here is arithmetic on the official formula. No new assumptions.

## 1. The formula

December 2021 whitepaper, *Token Model and Mining* → **Lockup Reward**:

```
L(B) = Lt · Lp · log(N) · B
```

| symbol | meaning | source |
|---|---|---|
| `B` | system-wide base mining rate for the day | whitepaper |
| `Lt` | duration multiplier | table below |
| `Lp` | percentage multiplier | table below |
| `log(N)` | decimal log of **total previous mining sessions** | whitepaper ("Log(1,000) = 3") |
| `L(B)` | the lockup term **added to** the mining rate | whitepaper |

### Duration multiplier `Lt`

| chosen duration | `Lt` |
|---|---|
| 0 (no lockup) | 0 |
| 2 weeks | 0.1 |
| 6 months | 0.5 |
| 1 year | 1 |
| 3 years | 2 |

### Percentage multiplier `Lp`

| lockup % of `Lb` (migrated mining balance) | `Lp` |
|---|---|
| 0 % | 0 |
| 25 % | 0.25 |
| 50 % | 0.5 |
| 90 % | 0.9 |
| 100 % | 1.0 |
| 150 % | 1.5 |
| 200 % | 2.0 |

## 2. What the app calls a "boost"

The UI shows an **estimated lockup boost**, which is just the lockup term normalised by the base rate:

```
boost% = (L(B) / B) × 100 = Lt · Lp · log10(N) × 100
```

So `+559.90 %` means:

```
Lt · Lp · log10(N) = 5.5990
```

## 3. Why a single boost number is under-determined

`5.5990` is **one equation with three unknowns**. Several quite different settings produce it:

| `Lt` (duration) | `Lp` (%) | implied `log10(N)` | implied sessions `N` |
|---|---|---|---|
| 2 (3 years) | 1.0 (100 %) | 2.7995 | ≈ 630 |
| 2 (3 years) | 0.9 (90 %) | 3.1106 | ≈ 1 290 |
| 1 (1 year) | 2.0 (200 %) | 2.7995 | ≈ 630 |
| 2 (3 years) | 2.0 (200 %) | 1.3998 | ≈ 25 |

**Consequence:** you cannot recover someone's lockup settings from their boost percentage alone, and you
cannot compare two Pioneers' boosts without knowing `N`. Any claim of the form *"my +560 % proves I locked
100 % for 3 years"* is an inference, not a fact.

Ask the script to do the inversion:

```bash
node examples/lockup-math.mjs --solve 559.90
node examples/lockup-math.mjs --lp 100 --duration 3y --boost 559.90   # infer N
```

## 4. The ceiling

`Lt ≤ 2` and `Lp ≤ 2`, so for the mining-app setting:

```
boost% ≤ 4 · log10(N) × 100
```

| sessions `N` | `log10(N)` | max boost (3 y × 200 %) |
|---|---|---|
| 30 | 1.48 | +591 % |
| 100 | 2.00 | +800 % |
| 365 | 2.56 | +1 024 % |
| 1 000 | 3.00 | +1 200 % |
| 3 000 | 3.48 | +1 390 % |

Two practical notes:

- The **knee** is early. Doubling your mining history adds `0.3` to `log10(N)` — about `+120` points of
  boost at the cap — not a doubling.
- The whitepaper caps the **migration-time** setting at **100 %** of the transferable balance
  ("a maximum of 100 % of their transferable balance from mobile to Mainnet"), and reserves the
  **200 %** allowance for the later, on-Mainnet interface: "Pioneers can lock up as much as 200 % of their
  already-transferred Mainnet balance … The additional lockup allowance … can come from utility-based Pi
  apps transactions."
  → A 200 % option appearing in a *mining-app* screen is therefore **newer than the whitepaper**, not
  something the whitepaper predicted. We flag the difference instead of smoothing it over.

## 5. Multiple lockups

With `i` simultaneous lockups, the whitepaper weighs each by its amount over `Lb`:

```
L(B) = log(N) · B · Σ_i ( Lt_i · Lc_i ) / Lb
```

| quantity | meaning |
|---|---|
| `Lc_i` | amount of lockup `i` |
| `Lt_i` | duration multiplier of lockup `i` |
| `Lb` | Mainnet balance transferred from previous mining |

So stacking a 2-year and a 1-year lockup **averages** their `Lt` values weighted by size — it does not
create a new tier, and it cannot exceed the ceiling in §4 as long as `Σ Lc_i ≤ 2·Lb`.

Worked example:

```
Lt = 2 (3 y), Lc = 600      → weighted term 1200
Lt = 1 (1 y), Lc = 300      → weighted term  300
Lb = 1 000,  N = 900 (log = 2.954)
L(B)/B = 2.954 × (1200 + 300) / 1000 = 2.954 × 1.5 = 4.431  → +443.1 %
```

```bash
node examples/lockup-math.mjs --multi "3y:600,1y:300" --lb 1000 --sessions 900
```

## 6. Two notation traps

| Written | Means | Does **not** mean |
|---|---|---|
| `× 200 %` (duration row) | `Lt = 2` → the lockup term is twice `B` | your balance doubles |
| `+559.90 %` | `L(B)/B = 5.599` | 559.90 % more π in the wallet |
| `× 25 %` on a wallet screen | a displayed rate for that selection | necessarily `Lt = 0.25` (see §7) |

## 7. The unresolved wallet number

Observed in the wallet's *Create Lockup* screen (2026-10-23): a duration row shows `× 100 %` for
**1 year**, which matches `Lt = 1` exactly. Another row shows `× 25 %` for a **2-week** selection, which
does **not** match the whitepaper's `Lt = 0.1` (`× 10 %`).

The [on-chain census](ONCHAIN-CENSUS.md) now shows that a 2-week **term** really does exist on-chain, to the
second — so the odd number is in the *displayed multiplier*, not in the duration. That narrows the problem,
it does not solve it.

We do **not** invent a reconciliation. Three possibilities, all unverified:

1. the wallet screen composites **amount** and **duration** into one rate, and `25 %` refers to the
   amount tier, not the duration;
2. the wallet lockup uses a **different multiplier table** than the mining-app setting (it locks an
   absolute amount rather than a percentage of `Lb`, so `Lp` has no meaning there);
3. one of the two screens is simply exhibiting a display bug.

What is **not** in doubt: the π locked in the wallet is the same native π, and the boost is a rate
multiplier, not a payout. If Pi publishes a wallet-lockup formula, this section should be replaced with it.

## 8. Reproduce everything

```bash
node examples/lockup-math.mjs --lp 100 --duration 3y --sessions 630
node examples/lockup-math.mjs --table
node examples/lockup-math.mjs --ceiling --sessions 1000
node examples/lockup-math.mjs --solve 559.90
node examples/lockup-math.mjs --test        # offline assertions
```
