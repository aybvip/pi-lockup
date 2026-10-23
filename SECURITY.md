# Security

## Scope

This repository contains **documentation and read-only analysis scripts**. There is no server, no build
step, no dependency tree, and no handling of secrets. The attack surface is therefore small — but not zero.

## What the scripts do with the network

| Script | Requests | Direction |
|---|---|---|
| `examples/lockup-census.mjs` | `GET /claimable_balances` on `api.mainnet.minepi.com` | read |
| `examples/inspect-lockups.mjs` | `GET /accounts/{G}`, `GET /claimable_balances?claimant={G}` | read |
| `examples/lockup-math.mjs` | none | — |

All requests are `GET`, unauthenticated, and to a single hard-coded host. There is no telemetry, no analytics,
and no third-party call.

## Secrets

**No script requires a secret, and none should ever be given one.** A Pi private key or 24-word passphrase
is not an input to anything here. Any instruction to paste one — in an issue, a PR, a DM, or a "helpful"
fork — is an attack. Never share it, not even with a tool that claims to only read it.

## Supply chain

- `dependencies` and `devDependencies` are both **empty**. `npm install` has nothing to install.
- Node's built-in `fetch` is the only network API used (Node ≥ 18).
- CI pins `actions/checkout@v4` and `actions/setup-node@v4` and runs no third-party action.

If a future change adds a dependency, that change should be reviewed as a security change, not a
convenience one.

## Reporting

Open a **public issue** for ordinary correctness bugs. For anything that could cause someone to lose funds or
leak a secret — e.g. a script that begins transmitting data elsewhere, or documentation that could be read as
asking for a passphrase — open an issue titled `SECURITY:` with no sensitive details, and a maintainer will
follow up with a private channel.

Please include: the commit hash, the command you ran, and what you observed. Never include a private key,
seed phrase, or an address you do not own.

## Verifying you have the real thing

```bash
git remote -v                       # should point at github.com/<owner>/pi-lockup
git log -1 --format=%H              # compare against the repo page
node examples/lockup-census.mjs --self-test   # 17/17 expected
```

A copy that fails the self-tests, or that asks for a secret, is not this project.
