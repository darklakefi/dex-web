/**
 * Unit tests for liquidity button state logic
 *
 * These tests verify the button state decision tree:
 * - getLiquidityButtonState - determines button state based on form/pool status
 * - getButtonMessage - returns appropriate message for each state
 * - isButtonDisabled - determines if button should be disabled
 * - isButtonLoading - determines if button should show loading indicator
 * - getButtonSeverity - returns severity level for styling
 */

import { describe, expect, it } from "vitest";
import type { ValidationState } from "../../_hooks/useLiquidityValidation";
import type { PoolDetails } from "../../_types/liquidity.types";
import {
  type ButtonState,
  type ButtonStateProps,
  getButtonMessage,
  getButtonSeverity,
  getLiquidityButtonState,
  isButtonDisabled,
  isButtonLoading,
} from "../liquidityButtonState";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL = "So11111111111111111111111111111111111111112";

function createMockValidation(
  overrides?: Partial<ValidationState>,
): ValidationState {
  return {
    errors: undefined,
    hasAmounts: false,
    hasInsufficientBalance: false,
    ...overrides,
  };
}

function createMockPoolDetails(): PoolDetails {
  return {
    fee: 0.003,
    poolAddress: "mockPoolAddress",
    price: "0.5",
    tokenXMint: USDC,
    tokenXReserve: 10000,
    tokenYMint: SOL,
    tokenYReserve: 5000,
    totalSupply: 7071,
  };
}

function createButtonStateProps(
  overrides?: Partial<ButtonStateProps>,
): ButtonStateProps {
  return {
    formCanSubmit: false,
    hasAnyAmount: false,
    hasWallet: true,
    isCalculating: false,
    isError: false,
    isFormSubmitting: false,
    isPoolLoading: false,
    isTokenAccountsLoading: false,
    poolDetails: null,
    validation: createMockValidation(),
    ...overrides,
  };
}

