import { create } from "@bufbuild/protobuf";
import { CreateCustomTokenRequestSchema } from "@dex-web/grpc-client";
import { ORPCError } from "@orpc/server";
import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";
import { createCustomTokenHandler } from "../createCustomToken.handler";

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

function createMockGrpcClient(overrides: { createCustomToken?: Mock } = {}) {
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

describe("createCustomTokenHandler", () => {
  const validInput = create(CreateCustomTokenRequestSchema, {
    address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    decimals: 9,
    logoUri: "https://example.com/logo.png",
    name: "My Custom Token",
    symbol: "MCT",
  });

  it("should successfully create custom token", async () => {
    const mockCreateCustomToken = vi.fn().mockResolvedValue({
      message: "Token created successfully",
      success: true,
      tokenMetadata: {
        address: validInput.address,
        decimals: validInput.decimals,
        logoUri: validInput.logoUri,
        name: validInput.name,
        symbol: validInput.symbol,
      },
    });

    const mockClient = createMockGrpcClient({
      createCustomToken: mockCreateCustomToken,
    });
    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient as any);

    const result = await createCustomTokenHandler(validInput);

    expect(result.success).toBe(true);
    expect(result.tokenMetadata).toBeDefined();
    expect(mockCreateCustomToken).toHaveBeenCalledWith(validInput);
  });

  it("should throw TOKEN_ALREADY_EXISTS error when token exists", async () => {
    const mockCreateCustomToken = vi
      .fn()
      .mockRejectedValue(new Error("Token already exists"));

    const mockClient = createMockGrpcClient({
      createCustomToken: mockCreateCustomToken,
    });
    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient as any);

    await expect(createCustomTokenHandler(validInput)).rejects.toThrow(
      ORPCError,
    );

    try {
      await createCustomTokenHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      if (error instanceof ORPCError) {
        expect(error.code).toBe("TOKEN_ALREADY_EXISTS");
        expect(error.message).toBe("Token already exists");
      }
    }
  });

  it("should throw INVALID_ADDRESS error for invalid token address", async () => {
    const mockCreateCustomToken = vi
      .fn()
      .mockRejectedValue(new Error("Invalid token address"));

    const mockClient = createMockGrpcClient({
      createCustomToken: mockCreateCustomToken,
    });
    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient as any);

    await expect(createCustomTokenHandler(validInput)).rejects.toThrow(
      ORPCError,
    );

    try {
      await createCustomTokenHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      if (error instanceof ORPCError) {
        expect(error.code).toBe("INVALID_ADDRESS");
        expect(error.message).toBe("Invalid token address");
      }
    }
  });

  it("should throw NETWORK_ERROR for network issues", async () => {
    const mockCreateCustomToken = vi
      .fn()
      .mockRejectedValue(new Error("network timeout occurred"));

    const mockClient = createMockGrpcClient({
      createCustomToken: mockCreateCustomToken,
    });
    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient as any);

    await expect(createCustomTokenHandler(validInput)).rejects.toThrow(
      ORPCError,
    );

    try {
      await createCustomTokenHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      if (error instanceof ORPCError) {
        expect(error.code).toBe("NETWORK_ERROR");
      }
    }
  });

  it("should throw GRPC_ERROR for unknown errors", async () => {
    const mockCreateCustomToken = vi
      .fn()
      .mockRejectedValue(new Error("Some unknown gRPC error"));

    const mockClient = createMockGrpcClient({
      createCustomToken: mockCreateCustomToken,
    });
    const { getDexGatewayClient } = await import("../../../dex-gateway");
    vi.mocked(getDexGatewayClient).mockResolvedValue(mockClient as any);

    await expect(createCustomTokenHandler(validInput)).rejects.toThrow(
      ORPCError,
    );

    try {
      await createCustomTokenHandler(validInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      if (error instanceof ORPCError) {
        expect(error.code).toBe("GRPC_ERROR");
      }
    }
  });
});
