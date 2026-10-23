# Objections, answered

Each row is a real objection seen in the wild. The answer is short on purpose; the linked document carries
the detail. "S1/S2/…" refer to [SOURCES.md](SOURCES.md).

| # | Objection | Answer |
|---|---|---|
| 1 | **"Lockup is staking — where's the APY?"** | There is no APY, because no interest is paid. `L(B)` is added to your **mining rate**; your locked π does not grow. A staking product pays you more of an asset; a lockup pays you a higher **rate of earning** the same asset. (A4) |
| 2 | **"I locked 90 % for 3 years, so my balance should be 90 % bigger."** | No. The 90 % is the share of `Lb` that is time-locked; the reward is `0.9 × 2 × log(N)` **of `B`**, i.e. a rate multiplier. Your balance is unchanged — part of it is simply not spendable. |
| 3 | **"Then locking is pointless if the price falls."** | Correct, and that is the honest risk. The lockup gives you a rate boost with **zero price protection** and **zero liquidity** for the term. Anyone presenting it as "guaranteed profit" is selling, not explaining. |
| 4 | **"Can I unlock early if I need the π?"** | Not for the chosen duration: "lockups cannot be reversed once confirmed" (A6). The only escape is time. |
| 5 | **"The 200 % option means I can lock more than I mined."** | At migration the cap is **100 %** of the transferable balance. The **200 %** allowance is for the later on-Mainnet interface and can include π earned from selling goods/services — i.e. π you did not mine. (A5, S1.8) |
| 6 | **"The app said × 200 % — so my mining doubles?"** | `Lt = 2` means the **lockup term** equals `2 × B`. Your total rate is `B + S + L(B) + …`, so the *total* increase is not 200 % of everything. Read `×` as a multiplier on `B`, not on your balance or your whole rate. |
| 7 | **"My boost is +560 %, so I locked 100 % for 3 years."** | Not derivable. `5.6 = Lt·Lp·log10(N)` has many solutions — 200 %/1 year with the same `N` gives the same number. (A7; `--solve`) |
| 8 | **"Everyone's boost should be comparable."** | It is not, because `log(N)` differs by mining history. Two Pioneers with identical settings can differ by hundreds of points. Compare `Lt × Lp`, not the headline. |
| 9 | **"I set the lockup but nothing is locked — so it's fake."** | It is a **setting**. S1 says it applies at the next migration; before that, the balance is mobile-app balance, not on-chain. "Not locked yet" ≠ "fake". (A5) |
| 10 | **"Wallet lockup must overwrite my app setting."** | The wallet screen says the opposite: it does **not** affect the app's configuration for the next Mainnet migration. Two mechanisms, two purposes. (B4) |
| 11 | **"Locked π is a different token, right? That's why it can't move."** | No. On-chain it is `"asset": "native"`; the restriction is a **time predicate** on a claimable balance, not a different asset. (A10, B1) |
| 12 | **"The 90 % rule gives long-term lockers free PiPower."** | It gives a **baseline participation capacity**, whose size is "calibrated" — no published number — and only under a date clause that the RFC does not make unambiguous. (A8, A9, [PIPOWER.md](PIPOWER.md) §3) |
| 13 | **"PiPower is a coin I can sell."** | It is a cap on how many launch tokens you may commit to buy. It is not transferable and not denominated in π. (A8) |
| 14 | **"This is a security because it rewards holding."** | That is a legal question, not a ledger question, and this repo does not answer it. The mechanical facts: no interest, no dividend, no redemption right, no price promise. Ask a lawyer, not a block explorer. |
| 15 | **"So the whole thing is a scam."** | Not what the evidence says. The mechanism is documented, the multipliers are published, and the irreversibility is stated openly. The scam-shaped claims are the *third-party* ones: "APY", "guaranteed", "free PiPower", "unlock early". |
| 16 | **"Your screenshots prove the formula."** | They do not, and we do not use them that way. S5 is marked as the weakest source; one observed number (2-week → × 25 %) does **not** match `Lt = 0.1`, and we left it unresolved instead of explaining it away. |
| 17 | **"If the ledger is public, can't you tell who locked what?"** | You can see **time-locked balances** and their claimants. You cannot see intent, settings, or `N`. And you cannot tell locked π from free π **by origin** — only by state. |
| 18 | **"Does a lockup make my π less fungible?"** | No. Fungibility is about units being interchangeable; a lockup restricts **when** you can move a balance, not **what** the unit is. Two π of the same amount are identical; one is simply under a predicate. |

---

## The two sentences to remember

1. **A lockup buys a rate, not a return.**
2. **A lockup changes a π's state, not its identity.**
