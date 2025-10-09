import { create } from "@bufbuild/protobuf";
import { AddLiquidityRequestSchema } from "@dex-web/grpc-client";
import { ORPCError } from "@orpc/server";
import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";
import { addLiquidityHandler } from "../addLiquidity.handler";

vi.mock("../../../dex-gateway", () => ({
  getDexGatewayClient: vi.fn(),
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

function createMockGrpcClient(overrides: { addLiquidity?: Mock } = {}) {
  return {
    addLiquidity: vi.fn(),
    checkTradeStatus: vi.fn(),
    createCustomToken: vi.fn(),
    createUnsignedTransaction: vi.fn(),
    deleteCustomToken: vi.fn(),
    editCustomToken: vi.fn(),
    getCustomToken: vi.fn(),
    getCustomTokens: vi.fn(),
    getTokenMetadata: vi.fn(),
    getTokenMetadataList: vi.fn(),
    getTradesListByUser: vi.fn(),
    initPool: vi.fn(),
    quote: vi.fn(),
    quoteAddLiquidity: vi.fn(),
    removeLiquidity: vi.fn(),
    sendSignedTransaction: vi.fn(),
    ...overrides,
  };
}

describe("addLiquidityHandler", () => {
  const validInput = create(AddLiquidityRequestSchema, {
    amountLp: BigInt("1000000"),
    label: "",
    maxAmountX: BigInt("1000000"),
    maxAmountY: BigInt("1000000"),
    refCode: "",
    tokenMintX: "So11111111111111111111111111111111111111112",
    tokenMintY: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    userAddress: "5S5ACQEEbbHrCLEQMW9CRB4hopkumdZGC5fvpsUbJpiZ",
  });

  it("should throw POOL_NOT_FOUND error for pool not found (case sensitive)", async () => {
    const mockAddLiquidity = vi
      .fn()
      .mockRejectedValue(
        new Error(
          "Failed to add liquidity: Failed to add liquidity: Failed to create add liquidity transaction: Pool not found",
        ),
      );

    const mockClient = createMockGrpcClient({
      addLiquidity: mockAddLiquidity,
    });

    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient as any);

    await expect(addLiquidityHandler(validInput)).rejects.toThrow(ORPCError);

    try {
      await addLiquidityHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      if (error instanceof ORPCError) {
        expect(error.code).toBe("POOL_NOT_FOUND");
        expect(error.message).toBe("Pool not found for the specified tokens");
      }
    }
  });

  it("should handle case-insensitive pool not found error", async () => {
    const mockAddLiquidity = vi
      .fn()
      .mockRejectedValue(
        new Error(
          "Failed to add liquidity: Failed to add liquidity: Failed to create add liquidity transaction: pool not found",
        ),
      );

    const mockClient = createMockGrpcClient({
      addLiquidity: mockAddLiquidity,
    });

    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient as any);

    await expect(addLiquidityHandler(validInput)).rejects.toThrow(ORPCError);

    try {
      await addLiquidityHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      if (error instanceof ORPCError) {
        expect(error.code).toBe("POOL_NOT_FOUND");
      }
    }
  });

  it("should throw INSUFFICIENT_LIQUIDITY error for insufficient balance", async () => {
    const mockAddLiquidity = vi
      .fn()
      .mockRejectedValue(new Error("insufficient balance for token"));

    const mockClient = createMockGrpcClient({
      addLiquidity: mockAddLiquidity,
    });

    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient as any);

    await expect(addLiquidityHandler(validInput)).rejects.toThrow(ORPCError);

    try {
      await addLiquidityHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      if (error instanceof ORPCError) {
        expect(error.code).toBe("INSUFFICIENT_LIQUIDITY");
      }
    }
  });

  it("should throw NETWORK_ERROR for network issues", async () => {
    const mockAddLiquidity = vi
      .fn()
      .mockRejectedValue(new Error("network timeout occurred"));

    const mockClient = createMockGrpcClient({
      addLiquidity: mockAddLiquidity,
    });

    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient as any);

    await expect(addLiquidityHandler(validInput)).rejects.toThrow(ORPCError);

    try {
      await addLiquidityHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      if (error instanceof ORPCError) {
        expect(error.code).toBe("NETWORK_ERROR");
      }
    }
  });

  it("should throw GRPC_ERROR for unknown errors", async () => {
    const mockAddLiquidity = vi
      .fn()
      .mockRejectedValue(new Error("Some unknown gRPC error"));

    const mockClient = createMockGrpcClient({
      addLiquidity: mockAddLiquidity,
    });

    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient as any);

    await expect(addLiquidityHandler(validInput)).rejects.toThrow(ORPCError);

    try {
      await addLiquidityHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      if (error instanceof ORPCError) {
        expect(error.code).toBe("GRPC_ERROR");
      }
    }
  });
});
