% Liquidity Add Transaction — Root Cause, Fix, and Verification (2025‑10‑09)

## Executive Summary

Users attempting to add liquidity to the DUX/DukY pool on Devnet intermittently hit SlippageExceeded (Error 6005). After exhaustive parity testing, we confirmed slippage math in the FE/BE path was correct. The actual root cause was a parameter rotation bug in the gateway transaction builder: the builder encoded `(amountLp, maxX, maxY)` in the wrong order. On chain, this inflated `amount_lp` by orders of magnitude, which forced transfers far above `max_amount_{x,y}` and surfaced as SlippageExceeded.

We implemented a safe, temporary fix in ORPC that pre-rotates arguments before calling the gateway and then validates the resulting unsigned transaction by decoding the instruction with the program’s Anchor IDL. We also enforced X < Y mint ordering server-side to satisfy Anchor account constraints, and added deterministic and on‑chain integration tests. The web UI now works using the exact dialog path with no changes on the frontend.

The fix is feature-flagged and can be removed once the gateway is corrected.

---

## Root Cause Analysis

- Symptom: SlippageExceeded at `add_liquidity.rs:193`, even with generous 0.5% slippage and correct CEILING reverse math parity.
- Non‑cause(s):
  - Numeric precision loss: Verified not the cause after BigInt/string flow and deterministic parity tests; off‑by‑one reserves did not underfund with 0.5% slippage.
  - Mint ordering: We did hit owner/ordering errors initially, but those happen earlier (Anchor account checks) and were fixed by enforcing X < Y.
- Actual cause: The gateway builder rotated positional arguments for `add_liquidity`:
  - Observed decoding of the unsigned transaction (via our IDL decoder):
    - `amount_lp` := original `maxAmountY`
    - `max_amount_x` := original `amountLp`
    - `max_amount_y` := original `maxAmountX`
  - Outcome: Program tried to mint a massive LP amount and then rejected the transfers since required token inputs exceeded `max_amount_{x,y}` → SlippageExceeded.

---

## Fix Overview

- Add a temporary rotation “hack” in ORPC before calling the gateway, then validate:
  - Pre-rotate inputs to invert the gateway rotation (until gateway is fixed).
  - Decode the returned unsigned transaction instruction using the Anchor IDL.
  - If decoded args don’t match the intended FE values, automatically retry without rotation (future-proof when gateway is corrected).
  - Controlled by `ORPC_FIX_GATEWAY_ADD_LIQUIDITY_ROTATION` (default enabled).
- Normalize mint order X < Y server‑side:
  - Swap `tokenMintX/tokenMintY` and `maxAmountX/maxAmountY` if needed.
- Keep slippage math as-is (confirmed correct):
  - LP minted = min of the proportional shares rounded DOWN.
  - Reverse CEILING for LP → token, then apply slippage and round UP.

---

## Key Changes (Files)

- ORPC handlers
  - `libs/orpc/src/handlers/dex-gateway/addLiquidity.handler.ts`
    - NEW: rotation workaround with validation by decoding unsigned tx via IDL.
  - `libs/orpc/src/procedures/dex-gateway/addLiquidity.procedure.ts`
    - NEW: X < Y normalization and `maxAmountX/maxAmountY` swap.
  - `libs/orpc/src/handlers/pools/getPoolReserves.handler.ts`
    - BigInt-safe math and string serialization to prevent precision loss, with Decimal for display only.
- Utilities
  - `libs/orpc/src/utils/decodeAddLiquidity.ts` (+ test)
    - Anchor Borsh encoder/decoder to inspect instruction args.
- Tests
  - Deterministic math (no network):
    - `libs/utils/src/liquidity/__tests__/confirmPropagation.test.ts`
      - Confirms off‑by‑one reserves do not underfund with 0.5% slippage.
    - `libs/utils/src/liquidity/__tests__/addLiquidityTransformer.parity.test.ts`
      - Parity for current Devnet snapshot.
  - On‑chain and builder parity:
    - `libs/orpc/src/handlers/pools/__tests__/confirmSlippageHypothesis.integration.test.ts`
      - Pulls on‑chain state; FE max amounts ≥ required CEILING amounts.
    - `libs/orpc/src/handlers/pools/__tests__/gatewayAddLiquidity.integration.test.ts`
      - Uses the same builder as the dialog; decodes and simulates.
    - `libs/orpc/src/handlers/pools/__tests__/simulateAddLiquidity.integration.test.ts`
      - IDL-based instruction construction and simulation with the local signer.
  - Live minimal submission (devnet):
    - `libs/orpc/src/handlers/pools/__tests__/liveAddLiquidity.submit.integration.test.ts`
      - Computes minimal raw inputs (ensuring ≥1 unit per token), builds via gateway, signs with `~/.config/solana/id.json`, and submits; prints tx signature.

---

## Debugging Mechanics (Step‑by‑Step)

1. Establish ground truth
   - Pulled on-chain pool data (reserves, fees, total LP, decimals) via Helius.
   - Confirmed CEILING reverse calculation and slippage math by reproducing exactly in TS; confirmed FE max amounts covered required amounts.

