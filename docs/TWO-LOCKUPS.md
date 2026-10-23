# The two lockups (and why they are not the same feature)

Most confusion around "Pi lockup" comes from mixing up two independent mechanisms that share a name.
They live in different places, they take effect at different times, and they do not control each other.

## Side by side

| | **A — Mining-app lockup (settings)** | **B — Wallet lockup ("Create Lockup")** |
|---|---|---|
| Location | Pi mining app → *Lockup settings* | Pi Browser wallet → *Create Lockup* |
| Input | **percentage** of your transferable balance + duration | **absolute π amount** from available balance + duration |
| When π actually moves | **on the next transfer to Mainnet** — nothing is locked before that | **immediately** — locked at the moment you confirm |
| Effect on mining | applies to the migrated balance; `Lp` is a share of `Lb` | boost begins **from the next mining session** |
| Does it change the other? | no | **no** — the screen states it does not affect the app's lockup configuration for the next Mainnet transfer |
| Reversible? | no (once confirmed and migrated) | no (for the chosen duration) |
| On-chain footprint | the resulting locked portion after migration | a time-locked balance (time predicate) |

## Why the mining-app one is a *setting*, not a lock

The whitepaper is explicit:

> "Pioneers can decide their lockup duration and lockup percentage of their transferable balance **anytime
> they want as an overall account setting** in the Pi app. They can even preselect these settings **before
> they're KYC'ed** or ready to migrate to the Mainnet. … At the moment of the migration of their Transferable
> Balance to Mainnet, their preselected setting of lockup duration and percentage will automatically apply to
> the amount of balance transferred, resulting in two types of balances on the Mainnet: **lockup balance and
> free balance**, both of which will be recorded on the Mainnet blockchain and reside in the Pioneer's
> non-custodial Pi wallet."

Read that carefully, because it settles three arguments at once:

1. **Nothing is locked yet** while the balance is still in the mobile app. A "lockup setting" on a
   non-migrated balance is a promise about the *next* migration, not a lock today.
2. Changing the setting **does not retroactively move** anything: "Any changes to this Pioneer's lockup
   setting will take effect in their **next** balance transfer to the Mainnet."
3. Once migrated, the split is **on-chain** and **irreversible**: "lockups cannot be reversed once confirmed
   and must remain locked up for the entirety of the chosen duration due to the nature of blockchain."

That is why the app's steering text says each adjustment "will take effect on your next transfer to the
Mainnet" — it is describing a *config*, not a vault.

## Why the wallet one is a *state*, not a setting

The wallet screen says the opposite of the mining app on the timing axis:

> "Create a new lockup using Pi in your wallet. This Pi will be locked **immediately** and you will begin
> receiving the corresponding mining boost **starting from the next mining session**. This **does not
> affect** the lockup configuration in the mining app for the next Mainnet migration."

Three consequences:

1. It moves π **now** — the balance is no longer spendable.
2. The boost starts on a **mining session boundary**, not instantly.
3. The two mechanisms are **orthogonal by design**. You can have a 3-year/100 % app setting *and* a
   2-week wallet lockup at the same time, and the app setting keeps applying to the next migration.

## The one place the whitepaper anticipates the wallet lockup

> "After Mainnet launches and Pioneers transfer their balances, Pioneers can also lock up more Pi directly
> on the Mainnet through a slightly different lockup interface later on. At that time, Pioneers can lock up
> as much as 200 % of their already-transferred Mainnet balance acquired from their previous mining. The
> additional lockup allowance for more Pi than individually mined by the Pioneer can come from utility-based
> Pi apps transactions."

So the whitepaper's own model is: **≤ 100 % of transferable balance at migration**, **up to 200 % of the
on-chain balance afterwards**. The "200 %" that appears in a mining-app screen is therefore a *later*
addition — which is a fact about the product's evolution, not about the formula.

## What this means on-chain

Both lockups end up as **the same native asset** in the same account's ledger view. The ledger has no
`locked_pi` asset type; time-locking is expressed with a **predicate**, i.e. the amount is claimable only
after a date. Horizon exposes exactly that on Pi Mainnet:

```bash
curl -s "https://api.mainnet.minepi.com/claimable_balances?limit=1"
```

```jsonc
{
  "asset": "native",
  "amount": "2754.7790627",
  "claimants": [
    { "destination": "G…", "predicate": { "not": { "abs_before": "2022-07-09T07:20:53Z" } } }
  ]
}
```

`not { abs_before: T }` reads as **"claimable once `now ≥ T`"** — the standard time-lock shape. The asset is
still `"native"`. There is no second asset and no origin tag: exactly the fungibility result, seen from the
lockup side.

Check a real address with [`examples/inspect-lockups.mjs`](../examples/inspect-lockups.mjs). It decodes each
predicate into an unlock date and refuses to guess when the pattern is something else.

> **Honest limit:** seeing a time-locked native claimable balance proves *a* time lock exists for that
> address. It does not by itself prove the wallet's "Create Lockup" button produced it. Run the script
> before and after locking to establish that link on your own account.

## Decision table

| Question | Answer |
|---|---|
| I set 90 % / 3 years but haven't migrated — is my π locked? | No. It is a **setting**; it applies at the next migration. |
| I created a wallet lockup — does my app setting change? | No. The two are independent. |
| Can I undo a lockup? | Not for its term, once confirmed. |
| Is locked π worth more per unit? | No. One native asset; the lockup changes your **rate**, not the coin. |
| Do both count for the PiPower ≥ 90 % / 3-year rule? | The RFC says "active Pi lockup of ≥ 90 % of their mined tokens for at least 3 years". It does **not** map that phrase onto either screen. See [PIPOWER.md](PIPOWER.md). |
