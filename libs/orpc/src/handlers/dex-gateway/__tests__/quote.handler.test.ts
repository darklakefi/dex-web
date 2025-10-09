import { create } from "@bufbuild/protobuf";
import { QuoteRequestSchema } from "@dex-web/grpc-client";
import { ORPCError } from "@orpc/server";
import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";
import { quoteHandler } from "../quote.handler";

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

function createMockGrpcClient(overrides: { quote?: Mock } = {}) {
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

describe("quoteHandler", () => {
  const validInput = create(QuoteRequestSchema, {
    amountIn: BigInt("1000000"),
    isSwapXToY: true,
    tokenMintX: "So11111111111111111111111111111111111111112",
    tokenMintY: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  });

  it("should successfully get quote", async () => {
    const mockQuote = vi.fn().mockResolvedValue({
      amountIn: BigInt("1000000"),
      amountOut: BigInt("950000"),
      feeAmount: BigInt("3000"),
      feePct: 0.003,
      isSwapXToY: true,
      tokenMintX: "So11111111111111111111111111111111111111112",
      tokenMintY: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    });

    const mockClient = createMockGrpcClient({ quote: mockQuote });
    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient as any);

    const result = await quoteHandler(validInput);

    expect(result.amountOut).toBe(BigInt("950000"));
    expect(result.feeAmount).toBe(BigInt("3000"));
    expect(mockQuote).toHaveBeenCalledWith(validInput);
  });

  it("should throw POOL_NOT_FOUND error when pool does not exist", async () => {
    const mockQuote = vi
      .fn()
      .mockRejectedValue(new Error("Pool not found for token pair"));

    const mockClient = createMockGrpcClient({ quote: mockQuote });
    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient as any);

    await expect(quoteHandler(validInput)).rejects.toThrow(ORPCError);

    try {
      await quoteHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      if (error instanceof ORPCError) {
        expect(error.code).toBe("POOL_NOT_FOUND");
        expect(error.message).toBe(
          "Pool not found for the specified token pair",
        );
      }
    }
  });

  it("should throw INSUFFICIENT_LIQUIDITY error for large swap amounts", async () => {
    const mockQuote = vi
      .fn()
      .mockRejectedValue(new Error("Insufficient liquidity for swap"));

    const mockClient = createMockGrpcClient({ quote: mockQuote });
    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient as any);

    await expect(quoteHandler(validInput)).rejects.toThrow(ORPCError);

    try {
      await quoteHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      if (error instanceof ORPCError) {
        expect(error.code).toBe("INSUFFICIENT_LIQUIDITY");
        expect(error.message).toBe(
          "Insufficient liquidity for this swap amount",
        );
      }
    }
  });

  it("should throw NETWORK_ERROR for network issues", async () => {
    const mockQuote = vi
      .fn()
      .mockRejectedValue(new Error("network timeout occurred"));

    const mockClient = createMockGrpcClient({ quote: mockQuote });
    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient as any);

    await expect(quoteHandler(validInput)).rejects.toThrow(ORPCError);

    try {
      await quoteHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      if (error instanceof ORPCError) {
        expect(error.code).toBe("NETWORK_ERROR");
      }
    }
  });

  it("should throw GRPC_ERROR for unknown errors", async () => {
    const mockQuote = vi
      .fn()
      .mockRejectedValue(new Error("Some unknown gRPC error"));

    const mockClient = createMockGrpcClient({ quote: mockQuote });
    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient as any);

    await expect(quoteHandler(validInput)).rejects.toThrow(ORPCError);

    try {
      await quoteHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      if (error instanceof ORPCError) {
        expect(error.code).toBe("GRPC_ERROR");
      }
    }
  });
});