2. Eliminate numeric propagation hypothesis
   - Deterministic tests with off‑by‑one reserve variants: max amounts still ≥ required — not a numeric issue at 0.5%.
   - On‑chain parity test: FE max amounts cover CEILING amounts — again not numeric.

3. Simulate with the exact same builder as the dialog
   - Built via gateway (unsigned tx), simulated with `sigVerify: false`.
   - Decoded add_liquidity args from the instruction — found rotation: `amount_lp=maxY` etc.
   - Because the program uses the decoded `amount_lp` to compute token requirements, SlippageExceeded was expected.

4. Implemented rotation workaround + validation
   - Pre‑rotate, build via gateway, decode unsigned tx, assert decoded args equal FE‑intended `(amountLp, maxX, maxY)`.
   - If mismatch, automatically retry without rotation, allowing seamless removal once gateway is fixed.

5. Full path simulation and live submit
   - IDL-based simulation assembled exact Anchor account order and confirmed ordering/owners, then failed on token transfers when using large values (expected for unfunded ATAs).
   - Live minimal submission test computed tiny amounts (X=2 raw, Y=7 raw), built via gateway (with fix), signed with local keypair, submitted to Devnet (prints signature).

---

## How to Validate Locally

- Prereqs
  - `.env`: `HELIUS_API_KEY`, `NEXT_PUBLIC_NETWORK=2`; gateway `GATEWAY_HOST`/`GATEWAY_PORT` reachable.
  - Local signer with funds: `~/.config/solana/id.json` corresponding to `4doTkL1…JX8u`.
  - DUX/DukY token accounts (ATAs) exist for the signer and hold small balances; enough SOL for LP ATA rent.

- Web UI (dev)
  - Restart: `pnpm start`.
  - Use very small inputs in the add-liquidity dialog:
    - DUX: `0.000002`
    - DukY: `0.000000007`
    - Slippage: `0.5%`
  - Sign; you should obtain a tx hash and no SlippageExceeded.

- Tests
  - Deterministic/parity (no network):
    - `pnpm vitest run -c libs/utils/vite.config.mts libs/utils/src/liquidity/__tests__/confirmPropagation.test.ts`
    - `pnpm vitest run -c libs/utils/vite.config.mts libs/utils/src/liquidity/__tests__/addLiquidityTransformer.parity.test.ts`
  - Builder parity (devnet gateway):
    - `pnpm vitest run -c libs/orpc/vite.config.ts libs/orpc/src/handlers/pools/__tests__/gatewayAddLiquidity.integration.test.ts`
  - IDL-based simulation (loads `~/.config/solana/id.json`):
    - `pnpm vitest run -c libs/orpc/vite.config.ts libs/orpc/src/handlers/pools/__tests__/simulateAddLiquidity.integration.test.ts`
  - Live devnet submission with tiny amounts:
    - `pnpm vitest run -c libs/orpc/vite.config.ts libs/orpc/src/handlers/pools/__tests__/liveAddLiquidity.submit.integration.test.ts`

---

## Risks, Flags, and Rollback

- Rotation hack is temporary and validated end‑to‑end by decoding the unsigned tx.
- Toggle env: `ORPC_FIX_GATEWAY_ADD_LIQUIDITY_ROTATION=0` to disable (when gateway is fixed), no redeploy needed besides server restart.
- If the gateway’s mapping changes in a different way, our validation detects mismatch and auto-retries without rotation, preventing silent corruption.
- X/Y ordering is enforced server-side, so UI/order mistakes won’t break the on-chain invariant (`token_mint_x < token_mint_y`).

---

## Next Steps (to remove the hack)

1. Fix gateway builder to map `add_liquidity` args exactly:
   - `amount_lp = amountLp`
   - `max_amount_x = maxAmountX`
   - `max_amount_y = maxAmountY`
2. Keep the builder’s unsigned tx decoded in CI to assert parity with ORPC inputs.
3. Flip `ORPC_FIX_GATEWAY_ADD_LIQUIDITY_ROTATION=0` and confirm tests remain green.

---

## Appendix: Minimal-Amount Derivation

Let `lp_total`, `reserve_x`, `reserve_y` be on-chain available values.

- Minimal LP minted to make both tokens ≥ 1 raw unit under CEILING reverse:
  - Need `ceil(lp * reserve_x / lp_total) ≥ 1` and `ceil(lp * reserve_y / lp_total) ≥ 1`.
  - So `lp ≥ ceil(lp_total / reserve_x)` and `lp ≥ ceil(lp_total / reserve_y)` → choose the max.
- Token raw amounts for chosen `lp`:
  - `x = ceil(lp * reserve_x / lp_total)`
  - `y = ceil(lp * reserve_y / lp_total)`
- Apply slippage 0.5% and round up to integer raw:
  - `max_x = ceil(x * 1.005)`
  - `max_y = ceil(y * 1.005)`

For current devnet state, this yields `lp=3`, `x=2`, `y=7`, `max_x=3`, `max_y=8`.
