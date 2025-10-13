import {
  getGatewayTokenAddress,
  getSolTokenDisplayName,
  getSolTokenType,
  isSolToken,
  isSolVariant,
  isWsolToken,
  SOL_MINTS,
  SOL_TOKEN_ADDRESS,
  SolTokenType,
  shouldUseNativeSolBalance,
  WSOL_TOKEN_ADDRESS,
} from "../solTokenUtils";

describe("solTokenUtils", () => {
  const USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const RANDOM_TOKEN_ADDRESS = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";

  describe("Constants", () => {
    it("should have correct SOL and WSOL addresses", () => {
      expect(SOL_TOKEN_ADDRESS).toBe(
        "So11111111111111111111111111111111111111111",
      );
      expect(WSOL_TOKEN_ADDRESS).toBe(
        "So11111111111111111111111111111111111111112",
      );
    });

    it("should include both SOL and WSOL in SOL_MINTS array", () => {
      expect(SOL_MINTS).toContain(SOL_TOKEN_ADDRESS);
      expect(SOL_MINTS).toContain(WSOL_TOKEN_ADDRESS);
      expect(SOL_MINTS).toHaveLength(2);
    });
  });

  describe("isSolToken", () => {
    it("should return true for native SOL address", () => {
      expect(isSolToken(SOL_TOKEN_ADDRESS)).toBe(true);
    });

    it("should return false for WSOL address", () => {
      expect(isSolToken(WSOL_TOKEN_ADDRESS)).toBe(false);
    });

    it("should return false for other token addresses", () => {
      expect(isSolToken(USDC_ADDRESS)).toBe(false);
      expect(isSolToken(RANDOM_TOKEN_ADDRESS)).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isSolToken(null)).toBe(false);
      expect(isSolToken(undefined)).toBe(false);
      expect(isSolToken("")).toBe(false);
    });
  });

  describe("isWsolToken", () => {
    it("should return true for WSOL address", () => {
      expect(isWsolToken(WSOL_TOKEN_ADDRESS)).toBe(true);
    });

    it("should return false for native SOL address", () => {
      expect(isWsolToken(SOL_TOKEN_ADDRESS)).toBe(false);
    });

    it("should return false for other token addresses", () => {
      expect(isWsolToken(USDC_ADDRESS)).toBe(false);
      expect(isWsolToken(RANDOM_TOKEN_ADDRESS)).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isWsolToken(null)).toBe(false);
      expect(isWsolToken(undefined)).toBe(false);
      expect(isWsolToken("")).toBe(false);
    });
  });

  describe("isSolVariant", () => {
    it("should return true for both SOL and WSOL addresses", () => {
      expect(isSolVariant(SOL_TOKEN_ADDRESS)).toBe(true);
      expect(isSolVariant(WSOL_TOKEN_ADDRESS)).toBe(true);
    });

    it("should return false for other token addresses", () => {
      expect(isSolVariant(USDC_ADDRESS)).toBe(false);
      expect(isSolVariant(RANDOM_TOKEN_ADDRESS)).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isSolVariant(null)).toBe(false);
      expect(isSolVariant(undefined)).toBe(false);
      expect(isSolVariant("")).toBe(false);
    });
  });

  describe("getSolTokenType", () => {
    it("should return NATIVE_SOL for SOL address", () => {
      expect(getSolTokenType(SOL_TOKEN_ADDRESS)).toBe(SolTokenType.NATIVE_SOL);
    });

    it("should return WRAPPED_SOL for WSOL address", () => {
      expect(getSolTokenType(WSOL_TOKEN_ADDRESS)).toBe(
        SolTokenType.WRAPPED_SOL,
      );
    });

    it("should return OTHER for non-SOL tokens", () => {
      expect(getSolTokenType(USDC_ADDRESS)).toBe(SolTokenType.OTHER);
      expect(getSolTokenType(RANDOM_TOKEN_ADDRESS)).toBe(SolTokenType.OTHER);
    });

    it("should return OTHER for null/undefined", () => {
      expect(getSolTokenType(null)).toBe(SolTokenType.OTHER);
      expect(getSolTokenType(undefined)).toBe(SolTokenType.OTHER);
      expect(getSolTokenType("")).toBe(SolTokenType.OTHER);
    });
  });

  describe("getSolTokenDisplayName", () => {
    it("should return 'SOL' for native SOL address", () => {
      expect(getSolTokenDisplayName(SOL_TOKEN_ADDRESS)).toBe("SOL");
    });

    it("should return 'WSOL' for WSOL address", () => {
      expect(getSolTokenDisplayName(WSOL_TOKEN_ADDRESS)).toBe("WSOL");
    });

    it("should return empty string for other tokens", () => {
      expect(getSolTokenDisplayName(USDC_ADDRESS)).toBe("");
      expect(getSolTokenDisplayName(RANDOM_TOKEN_ADDRESS)).toBe("");
    });

    it("should return empty string for null/undefined", () => {
      expect(getSolTokenDisplayName(null)).toBe("");
      expect(getSolTokenDisplayName(undefined)).toBe("");
      expect(getSolTokenDisplayName("")).toBe("");
    });
  });

  describe("getGatewayTokenAddress", () => {
    it("should return SOL address unchanged", () => {
      expect(getGatewayTokenAddress(SOL_TOKEN_ADDRESS)).toBe(SOL_TOKEN_ADDRESS);
    });

    it("should return WSOL address unchanged", () => {
      expect(getGatewayTokenAddress(WSOL_TOKEN_ADDRESS)).toBe(
        WSOL_TOKEN_ADDRESS,
      );
    });

    it("should return other token addresses unchanged", () => {
      expect(getGatewayTokenAddress(USDC_ADDRESS)).toBe(USDC_ADDRESS);
      expect(getGatewayTokenAddress(RANDOM_TOKEN_ADDRESS)).toBe(
        RANDOM_TOKEN_ADDRESS,
      );
    });

    it("should return empty string for null/undefined", () => {
      expect(getGatewayTokenAddress(null)).toBe("");
      expect(getGatewayTokenAddress(undefined)).toBe("");
      expect(getGatewayTokenAddress("")).toBe("");
    });
  });

  describe("shouldUseNativeSolBalance", () => {
    it("should return true only for native SOL address", () => {
      expect(shouldUseNativeSolBalance(SOL_TOKEN_ADDRESS)).toBe(true);
    });

    it("should return false for WSOL address", () => {
      expect(shouldUseNativeSolBalance(WSOL_TOKEN_ADDRESS)).toBe(false);
    });

    it("should return false for other token addresses", () => {
      expect(shouldUseNativeSolBalance(USDC_ADDRESS)).toBe(false);
      expect(shouldUseNativeSolBalance(RANDOM_TOKEN_ADDRESS)).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(shouldUseNativeSolBalance(null)).toBe(false);
      expect(shouldUseNativeSolBalance(undefined)).toBe(false);
      expect(shouldUseNativeSolBalance("")).toBe(false);
    });
  });

  describe("Acceptance Criteria Tests", () => {
    describe("Balance Display Logic", () => {
      it("should use native SOL balance for SOL token", () => {
        expect(shouldUseNativeSolBalance(SOL_TOKEN_ADDRESS)).toBe(true);
        expect(getSolTokenType(SOL_TOKEN_ADDRESS)).toBe(
          SolTokenType.NATIVE_SOL,
        );
      });

      it("should use token account balance for WSOL token", () => {
        expect(shouldUseNativeSolBalance(WSOL_TOKEN_ADDRESS)).toBe(false);
        expect(getSolTokenType(WSOL_TOKEN_ADDRESS)).toBe(
          SolTokenType.WRAPPED_SOL,
        );
      });
    });

    describe("Gateway Address Logic", () => {
      it("should send SOL address to gateway for SOL selection", () => {
        expect(getGatewayTokenAddress(SOL_TOKEN_ADDRESS)).toBe(
          SOL_TOKEN_ADDRESS,
        );
      });

      it("should send WSOL address to gateway for WSOL selection", () => {
        expect(getGatewayTokenAddress(WSOL_TOKEN_ADDRESS)).toBe(
          WSOL_TOKEN_ADDRESS,
        );
      });
    });
  });
});