describe("getLiquidityButtonState", () => {
  describe("priority states (checked first)", () => {
    it("returns ERROR when isError is true", () => {
      const props = createButtonStateProps({ isError: true });
      expect(getLiquidityButtonState(props)).toBe("ERROR");
    });

    it("returns SUBMITTING when isFormSubmitting is true", () => {
      const props = createButtonStateProps({ isFormSubmitting: true });
      expect(getLiquidityButtonState(props)).toBe("SUBMITTING");
    });

    it("returns LOADING when isPoolLoading is true", () => {
      const props = createButtonStateProps({ isPoolLoading: true });
      expect(getLiquidityButtonState(props)).toBe("LOADING");
    });

    it("returns LOADING when isTokenAccountsLoading is true", () => {
      const props = createButtonStateProps({ isTokenAccountsLoading: true });
      expect(getLiquidityButtonState(props)).toBe("LOADING");
    });

    it("returns CALCULATING when isCalculating is true", () => {
      const props = createButtonStateProps({ isCalculating: true });
      expect(getLiquidityButtonState(props)).toBe("CALCULATING");
    });

    it("returns DISABLED when hasWallet is false", () => {
      const props = createButtonStateProps({ hasWallet: false });
      expect(getLiquidityButtonState(props)).toBe("DISABLED");
    });
  });

  describe("validation states", () => {
    it("returns SAME_TOKENS when validation has 'Select different tokens' error", () => {
      const props = createButtonStateProps({
        validation: createMockValidation({
          errors: { general: "Select different tokens" },
        }),
      });
      expect(getLiquidityButtonState(props)).toBe("SAME_TOKENS");
    });

    it("returns INSUFFICIENT_BALANCE when validation has insufficient balance", () => {
      const props = createButtonStateProps({
        validation: createMockValidation({
          hasInsufficientBalance: true,
        }),
      });
      expect(getLiquidityButtonState(props)).toBe("INSUFFICIENT_BALANCE");
    });
  });

  describe("create pool flow (no poolDetails)", () => {
    it("returns ENTER_AMOUNTS when no amounts and no hasAnyAmount", () => {
      const props = createButtonStateProps({
        hasAnyAmount: false,
        validation: createMockValidation({ hasAmounts: false }),
      });
      expect(getLiquidityButtonState(props)).toBe("ENTER_AMOUNTS");
    });

    it("returns CALCULATING when no amounts but hasAnyAmount is true", () => {
      const props = createButtonStateProps({
        hasAnyAmount: true,
        validation: createMockValidation({ hasAmounts: false }),
      });
      expect(getLiquidityButtonState(props)).toBe("CALCULATING");
    });

    it("returns INVALID_PRICE when validation has invalid price error", () => {
      const props = createButtonStateProps({
        validation: createMockValidation({
          errors: { initialPrice: "Invalid price" },
          hasAmounts: true,
        }),
      });
      expect(getLiquidityButtonState(props)).toBe("INVALID_PRICE");
    });

    it("returns CREATE_POOL when form can submit", () => {
      const props = createButtonStateProps({
        formCanSubmit: true,
        validation: createMockValidation({ hasAmounts: true }),
      });
      expect(getLiquidityButtonState(props)).toBe("CREATE_POOL");
    });

    it("returns CALCULATING when has amounts but form cannot submit", () => {
      const props = createButtonStateProps({
        formCanSubmit: false,
        validation: createMockValidation({ hasAmounts: true }),
      });
      expect(getLiquidityButtonState(props)).toBe("CALCULATING");
    });
  });

  describe("add liquidity flow (with poolDetails)", () => {
    it("returns ENTER_AMOUNT when no amounts and no hasAnyAmount", () => {
      const props = createButtonStateProps({
        hasAnyAmount: false,
        poolDetails: createMockPoolDetails(),
        validation: createMockValidation({ hasAmounts: false }),
      });
      expect(getLiquidityButtonState(props)).toBe("ENTER_AMOUNT");
    });

    it("returns CALCULATING when no amounts but hasAnyAmount is true", () => {
      const props = createButtonStateProps({
        hasAnyAmount: true,
        poolDetails: createMockPoolDetails(),
        validation: createMockValidation({ hasAmounts: false }),
      });
      expect(getLiquidityButtonState(props)).toBe("CALCULATING");
    });

    it("returns ADD_LIQUIDITY when form can submit", () => {
      const props = createButtonStateProps({
        formCanSubmit: true,
        poolDetails: createMockPoolDetails(),
        validation: createMockValidation({ hasAmounts: true }),
      });
      expect(getLiquidityButtonState(props)).toBe("ADD_LIQUIDITY");
    });

    it("returns CALCULATING when has amounts but form cannot submit", () => {
      const props = createButtonStateProps({
        formCanSubmit: false,
        poolDetails: createMockPoolDetails(),
        validation: createMockValidation({ hasAmounts: true }),
      });
      expect(getLiquidityButtonState(props)).toBe("CALCULATING");
    });
  });

  describe("state priority order", () => {
    it("ERROR takes priority over SUBMITTING", () => {
      const props = createButtonStateProps({
        isError: true,
        isFormSubmitting: true,
      });
      expect(getLiquidityButtonState(props)).toBe("ERROR");
    });

    it("SUBMITTING takes priority over LOADING", () => {
      const props = createButtonStateProps({
        isFormSubmitting: true,
        isPoolLoading: true,
      });
      expect(getLiquidityButtonState(props)).toBe("SUBMITTING");
    });

    it("LOADING takes priority over CALCULATING", () => {
      const props = createButtonStateProps({
        isCalculating: true,
        isPoolLoading: true,
      });
      expect(getLiquidityButtonState(props)).toBe("LOADING");
    });

    it("CALCULATING takes priority over validation checks", () => {
      const props = createButtonStateProps({
        isCalculating: true,
        validation: createMockValidation({
          errors: { general: "Select different tokens" },
        }),
      });
      expect(getLiquidityButtonState(props)).toBe("CALCULATING");
    });

    it("DISABLED (no wallet) takes priority over validation checks", () => {
      const props = createButtonStateProps({
        hasWallet: false,
        validation: createMockValidation({
          errors: { general: "Select different tokens" },
        }),
      });
      expect(getLiquidityButtonState(props)).toBe("DISABLED");
    });

    it("SAME_TOKENS takes priority over INSUFFICIENT_BALANCE", () => {
      const props = createButtonStateProps({
        validation: createMockValidation({
          errors: { general: "Select different tokens" },
          hasInsufficientBalance: true,
        }),
      });
      expect(getLiquidityButtonState(props)).toBe("SAME_TOKENS");
    });
  });
});

