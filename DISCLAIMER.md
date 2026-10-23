# Disclaimer

**This repository is independent and unofficial.** It is not affiliated with, endorsed by, sponsored by, or
reviewed by Pi Network, Pi Core Team, SocialChain Inc., or any related entity. "Pi", "π", "Pioneer", and
related marks belong to their owners and are used here only to refer to the subject of the analysis.

## Not financial advice

Nothing here is financial, investment, legal, tax, or accounting advice. No price prediction is made or
implied. Nothing here is a recommendation to buy, sell, hold, lock, or unlock anything.

## What the code does

Every script in `examples/` is **read-only**:

- it issues `GET` requests to a public Horizon endpoint, or does local arithmetic;
- it never asks for, reads, stores, logs, or transmits a private key, seed phrase, passphrase, or signature;
- it never submits a transaction, never claims a claimable balance, and never writes to a ledger.

If any file in this repository ever asks you for a secret, **you are looking at a modified copy**. Verify the
commit hash and report it — see [SECURITY.md](SECURITY.md).

## Accuracy and currency

The analysis is anchored to documents retrieved on the dates listed in [docs/SOURCES.md](docs/SOURCES.md).
Product UIs change without notice; screenshots and screen text are the weakest evidence in the repo and are
labelled as such. On-chain measurements are snapshots and drift as the ledger grows.

Where a question is genuinely open — the "created before February 20, 2026" clause in PiRC1 §3, and the
`× 25 %` two-week wallet display — this repository **says so** instead of inventing a resolution. Treat any
confident answer to those two questions, from anyone, as a claim requiring evidence.

## No warranty

The software and text are provided "as is", without warranty of any kind. See [LICENSE](LICENSE). You are
responsible for what you do with your own π.
