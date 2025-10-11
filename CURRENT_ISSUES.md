# Darklake Web – Current Issues, Fixes, and Debugging Notes

This document captures the current state of the Liquidity flow investigation and changes applied today. It focuses on:
- Non‑existent pool redirect behavior
- Metadata request hammering on the Create Pool page
- WSOL/SOL constant correctness and token program detection
- Create Pool wrapping behavior for native SOL
- Add Liquidity failures due to WSOL balance
- Instrumentation for transaction logs and how to debug similar issues

It includes actionable debugging tips so other instances/environments can be brought up quickly.


## 1) Non‑existent Pool: redirect to Create Pool

Symptoms
- Console showed: `getPoolOnChain error for X/Y: Error: Pool not found` and UI got stuck with “Calculating amounts…”.

Root Cause
- When the pool query returned `exists=false`, the client still rendered LiquidityForm instead of CreatePoolForm.

Changes
- Client redirect: `apps/web/src/app/[lang]/liquidity/_components/LiquidityForm.tsx`
  - If pool data is not loading and not found, perform `router.replace` to the liquidity page with `type=create-pool`, preserving `tokenAAddress` and `tokenBAddress`.
- SSR redirect: `apps/web/src/app/[lang]/liquidity/page.tsx`
  - After prefetching pool reserves, if result is null/`exists=false`, perform a server redirect to the Create Pool URL. This avoids flicker (“no‑flicker” behavior).

Note
- The SSR existence check touches the prefetched query. We intentionally short‑circuit early for better UX.


## 2) Request Hammering on Create Pool (metadata endpoint)

Symptoms
- Browser console/network: repeated calls to `/rpc/dexGateway/getTokenMetadataList` (ERR_INSUFFICIENT_RESOURCES), often caused by Suspense re‑throws + multiple components fetching the same data.

Root Causes
- Multiple components issued metadata queries simultaneously (CreatePoolForm, SelectTokenButton x2, YourLiquidity) and some used Suspense.
- SelectTokenButton prefetch logic also triggered on hover/touch and default prefetch on link.

Changes
- `CreatePoolForm.tsx`
  - Switched from `useSuspenseQueries` to two gated `useQuery` calls for pool details and token metadata (`enabled`, `refetchOnWindowFocus: false`, `retry: 1`), reducing retry storms.
- `SelectTokenButton.tsx`
  - Added `prefetchEnabled` prop; set `prefetchEnabled={false}` only for Create Pool page buttons. Added `enabled`/retry/staleTime to reduce reload pressure.
- `LiquidityPageContent.tsx`
  - Don’t render `YourLiquidity` in Create Pool mode (removes its metadata + reserves queries for that view).
- `YourLiquidity.tsx`
  - Switched from `useSuspenseQuery` to non‑suspense `useQuery` with gating.

Debugging tips
- Check which components issue the same query key simultaneously. Reduce repeated calls with `enabled`, moderate `retry`, and disable window focus refetch.
- Prefer non‑Suspense queries in views that might mount/unmount or where multiple instances render concurrently.


## 3) WSOL/SOL Constants and Token Program Detection

Symptoms
- When deriving ATA or reading mint info for WSOL, we saw `IncorrectProgramId` (via Token Program error `GetAccountDataSize`) and ATA creation failed.

Root Cause
- WSOL/SOL constants were inverted:
  - Correct WSOL (aka NATIVE_MINT) is `So11111111111111111111111111111111111111112`.
  - Our code had WSOL set to `…11111` (incorrect), and SOL UI representation `…11112` (incorrect). This caused ATA creation/instruction mismatches.

Changes
- `libs/orpc/src/utils/solana.ts`
  - WSOL_MINT set to `…11112` (correct)
  - SOL_MINT set to `…11111` (UI representation only)
  - `normalizeTokenMintForPool` uses SOL→WSOL for pool operations.
- Robust token program detection:
  - For create‑pool server builder, and other handlers, we probe mints under `TOKEN_PROGRAM_ID` then `TOKEN_2022_PROGRAM_ID` via `getMint` to select the correct program ID.

Debugging tips
- If you see `IncorrectProgramId` during ATA create/init flows, validate mint ownership (classic SPL vs token‑2022) using `getAccountInfo(owner)` or `getMint` under both program IDs.
- Verify WSOL constant is correct. Using `…11111` as WSOL will break ATA logic.


## 4) Create Pool: Native SOL wrapping in a single transaction

Goal
- If the user selects native SOL (UI `SOL_MINT`), wrap SOL → WSOL inline during pool creation before the program’s `initializePool` call.

Changes
- `libs/orpc/src/handlers/pools/createPoolTransaction.handler.ts`
  - Prepend WSOL ATA create (idempotent) + `SystemProgram.transfer` + `createSyncNativeInstruction` when the original user mint is the UI SOL representation.
  - Program ID detection uses mint probing to prefer the right token program.
  - For WSOL ATA creation specifically, we used the standard idempotent ATA creator, but we also fixed the WSOL constant (this was the real blocker that manifested as `IncorrectProgramId`).

Debugging tips
- Simulate the transaction server‑side and print logs. Look for Token Program `TransferChecked` failures or `IncorrectProgramId`.
- If wrapping fails under idempotent create for WSOL, re‑check constants first; only then consider falling back to legacy `create_associated_token_account`.


## 5) Add Liquidity: Insufficient funds on WSOL side

Symptoms
- On‑chain logs during Add Liquidity showed:
  - `Token-2022 TransferChecked` for token X succeeded (DuX)
  - `Tokenkeg TransferChecked` for token Y failed with `Error: insufficient funds`

