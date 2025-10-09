import { describe, expect, it } from "vitest";
import {
  addLiquidityInputSchema,
  addLiquidityPayloadSchema,
  numericStringSchema,
  solanaAddressSchema,
  toBigIntSafe,
} from "../liquiditySchemas";

describe("liquiditySchemas", () => {
  describe("solanaAddressSchema", () => {
    it("should validate valid Solana addresses", () => {
      const validAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
      expect(() => solanaAddressSchema.parse(validAddress)).not.toThrow();
    });

    it("should reject addresses that are too short", () => {
      expect(() => solanaAddressSchema.parse("short")).toThrow();
    });

    it("should reject addresses that are too long", () => {
      const tooLong = "a".repeat(50);
      expect(() => solanaAddressSchema.parse(tooLong)).toThrow();
    });

    it("should reject addresses with invalid characters", () => {
      expect(() =>
        solanaAddressSchema.parse(
          "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyT0t1v",
        ),
      ).toThrow(); // Contains '0' which is invalid
    });
  });

  describe("numericStringSchema", () => {
    it("should validate positive numeric strings", () => {
      expect(() => numericStringSchema.parse("123.456")).not.toThrow();
    });

    it("should validate strings with commas", () => {
      expect(() => numericStringSchema.parse("1,234.56")).not.toThrow();
    });

    it("should reject zero", () => {
      expect(() => numericStringSchema.parse("0")).toThrow();
    });

    it("should reject negative numbers", () => {
      expect(() => numericStringSchema.parse("-100")).toThrow();
    });

    it("should reject non-numeric strings", () => {
      expect(() => numericStringSchema.parse("abc")).toThrow();
    });

    it("should reject empty strings", () => {
      expect(() => numericStringSchema.parse("")).toThrow();
    });
  });

  describe("toBigIntSafe", () => {
    const schema = toBigIntSafe("testField");

    it("should convert numbers to bigint", () => {
      const result = schema.parse(100);
      expect(result).toBe(100n);
    });

    it("should handle bigint directly", () => {
      const result = schema.parse(100n);
      expect(result).toBe(100n);
    });

    it("should convert string to bigint", () => {
      const result = schema.parse("100");
      expect(result).toBe(100n);
    });

    it("should floor decimal numbers", () => {
      const result = schema.parse(100.7);
      expect(result).toBe(100n);
    });

    it("should handle zero", () => {
      const result = schema.parse(0);
      expect(result).toBe(0n);
    });

    it("should throw for numbers exceeding MAX_SAFE_INTEGER", () => {
      expect(() => schema.parse(Number.MAX_SAFE_INTEGER + 1)).toThrow(
        /exceeds safe integer range/,
      );
    });

    it("should reject negative numbers", () => {
      expect(() => schema.parse(-100)).toThrow();
    });

    it("should handle large strings", () => {
      const result = schema.parse("999999999999999999999");
      expect(result).toBe(999999999999999999999n);
    });
  });

  describe("addLiquidityInputSchema", () => {
    const validInput = {
      poolReserves: {
        protocolFeeX: "0",
        protocolFeeY: "0",
        reserveX: "1000000000",
        reserveY: "2000000000",
        totalLpSupply: "1414213562",
        userLockedX: "0",
        userLockedY: "0",
      },
      slippage: "0.5",
      tokenAAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      tokenAAmount: "100",
      tokenADecimals: 6,
      tokenBAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      tokenBAmount: "200",
      tokenBDecimals: 6,
      userAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    };

    it("should validate valid input", () => {
      expect(() => addLiquidityInputSchema.parse(validInput)).not.toThrow();
    });

    it("should reject input with invalid token address", () => {
      expect(() =>
        addLiquidityInputSchema.parse({
          ...validInput,
          tokenAAddress: "invalid",
        }),
      ).toThrow();
    });

    it("should reject input with invalid amount", () => {
      expect(() =>
        addLiquidityInputSchema.parse({
          ...validInput,
          tokenAAmount: "-100",
        }),
      ).toThrow();
    });

    it("should reject decimals out of range", () => {
      expect(() =>
        addLiquidityInputSchema.parse({
          ...validInput,
          tokenADecimals: 20,
        }),
      ).toThrow();
    });

    it("should apply default values for optional fields", () => {
      const minimalInput = {
        ...validInput,
        poolReserves: {
          reserveX: "1000000000",
          reserveY: "2000000000",
          totalLpSupply: "1414213562",
        },
      };

      const result = addLiquidityInputSchema.parse(minimalInput);
      expect(result.poolReserves.protocolFeeX).toBe(0n);
      expect(result.poolReserves.protocolFeeY).toBe(0n);
      expect(result.poolReserves.userLockedX).toBe(0n);
      expect(result.poolReserves.userLockedY).toBe(0n);
    });
  });

  describe("addLiquidityPayloadSchema", () => {
    const validPayload = {
      $typeName: "darklake.v1.AddLiquidityRequest" as const,
      amountLp: 100n,
      label: "",
      maxAmountX: 1000n,
      maxAmountY: 2000n,
      refCode: "",
      tokenMintX: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      tokenMintY: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      userAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    };

    it("should validate valid payload", () => {
      expect(() => addLiquidityPayloadSchema.parse(validPayload)).not.toThrow();
    });

    it("should reject zero LP amount", () => {
      expect(() =>
        addLiquidityPayloadSchema.parse({
          ...validPayload,
          amountLp: 0n,
        }),
      ).toThrow();
    });

    it("should reject negative LP amount", () => {
      expect(() =>
        addLiquidityPayloadSchema.parse({
          ...validPayload,
          amountLp: -100n,
        }),
      ).toThrow();
    });

    it("should apply default values", () => {
      const minimalPayload = {
        amountLp: 100n,
        maxAmountX: 1000n,
        maxAmountY: 2000n,
        tokenMintX: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        tokenMintY: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        userAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      };

      const result = addLiquidityPayloadSchema.parse(minimalPayload);
      expect(result.label).toBe("");
      expect(result.refCode).toBe("");
    });
  });
});
