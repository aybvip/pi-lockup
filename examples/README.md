# Examples

Three scripts, zero dependencies, Node ≥ 18. Nothing here holds or asks for a private key.

| Script | Network | What it does |
|---|---|---|
| [`lockup-math.mjs`](lockup-math.mjs) | **none** | The official formula, the tier tables, the ceiling, inversion of a boost figure, multi-lockup maths, 18 offline assertions |
| [`inspect-lockups.mjs`](inspect-lockups.mjs) | read-only GET | For one address: native balance + every claimable balance where it is a claimant, with the time predicate decoded into an unlock date |
| [`lockup-census.mjs`](lockup-census.mjs) | read-only GET | Samples N recent claimable balances and measures which terms match the four official durations; 17 offline assertions |

## lockup-math.mjs

```bash
node examples/lockup-math.mjs --lp 100 --duration 3y --sessions 630
node examples/lockup-math.mjs --table
node examples/lockup-math.mjs --ceiling --sessions 1000
node examples/lockup-math.mjs --solve 559.90
node examples/lockup-math.mjs --multi "3y:600,1y:300" --lb 1000 --sessions 900
node examples/lockup-math.mjs --test
```

Design choices worth knowing:

- **No interpolation.** The whitepaper defines *tiers*. Asking for `--lp 95` uses the nearest lower tier
  (`90 %`) and prints a warning, because inventing a value between tiers would be fabrication.
- **Bounded inversion.** `--solve` only reports combinations with `N ≤ 20 000` sessions (≈ 54 years of daily
  mining). Without the bound the algebra returns absurd solutions like `N = 10^223`, which are mathematically
  valid and physically meaningless.
- **Percent is not a fraction.** `× 200 %` = `Lt = 2`; the script always prints the multiplier *and* the
  percentage so the two conventions cannot be confused.

## inspect-lockups.mjs

```bash
node examples/inspect-lockups.mjs G...
node examples/inspect-lockups.mjs G... --json
node examples/inspect-lockups.mjs --self-test
```

Prints free balance, time-locked total, claimable-now total, and per-entry unlock dates. It only issues
`GET` requests. If the address has no claimable balances it says so explicitly, and explains why that is
**not** evidence that no lockup exists (a mining-app setting materialises only at migration).

## lockup-census.mjs

```bash
node examples/lockup-census.mjs --sample 2000
node examples/lockup-census.mjs --sample 5000 --json
node examples/lockup-census.mjs --self-test
```

Result and caveats: [`../docs/ONCHAIN-CENSUS.md`](../docs/ONCHAIN-CENSUS.md).

## Running all offline tests

```bash
node examples/lockup-math.mjs --test
node examples/inspect-lockups.mjs --self-test
node examples/lockup-census.mjs --self-test
```

All three exit non-zero on failure, so they chain in CI. See
[`../.github/workflows/self-test.yml`](../.github/workflows/self-test.yml).