Root Causes
- User had native SOL, not WSOL. The Add Liquidity transaction from the external gateway did not include SOL→WSOL wrap steps prior to the program’s `add_liquidity` instruction.
- Our UI previously misreported WSOL as SOL due to treating both `SOL` and `WSOL` as “native” (now fixed).

Changes in this repo (web)
- Instrumentation
  - `libs/orpc/src/handlers/liquidity/submitAddLiquidity.handler.ts` prints full Solana transaction logs when `SendTransactionError` occurs, both for `sendRawTransaction` and `confirmTransaction` failure paths.
- Token accounts handler
  - `libs/orpc/src/handlers/helius/getTokenAccounts.handler.ts` now treats ONLY the UI `SOL_MINT` as native (uses `getBalance()`), and WSOL as a token account. This makes WSOL balances accurate in the UI.

Gateway coordination (outside this repo)
- We prepared a patch in `../dex-gateway` to include SOL→WSOL wrap instructions in the SAME add_liquidity transaction, guided by `wrap_sol` from `check_wrap_unwrap_sol`.
  - Branch: `fix/add-liquidity-wsol-wrap`
  - Key files changed:
    - `solana_gateway/src/handlers/liquidity.rs`: propagate `wrap_sol` to the client layer
    - `solana_client/src/client.rs`: accept and forward `wrap_sol`
    - `solana_client/src/core/liquidity.rs`: build one VersionedTransaction with:
      - Compute budget instruction
      - Optional WSOL ATA create + `SystemProgram.transfer` + `sync_native`
      - AddLiquidity program instruction via Anchor IDL
      - LUT preserved (compiles to MessageV0)

Debugging tips
- If a TransferChecked fails with `insufficient funds` on the classic Token Program during Add Liquidity:
  - Check whether the unsigned tx includes wrap instructions (ATA create + transfer + sync). If not, inject them before the program instruction.
  - Confirm WSOL ATA and balance via `getAccount`.
  - Validate that program instruction order is: compute budget → wrap if needed → add_liquidity.


## 6) Practical Debugging Workflow

- Step 1: Reproduce locally with real addresses
  - Example: tokenA: DuX (DdLxrGFs2sKYbbqVk…), tokenB: SOL (So111…11111), amount: 5 SOL, wallet: DgzE6ykV…
- Step 2: Read client/server logs
  - Browser Network tab for repeated requests / waterfall (metadata endpoints)
  - Server console for the explicit “submitAddLiquidity: transaction logs:” entries
- Step 3: Validate constants and program IDs
  - WSOL_MINT: `So111…11112`, SOL_MINT: `So111…11111`
  - If `IncorrectProgramId`, check mint owner and selected token program
- Step 4: Validate balances
  - Native SOL via `connection.getBalance(pubkey)`
  - WSOL via `getAccount(WSOL_ATA)` (Token Program)
- Step 5: Transaction simulation (if needed)
  - Simulate proxy transactions server‑side via `simulateTransaction(vtx, { sigVerify: false })`
  - Print logs and check for `InitializeAccount3`, `InitializeImmutableOwner`, `TransferChecked`, etc.


## 7) Known Caveats / TODOs

- Client pre‑wrap (web) was prototyped but is not ideal. We rely on the gateway fix to include the wrap in the same transaction (single prompt + single chain tx). Once the gateway fix is merged, we should remove any pre‑wrap logic on client.
- SSR reserves check uses a narrow type guard that currently employs `any`; we can harden types post‑sprint.
- Re‑enable Lefthook hooks (Biome formatting + commitlint) when we’re done unblocking the sprint.
- Consider consolidating all transaction builders (init pool, add/remove liquidity) in a consistent pattern (server‑side) to keep instruction sequences under our control.


## 8) Summary of File Changes (web repo)
- Redirects and view logic
  - `apps/web/src/app/[lang]/liquidity/_components/LiquidityForm.tsx` (client redirect)
  - `apps/web/src/app/[lang]/liquidity/page.tsx` (SSR redirect)
  - `apps/web/src/app/[lang]/liquidity/_components/LiquidityPageContent.tsx` (don’t render YourLiquidity in create‑pool)
- Metadata hammer fixes
  - `apps/web/src/app/[lang]/liquidity/_components/CreatePoolForm.tsx` (useQuery gating)
  - `apps/web/src/app/_components/SelectTokenButton.tsx` (prefetchEnabled flag + gating)
  - `apps/web/src/app/[lang]/liquidity/_components/YourLiquidity.tsx` (non‑suspense useQuery)
- SOL/WSOL and token programs
  - `libs/orpc/src/utils/solana.ts` (correct constants, normalize SOL→WSOL)
  - `libs/orpc/src/handlers/pools/createPoolTransaction.handler.ts` (wrap + detect token program)
- WSOL balance correctness
  - `libs/orpc/src/handlers/helius/getTokenAccounts.handler.ts` (only SOL treated as native)
- Add‑Liquidity instrumentation
  - `libs/orpc/src/handlers/liquidity/submitAddLiquidity.handler.ts` (print logs on failure)


## 9) If You Hit a Similar “Insufficient Funds” Again
- Confirm whether you’re using SOL (native) or WSOL (token) for the WSOL‑side leg.
- Ensure the unsigned transaction contains:
  - ATA create (idempotent) for WSOL
  - System transfer of lamports to WSOL ATA
  - SyncNative for WSOL ATA
  - Then the add_liquidity program instruction
- If not, fix the builder (preferably on the server/gateway) to include these in one transaction.