describe("getButtonMessage", () => {
  it("returns correct message for ADD_LIQUIDITY", () => {
    expect(getButtonMessage("ADD_LIQUIDITY")).toBe("Add Liquidity");
  });

  it("returns correct message for CALCULATING", () => {
    expect(getButtonMessage("CALCULATING")).toBe("Calculating amounts...");
  });

  it("returns correct message for CREATE_POOL", () => {
    expect(getButtonMessage("CREATE_POOL")).toBe("Create Pool");
  });

  it("returns correct message for DISABLED", () => {
    expect(getButtonMessage("DISABLED")).toBe("Connect Wallet");
  });

  it("returns correct message for ENTER_AMOUNT", () => {
    expect(getButtonMessage("ENTER_AMOUNT")).toBe("Enter an amount");
  });

  it("returns correct message for ENTER_AMOUNTS", () => {
    expect(getButtonMessage("ENTER_AMOUNTS")).toBe("Enter token amounts");
  });

  it("returns correct message for ERROR", () => {
    expect(getButtonMessage("ERROR")).toBe("Retry Transaction");
  });

  it("returns correct message for INSUFFICIENT_BALANCE", () => {
    expect(getButtonMessage("INSUFFICIENT_BALANCE")).toBe(
      "Insufficient balance",
    );
  });

  it("returns correct message for INVALID_PRICE", () => {
    expect(getButtonMessage("INVALID_PRICE")).toBe("Invalid price");
  });

  it("returns correct message for LOADING", () => {
    expect(getButtonMessage("LOADING")).toBe("Loading...");
  });

  it("returns correct message for SAME_TOKENS", () => {
    expect(getButtonMessage("SAME_TOKENS")).toBe("Select different tokens");
  });

  it("returns correct message for SUBMITTING", () => {
    expect(getButtonMessage("SUBMITTING")).toBe("Processing Transaction...");
  });

  it("has messages for all button states", () => {
    const allStates: ButtonState[] = [
      "ADD_LIQUIDITY",
      "CALCULATING",
      "CREATE_POOL",
      "DISABLED",
      "ENTER_AMOUNT",
      "ENTER_AMOUNTS",
      "ERROR",
      "INSUFFICIENT_BALANCE",
      "INVALID_PRICE",
      "LOADING",
      "SAME_TOKENS",
      "SUBMITTING",
    ];

    allStates.forEach((state) => {
      expect(getButtonMessage(state)).toBeTruthy();
      expect(typeof getButtonMessage(state)).toBe("string");
    });
  });
});

describe("isButtonDisabled", () => {
  it("returns true for LOADING", () => {
    expect(isButtonDisabled("LOADING")).toBe(true);
  });

  it("returns true for CALCULATING", () => {
    expect(isButtonDisabled("CALCULATING")).toBe(true);
  });

  it("returns true for INSUFFICIENT_BALANCE", () => {
    expect(isButtonDisabled("INSUFFICIENT_BALANCE")).toBe(true);
  });

  it("returns true for SAME_TOKENS", () => {
    expect(isButtonDisabled("SAME_TOKENS")).toBe(true);
  });

  it("returns true for INVALID_PRICE", () => {
    expect(isButtonDisabled("INVALID_PRICE")).toBe(true);
  });

  it("returns true for DISABLED", () => {
    expect(isButtonDisabled("DISABLED")).toBe(true);
  });

  it("returns true for ENTER_AMOUNTS", () => {
    expect(isButtonDisabled("ENTER_AMOUNTS")).toBe(true);
  });

  it("returns true for ENTER_AMOUNT", () => {
    expect(isButtonDisabled("ENTER_AMOUNT")).toBe(true);
  });

  it("returns false for ADD_LIQUIDITY", () => {
    expect(isButtonDisabled("ADD_LIQUIDITY")).toBe(false);
  });

  it("returns false for CREATE_POOL", () => {
    expect(isButtonDisabled("CREATE_POOL")).toBe(false);
  });

  it("returns false for ERROR", () => {
    expect(isButtonDisabled("ERROR")).toBe(false);
  });

  it("returns false for SUBMITTING", () => {
    expect(isButtonDisabled("SUBMITTING")).toBe(false);
  });
});

describe("isButtonLoading", () => {
  it("returns true for SUBMITTING", () => {
    expect(isButtonLoading("SUBMITTING")).toBe(true);
  });

  it("returns true for CALCULATING", () => {
    expect(isButtonLoading("CALCULATING")).toBe(true);
  });

  it("returns false for LOADING", () => {
    expect(isButtonLoading("LOADING")).toBe(false);
  });

  it("returns false for ADD_LIQUIDITY", () => {
    expect(isButtonLoading("ADD_LIQUIDITY")).toBe(false);
  });

  it("returns false for CREATE_POOL", () => {
    expect(isButtonLoading("CREATE_POOL")).toBe(false);
  });

  it("returns false for ERROR", () => {
    expect(isButtonLoading("ERROR")).toBe(false);
  });

  it("returns false for DISABLED", () => {
    expect(isButtonLoading("DISABLED")).toBe(false);
  });

  it("returns false for all other states", () => {
    const nonLoadingStates: ButtonState[] = [
      "ADD_LIQUIDITY",
      "CREATE_POOL",
      "DISABLED",
      "ENTER_AMOUNT",
      "ENTER_AMOUNTS",
      "ERROR",
      "INSUFFICIENT_BALANCE",
      "INVALID_PRICE",
      "LOADING",
      "SAME_TOKENS",
    ];

    nonLoadingStates.forEach((state) => {
      expect(isButtonLoading(state)).toBe(false);
    });
  });
});

