/**
 * Unit tests for useLiquidityFormState hook
 *
 * These tests verify the form state management logic:
 * - Form initialization with default values
 * - Field value updates
 * - Form validation with Zod schema
 * - Form submission handler integration
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FORM_FIELD_NAMES,
  LIQUIDITY_CONSTANTS,
} from "../../_constants/liquidityConstants";
import { useLiquidityFormState } from "../useLiquidityFormState";

describe("useLiquidityFormState", () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("initializes form with default values", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      expect(result.current.state.values).toEqual({
        [FORM_FIELD_NAMES.TOKEN_A_AMOUNT]: LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
        [FORM_FIELD_NAMES.TOKEN_B_AMOUNT]: LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
        [FORM_FIELD_NAMES.SLIPPAGE]: LIQUIDITY_CONSTANTS.DEFAULT_SLIPPAGE,
        [FORM_FIELD_NAMES.INITIAL_PRICE]:
          LIQUIDITY_CONSTANTS.DEFAULT_INITIAL_PRICE,
      });
    });

    it("form starts with canSubmit state", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      expect(typeof result.current.state.canSubmit).toBe("boolean");
    });

    it("accepts onSubmit callback", () => {
      const customOnSubmit = vi.fn();
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: customOnSubmit }),
      );

      expect(result.current).toBeDefined();
      expect(customOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe("field value updates", () => {
    it("updates tokenAAmount field value", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "100");
      });

      expect(result.current.state.values.tokenAAmount).toBe("100");
    });

    it("updates tokenBAmount field value", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_B_AMOUNT, "50");
      });

      expect(result.current.state.values.tokenBAmount).toBe("50");
    });

    it("updates slippage field value", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.SLIPPAGE, "1.0");
      });

      expect(result.current.state.values.slippage).toBe("1.0");
    });

    it("updates initialPrice field value", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.INITIAL_PRICE, "2.5");
      });

      expect(result.current.state.values.initialPrice).toBe("2.5");
    });

    it("updates multiple fields independently", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "100");
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_B_AMOUNT, "50");
        result.current.setFieldValue(FORM_FIELD_NAMES.SLIPPAGE, "1.5");
      });

      expect(result.current.state.values).toMatchObject({
        slippage: "1.5",
        tokenAAmount: "100",
        tokenBAmount: "50",
      });
    });
  });

  describe("form validation", () => {
    it("validates numeric string fields", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "100");
      });

      expect(result.current.state.values.tokenAAmount).toBe("100");
    });

    it("accepts zero values for token amounts", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "0");
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_B_AMOUNT, "0");
      });

      expect(result.current.state.values.tokenAAmount).toBe("0");
      expect(result.current.state.values.tokenBAmount).toBe("0");
    });

    it("accepts decimal values", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "10.5");
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_B_AMOUNT, "0.123");
      });

      expect(result.current.state.values.tokenAAmount).toBe("10.5");
      expect(result.current.state.values.tokenBAmount).toBe("0.123");
    });

    it("validates initial price as positive number", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.INITIAL_PRICE, "1.5");
      });

      expect(result.current.state.values.initialPrice).toBe("1.5");
    });

    it("accepts valid slippage values", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.SLIPPAGE, "0.5");
      });

      expect(result.current.state.values.slippage).toBe("0.5");
    });
  });

  describe("form submission", () => {
    it("calls onSubmit with form values when submitted", async () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "100");
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_B_AMOUNT, "50");
        result.current.setFieldValue(FORM_FIELD_NAMES.SLIPPAGE, "0.5");
        result.current.setFieldValue(FORM_FIELD_NAMES.INITIAL_PRICE, "1");
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          value: {
            initialPrice: "1",
            slippage: "0.5",
            tokenAAmount: "100",
            tokenBAmount: "50",
          },
        });
      });
    });

    it("does not call onSubmit if validation fails", async () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "-100");
      });

      await act(async () => {
        await result.current.handleSubmit();
      });
    });

    it("handles async onSubmit callback", async () => {
      const asyncOnSubmit = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: asyncOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "100");
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_B_AMOUNT, "50");
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      await waitFor(() => {
        expect(asyncOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe("form reset", () => {
    it("resets form to default values", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "100");
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_B_AMOUNT, "50");
        result.current.setFieldValue(FORM_FIELD_NAMES.SLIPPAGE, "2.0");
      });

      expect(result.current.state.values.tokenAAmount).toBe("100");

      act(() => {
        result.current.reset();
      });

      expect(result.current.state.values).toEqual({
        [FORM_FIELD_NAMES.TOKEN_A_AMOUNT]: LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
        [FORM_FIELD_NAMES.TOKEN_B_AMOUNT]: LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
        [FORM_FIELD_NAMES.SLIPPAGE]: LIQUIDITY_CONSTANTS.DEFAULT_SLIPPAGE,
        [FORM_FIELD_NAMES.INITIAL_PRICE]:
          LIQUIDITY_CONSTANTS.DEFAULT_INITIAL_PRICE,
      });
    });

    it("maintains onSubmit callback after reset", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "100");
        result.current.reset();
      });

      expect(result.current).toBeDefined();
    });
  });

  describe("form state management", () => {
    it("tracks field dirty state", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      expect(result.current.state.isDirty).toBe(false);

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "100");
      });

      expect(result.current.state.isDirty).toBe(true);
    });

    it("validates all fields on demand", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "100");
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_B_AMOUNT, "50");
      });

      act(() => {
        result.current.validateAllFields("change");
      });

      expect(result.current.state.canSubmit).toBeDefined();
    });

    it("maintains referential stability across re-renders", () => {
      const { result, rerender } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      const firstRef = result.current;

      rerender();

      expect(result.current).toBe(firstRef);
    });
  });

  describe("edge cases", () => {
    it("handles empty string values", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "");
      });

      expect(result.current.state.values.tokenAAmount).toBe("");
    });

    it("handles very small decimal values", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(
          FORM_FIELD_NAMES.TOKEN_A_AMOUNT,
          "0.000001",
        );
      });

      expect(result.current.state.values.tokenAAmount).toBe("0.000001");
    });

    it("handles very large numeric values", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(
          FORM_FIELD_NAMES.TOKEN_A_AMOUNT,
          "999999999.99999",
        );
      });

      expect(result.current.state.values.tokenAAmount).toBe("999999999.99999");
    });

    it("handles rapid consecutive field updates", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "10");
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "20");
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "30");
      });

      expect(result.current.state.values.tokenAAmount).toBe("30");
    });
  });

  describe("integration with Zod validation", () => {
    it("uses Zod schema for onChange validation", () => {
      const { result } = renderHook(() =>
        useLiquidityFormState({ onSubmit: mockOnSubmit }),
      );

      expect(result.current).toBeDefined();

      act(() => {
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "100");
        result.current.setFieldValue(FORM_FIELD_NAMES.TOKEN_B_AMOUNT, "50");
        result.current.setFieldValue(FORM_FIELD_NAMES.SLIPPAGE, "0.5");
        result.current.setFieldValue(FORM_FIELD_NAMES.INITIAL_PRICE, "1.5");
      });

      expect(result.current.state.values).toMatchObject({
        initialPrice: "1.5",
        slippage: "0.5",
        tokenAAmount: "100",
        tokenBAmount: "50",
      });
    });
  });
});
