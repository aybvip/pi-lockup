# Changelog

All notable changes to this repository. Dates are ISO-8601.

## [1.0.0] — 2026-10-23

Initial release.

### Added

- **Formula reference** (`docs/FORMULA.md`): `L(B) = Lt · Lp · log(N) · B`, the official `Lt` / `Lp`
  tables, worked examples, the `4 · log10(N)` ceiling, the multi-lockup weighting, and the two notation
  traps (`× 200 %` vs `+200 %` vs "balance doubles").
- **Two-lockups guide** (`docs/TWO-LOCKUPS.md`): the mining-app *setting* vs the wallet *state*, with the
  whitepaper's own words on migration timing and irreversibility.
- **PiPower reading** (`docs/PIPOWER.md`): the ≥ 90 % / 3-year baseline rule quoted verbatim from PiRC1 §3,
  plus an explicit treatment of the unresolved "created before February 20, 2026" clause.
- **Sources** (`docs/SOURCES.md`): verbatim quotes with retrieval dates and, for each source, what it
  **cannot** support.
- **Scope** (`docs/SCOPE.md`) and **18 objections** (`docs/FAQ-OBJECTIONS.md`).
- **`examples/lockup-math.mjs`**: zero-dependency CLI implementing the formula, the ceiling, bounded
  inversion of a boost figure, and multi-lockup maths — with 18 offline assertions.
- **`examples/inspect-lockups.mjs`**: read-only per-address inspector that decodes claimable-balance time
  predicates into unlock dates — with 13 offline assertions.
- **`examples/lockup-census.mjs`**: read-only census of recent native claimable balances — with 17 offline
  assertions.
- **On-chain census** (`docs/ONCHAIN-CENSUS.md`): first result — the four official durations are stored as
  exact second counts derived from a **Julian year (365.2425 d)**:

  | duration | seconds | days |
  |---|---:|---:|
  | 2 weeks | 1 209 600 | 14 |
  | 6 months | 15 778 476 | 182.6213 |
  | 1 year | 31 556 952 | 365.2425 |
  | 3 years | 94 670 856 | 1095.7275 |

  1 708 of 2 000 sampled native claimable balances (85.4 %) matched one of the four to the second.

### Notes

- CI runs the offline suites on Node 18 / 20 / 22 plus a non-blocking live sample.
- No build step, no runtime dependencies, no bundler.
- The `× 25 %` two-week wallet display remains **unresolved** and is documented as such
  (`docs/FORMULA.md` §7) rather than explained away.