describe("getButtonSeverity", () => {
  it("returns error for INSUFFICIENT_BALANCE", () => {
    expect(getButtonSeverity("INSUFFICIENT_BALANCE")).toBe("error");
  });

  it("returns error for SAME_TOKENS", () => {
    expect(getButtonSeverity("SAME_TOKENS")).toBe("error");
  });

  it("returns error for INVALID_PRICE", () => {
    expect(getButtonSeverity("INVALID_PRICE")).toBe("error");
  });

  it("returns error for ERROR", () => {
    expect(getButtonSeverity("ERROR")).toBe("error");
  });

  it("returns info for ENTER_AMOUNTS", () => {
    expect(getButtonSeverity("ENTER_AMOUNTS")).toBe("info");
  });

  it("returns info for ENTER_AMOUNT", () => {
    expect(getButtonSeverity("ENTER_AMOUNT")).toBe("info");
  });

  it("returns info for LOADING", () => {
    expect(getButtonSeverity("LOADING")).toBe("info");
  });

  it("returns info for CALCULATING", () => {
    expect(getButtonSeverity("CALCULATING")).toBe("info");
  });

  it("returns success for CREATE_POOL", () => {
    expect(getButtonSeverity("CREATE_POOL")).toBe("success");
  });

  it("returns success for ADD_LIQUIDITY", () => {
    expect(getButtonSeverity("ADD_LIQUIDITY")).toBe("success");
  });

  it("returns info for DISABLED (default case)", () => {
    expect(getButtonSeverity("DISABLED")).toBe("info");
  });

  it("returns info for SUBMITTING (default case)", () => {
    expect(getButtonSeverity("SUBMITTING")).toBe("info");
  });

  describe("severity categories", () => {
    it("groups error states correctly", () => {
      const errorStates: ButtonState[] = [
        "INSUFFICIENT_BALANCE",
        "SAME_TOKENS",
        "INVALID_PRICE",
        "ERROR",
      ];

      errorStates.forEach((state) => {
        expect(getButtonSeverity(state)).toBe("error");
      });
    });

    it("groups info states correctly", () => {
      const infoStates: ButtonState[] = [
        "ENTER_AMOUNTS",
        "ENTER_AMOUNT",
        "LOADING",
        "CALCULATING",
      ];

      infoStates.forEach((state) => {
        expect(getButtonSeverity(state)).toBe("info");
      });
    });

    it("groups success states correctly", () => {
      const successStates: ButtonState[] = ["CREATE_POOL", "ADD_LIQUIDITY"];

      successStates.forEach((state) => {
        expect(getButtonSeverity(state)).toBe("success");
      });
    });
  });
});

describe("button state helpers integration", () => {
  it("loading states are also disabled", () => {
    expect(isButtonDisabled("LOADING")).toBe(true);
    expect(isButtonDisabled("CALCULATING")).toBe(true);
  });

  it("submitting state shows loading but not disabled", () => {
    expect(isButtonLoading("SUBMITTING")).toBe(true);
    expect(isButtonDisabled("SUBMITTING")).toBe(false);
  });

  it("calculating state shows loading and disabled", () => {
    expect(isButtonLoading("CALCULATING")).toBe(true);
    expect(isButtonDisabled("CALCULATING")).toBe(true);
  });

  it("action states are not disabled or loading", () => {
    const actionStates: ButtonState[] = ["ADD_LIQUIDITY", "CREATE_POOL"];

    actionStates.forEach((state) => {
      expect(isButtonDisabled(state)).toBe(false);
      expect(isButtonLoading(state)).toBe(false);
      expect(getButtonSeverity(state)).toBe("success");
    });
  });

  it("error states are not loading but not disabled (to allow retry)", () => {
    expect(isButtonLoading("ERROR")).toBe(false);
    expect(isButtonDisabled("ERROR")).toBe(false);
    expect(getButtonSeverity("ERROR")).toBe("error");
  });
});
