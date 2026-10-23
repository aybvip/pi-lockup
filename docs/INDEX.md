# Documentation index

Read in this order if you have five minutes; any single file stands alone if you have one.

| # | File | What it answers |
|---|---|---|
| 1 | [../README.md](../README.md) | The whole thing in one page |
| 2 | [FORMULA.md](FORMULA.md) | `L(B) = Lt · Lp · log(N) · B`, worked examples, the ceiling, the two notation traps |
| 3 | [TWO-LOCKUPS.md](TWO-LOCKUPS.md) | Why the mining-app setting and the wallet lockup are different mechanisms |
| 4 | [ONCHAIN-CENSUS.md](ONCHAIN-CENSUS.md) | What the chain actually contains: exact second counts, Julian year, 85.4 % match |
| 5 | [PIPOWER.md](PIPOWER.md) | The ≥90 % / 3-year baseline rule, quoted, plus the ambiguity it hides |
| 6 | [SOURCES.md](SOURCES.md) | Verbatim quotes, retrieval dates, and what each source cannot support |
| 7 | [SCOPE.md](SCOPE.md) | Claim-by-claim: proven / observable / not claimed |
| 8 | [FAQ-OBJECTIONS.md](FAQ-OBJECTIONS.md) | 18 real objections, answered shortly |
| 9 | [AUDIT-REQUEST.md](AUDIT-REQUEST.md) | How to refute this repo in ten minutes |
| 10 | [../examples/](../examples/) | The three runnable scripts |

## By question

**"What does locking actually change?"**
→ [FORMULA.md](FORMULA.md) §2, [FAQ](FAQ-OBJECTIONS.md) #1–#3.

**"I set a lockup and nothing happened."**
→ [TWO-LOCKUPS.md](TWO-LOCKUPS.md) §"Why the mining-app one is a *setting*".

**"Is my address's π really locked?"**
→ [ONCHAIN-CENSUS.md](ONCHAIN-CENSUS.md), then run `examples/inspect-lockups.mjs G…`.

**"Do I qualify for the 90 % PiPower rule?"**
→ [PIPOWER.md](PIPOWER.md) §3 — the RFC does not fully answer this, and pretending otherwise would be wrong.

**"Where is the proof?"**
→ [SOURCES.md](SOURCES.md), then [AUDIT-REQUEST.md](AUDIT-REQUEST.md) to attack it.

## Conventions used everywhere

- `Lb` — Mainnet balance transferred from previous mining.
- `Lc` — amount in a specific lockup.
- `Lt` — duration multiplier (`0, 0.1, 0.5, 1, 2`).
- `Lp` — percentage multiplier (`0 … 2`).
- `N` — total previous mining sessions; `log` is **base 10**.
- ✅ proven · ⚠️ observed/inferred · ❌ not claimed.
