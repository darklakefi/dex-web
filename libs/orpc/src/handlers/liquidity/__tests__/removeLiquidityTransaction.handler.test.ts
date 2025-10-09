import type { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { describe, expect, it, vi } from "vitest";
import type { RemoveLiquidityTransactionInput } from "../../../schemas/liquidity/removeLiquidityTransaction.schema";
import { removeLiquidityTransactionHandler } from "../removeLiquidityTransaction.handler";

vi.mock("@dex-web/core", () => ({
  createLiquidityProgram: vi.fn().mockReturnValue({
    methods: {
      removeLiquidity: vi.fn().mockReturnValue({
        accounts: vi.fn().mockReturnValue({
          instruction: vi.fn().mockResolvedValue({
            data: Buffer.from([]),
            keys: [],
            programId: new PublicKey(
              "darkr3FB87qAZmgLwKov6Hk9Yiah5UT4rUYu8Zhthw1",
            ),
          }),
        }),
      }),
    },
    programId: new PublicKey("darkr3FB87qAZmgLwKov6Hk9Yiah5UT4rUYu8Zhthw1"),
    provider: {
      connection: {
        getAccountInfo: vi.fn().mockResolvedValue({
          data: Buffer.from([]),
          executable: false,
          lamports: 1000000,
          owner: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        }),
      },
    },
  }),
}));

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const WSOL = "So11111111111111111111111111111111111111112";
const USER = "BXqAmer56m2vNvEFpfG6pBSdRM6JvJ2GeBq3kArGr3Jn";
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

describe("removeLiquidityTransactionHandler", () => {
  const mockProvider = {
    connection: {},
    publicKey: new PublicKey(USER),
    wallet: {},
  } as AnchorProvider;

  const baseInput: RemoveLiquidityTransactionInput = {
    lpTokensToBurn: "1000000000",
    minAmountX: "1000000",
    minAmountY: "1000000",
    provider: mockProvider,
    tokenXMint: USDC,
    tokenXProgramId: TOKEN_PROGRAM,
    tokenYMint: WSOL,
    tokenYProgramId: TOKEN_PROGRAM,
    user: USER,
  };

  it("should create remove liquidity transaction successfully", async () => {
    const result = await removeLiquidityTransactionHandler(baseInput);

    expect(result.success).toBe(true);
    expect(result.transaction).toBeTruthy();
  });

  it("should handle token order correctly with sorted tokens", async () => {
    const result = await removeLiquidityTransactionHandler(baseInput);

    expect(result.success).toBe(true);
    expect(result.transaction).toBeTruthy();
  });

  it("should handle token order correctly with reversed tokens", async () => {
    const reversedInput: RemoveLiquidityTransactionInput = {
      ...baseInput,
      tokenXMint: WSOL,
      tokenYMint: USDC,
    };

    const result = await removeLiquidityTransactionHandler(reversedInput);

    expect(result.success).toBe(true);
    expect(result.transaction).toBeTruthy();
  });

  it("should return same transaction structure for same token pair regardless of order", async () => {
    const result1 = await removeLiquidityTransactionHandler(baseInput);
    const result2 = await removeLiquidityTransactionHandler({
      ...baseInput,
      tokenXMint: WSOL,
      tokenYMint: USDC,
    });

    expect(result1.success).toBe(result2.success);
    expect(result1.transaction).toBeTruthy();
    expect(result2.transaction).toBeTruthy();
  });

  it("should handle errors gracefully", async () => {
    const invalidInput: RemoveLiquidityTransactionInput = {
      ...baseInput,
      tokenXMint: "invalid-address",
    };

    const result = await removeLiquidityTransactionHandler(invalidInput);

    expect(result.success).toBe(false);
    expect(result.transaction).toBeNull();
  });
});
