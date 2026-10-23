# Audit request — try to break this

This repository makes a small number of claims and states, for each, what would refute it. If you can
falsify one, open an issue with the evidence; that is the intended workflow.

## 10-minute refutation checklist

| # | Try this | If it fails, then |
|---|---|---|
| 1 | Find a published Pi lockup formula that is **not** `L(B) = Lt·Lp·log(N)·B` | `FORMULA.md` §1 and SCOPE A1 are wrong |
| 2 | Show that `Lt` for 2 weeks is not `0.1`, or for 3 years not `2` | SCOPE A2 is wrong |
| 3 | Show that `log(N)` is natural log, not base 10 | SCOPE A1/A7 and every worked example are wrong |
| 4 | Show an official statement that the mining-app setting locks mobile balance **before** migration | SCOPE A5 is wrong |
| 5 | Find an official early-unlock path | SCOPE A6 is wrong |
| 6 | Produce an official `PiPower_Baseline` number | SCOPE A9 is wrong (this would be good news) |
| 7 | Show a `locked π` asset code/issuer on Pi Mainnet | SCOPE A10 is wrong |
| 8 | Re-run the census and get terms that differ from `1209600 / 15778476 / 31556952 / 94670856` by more than 1 s, at scale | SCOPE A11 is wrong |
| 9 | Show that the **wallet** Create Lockup uses something other than a time predicate on a native claimable balance | `TWO-LOCKUPS.md` §"What this means on-chain" overreaches |
| 10 | Show the 2-week `× 25 %` display is correct **and** reconcile it with `Lt = 0.1` | `FORMULA.md` §7 stops being an open question |

Commands:

```bash
node examples/lockup-math.mjs --test
node examples/inspect-lockups.mjs --self-test
node examples/lockup-census.mjs --self-test
node examples/lockup-census.mjs --sample 2000
```

## Where this repo is most likely to be wrong

Ranked honestly, most fragile first:

1. **The `× 25 %` wallet display** ([FORMULA.md](FORMULA.md) §7). It is one observation, on one account, in
   one locale, with no screenshot published here. It may be a misreading of which row the percentage belongs to.
   This is the weakest claim in the repo and is *labelled* as unresolved for exactly that reason.
2. **The PiPower date ambiguity** ([PIPOWER.md](PIPOWER.md) §3). Our reading that the RFC is ambiguous could be
   wrong if an official FAQ elsewhere disambiguates it. We looked; we did not find one. Absence of evidence
   is not evidence of absence.
3. **`last_modified_time` ≈ creation time** ([ONCHAIN-CENSUS.md](ONCHAIN-CENSUS.md) §1). If many lockups are
   modified after creation (e.g. sponsor changes), a share of the "other" bucket is actually a lockup with a
   shifted term. This *understates* the match rate, so it does not inflate the finding — but it is an assumption.
4. **Sample representativeness.** The census samples the *newest* 2 000 balances. Tier shares would move with a
   different sampling strategy. The **constants** are unaffected; the **shares** are indicative only.

## What is explicitly not auditable here

- Intent, ownership, or identity of any address.
- The correctness of Pi's off-chain boost accounting.
- Legal classification of Pi or of lockups in any jurisdiction.
- Anything about price.

## Reviewer notes

- Every numeric claim is reproducible from a public GET endpoint and a zero-dependency script.
- No script writes, signs, or transmits keys. See [SECURITY.md](../SECURITY.md).
- If you find a claim stated more strongly than its source allows, that is a bug of the same severity as a
  factual error. Report it.
