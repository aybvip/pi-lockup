# PiPower and the "≥ 90 % for 3 years" rule

A short, precise reading of the only official text that mentions a long-term-locker privilege — and an
explicit list of what it does **not** settle.

## 1. The text

PiRC1 (Ecosystem Token Design), §3 *Participation Window*:

> **Baseline PiPower Rule for only the highest tier of the Long-Term Lockers**
>
> "Any user with an **active Pi lockup of ≥90% of their mined tokens for at least 3 years at the time of a
> token launch created before February 20, 2026** automatically receives a standardized, platform-defined
> baseline PiPower `PiPower_Baseline`. The time limit was to prevent future accounts created to exploit this
> baseline PiPower, and to acknowledge Long-Term Lockers with high percentages who may not have enough Pi
> unlocked to participate in the launchpad. **The number for `PiPower_Baseline` will be calibrated.**"

Source: <https://github.com/PiNetwork/PiRC/blob/main/PiRC1/3-participation.md> (retrieved 2026-10-23).

## 2. What PiPower is, in the RFC's own maths

```
PiPower_i = T_available × ( StakedPi_i / Σ StakedPi + PiPower_Baseline )
```

- `T_available` — tokens the project puts into the launch.
- `StakedPi_i / Σ StakedPi` — your share of the **stake pool** during the participation window.
- `PiPower_Baseline` — the **only** addend that is not proportional to what you stake.

PiPower "strictly determines the **maximum number of tokens** they can commit to buy in the launch."
It is a **capacity to participate**, denominated in tokens-for-sale — not π, not money, not yield.

## 3. The ambiguity nobody quotes

> "at the time of a token launch created before February 20, 2026"

`created` can attach to two different nouns:

| Reading | The rule applies when… | Consistency check |
|---|---|---|
| **A — launch-created** | the **token launch** was created before 2026-02-20 | matches "at the time of a token launch", but the rationale ("prevent future accounts created to exploit") is about *accounts*, not launches |
| **B — lockup-created** | the **lockup** was created before 2026-02-20 | matches the rationale, but is an unusual way to write "a lockup created before…" |

The RFC does not disambiguate, and the rationale sentence appeals to *accounts created* — a third noun.
**We do not resolve this.** Anyone asserting a definite reading is adding information that is not in the text.

What *would* settle it, and how you would know:

1. a Launchpad UI that shows/hides the baseline for a given account, with the account's lockup dates visible;
2. an official FAQ sentence that names which object the date qualifies;
3. a token launch whose creation date straddles 2026-02-20 and a locker whose lockup date straddles it in
   the opposite direction — the two readings then predict different outcomes.

## 4. What the rule is **not**

| Popular claim | Status |
|---|---|
| "Lock 90 % for 3 years and you get free Pi" | ❌ No. It grants **baseline PiPower**, a participation capacity. |
| "The baseline is X PiPower" | ❌ No number is published. "Will be calibrated" is the entire specification. |
| "This is already live in the Launchpad" | ⚠️ Unproven. The text is a **Request for Comment**, and Pi explicitly frames the designs as subject to revision. |
| "It only counts mining-app lockups" / "only wallet lockups" | ⚠️ Unstated. The RFC says "active Pi lockup of ≥ 90 % of their mined tokens", which does not map onto either screen by name. |
| "It's a reward for loyalty, so it must be unconditional" | ❌ It is explicitly conditional on the launch date clause, the ≥ 90 % level, and ≥ 3 years. |

## 5. Why the rule exists (the RFC's own reason)

> "to acknowledge Long-Term Lockers with high percentages who may not have enough Pi unlocked to
> participate in the launchpad"

This is the design logic, and it is worth stating plainly: a Pioneer who locked **90 %+ for 3 years** has
very little *free* π, so a pure stake-proportional rule would exclude exactly the people who locked the
longest. The baseline is an **anti-exclusion device**, not a bonus.

That also explains why the value is left to calibration: it must be large enough to matter for a
small-balance locker, and small enough not to distort the pool for everyone else.

## 6. How to quote this correctly

✅ "PiRC1 proposes a platform-calibrated baseline PiPower for accounts with an active lockup of ≥ 90 % of
mined tokens for at least 3 years, tied to a launch/lockup created before Feb 20 2026; the value is not
published."

❌ "Pi gives extra PiPower to anyone who locks 90 % for 3 years."
❌ "The 90 % rule gives free Pi."
❌ "PiPower is a coin."

## 7. Cross-reference

This repository's sibling project on fungibility established that locked π is still **native π** in a
different **state**. PiPower does not change that: it is an **account-bound privilege computed off-chain**,
not a second asset. See `docs/TWO-LOCKUPS.md` § "What this means on-chain".
