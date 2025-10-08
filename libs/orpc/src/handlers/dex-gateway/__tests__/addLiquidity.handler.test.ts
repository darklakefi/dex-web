import { ORPCError } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";
import { addLiquidityHandler } from "../addLiquidity.handler";

// Mock the external dependencies
vi.mock("../../../dex-gateway", () => ({
  getDexGatewayClient: vi.fn(() => ({
    addLiquidity: vi.fn(),
  })),
}));

vi.mock("../../../services/LoggerService", () => ({
  LoggerService: {
    getInstance: () => ({
      error: vi.fn(),
      errorWithStack: vi.fn(),
      info: vi.fn(),
    }),
  },
}));

vi.mock("../../../services/MonitoringService", () => ({
  MonitoringService: {
    getInstance: () => ({
      recordError: vi.fn(),
      recordLatency: vi.fn(),
      recordSuccess: vi.fn(),
    }),
  },
}));

describe("addLiquidityHandler", () => {
  const validInput = {
    amountLp: "1000000", // 1 LP token
    label: "", // Wrapped SOL
    maxAmountX: "1000000", // USDC
    maxAmountY: "1000000",
    refCode: "",
    tokenMintX: "So11111111111111111111111111111111111111112",
    tokenMintY: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    userAddress: "5S5ACQEEbbHrCLEQMW9CRB4hopkumdZGC5fvpsUbJpiZ",
  };

  it("should throw POOL_NOT_FOUND error for pool not found (case sensitive)", async () => {
    // Mock the dex gateway client to throw the error
    const mockClient = {
      addLiquidity: vi
        .fn()
        .mockRejectedValue(
          new Error(
            "Failed to add liquidity: Failed to add liquidity: Failed to create add liquidity transaction: Pool not found",
          ),
        ),
    };

    // Update the mock to return our mock client
    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient);

    await expect(addLiquidityHandler(validInput)).rejects.toThrow(ORPCError);

    try {
      await addLiquidityHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      expect((error as ORPCError).code).toBe("POOL_NOT_FOUND");
      expect((error as ORPCError).message).toBe(
        "Pool not found for the specified tokens",
      );
    }
  });

  it("should handle case-insensitive pool not found error", async () => {
    const mockClient = {
      addLiquidity: vi
        .fn()
        .mockRejectedValue(
          new Error(
            "Failed to add liquidity: Failed to add liquidity: Failed to create add liquidity transaction: pool not found",
          ),
        ),
    };

    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient);

    await expect(addLiquidityHandler(validInput)).rejects.toThrow(ORPCError);

    try {
      await addLiquidityHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      expect((error as ORPCError).code).toBe("POOL_NOT_FOUND");
    }
  });

  it("should throw INSUFFICIENT_LIQUIDITY error for insufficient balance", async () => {
    const mockClient = {
      addLiquidity: vi
        .fn()
        .mockRejectedValue(new Error("insufficient balance for token")),
    };

    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient);

    await expect(addLiquidityHandler(validInput)).rejects.toThrow(ORPCError);

    try {
      await addLiquidityHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      expect((error as ORPCError).code).toBe("INSUFFICIENT_LIQUIDITY");
    }
  });

  it("should throw NETWORK_ERROR for network issues", async () => {
    const mockClient = {
      addLiquidity: vi
        .fn()
        .mockRejectedValue(new Error("network timeout occurred")),
    };

    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient);

    await expect(addLiquidityHandler(validInput)).rejects.toThrow(ORPCError);

    try {
      await addLiquidityHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      expect((error as ORPCError).code).toBe("NETWORK_ERROR");
    }
  });

  it("should throw GRPC_ERROR for unknown errors", async () => {
    const mockClient = {
      addLiquidity: vi
        .fn()
        .mockRejectedValue(new Error("Some unknown gRPC error")),
    };

    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient);

    await expect(addLiquidityHandler(validInput)).rejects.toThrow(ORPCError);

    try {
      await addLiquidityHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      expect((error as ORPCError).code).toBe("GRPC_ERROR");
    }
  });
});
