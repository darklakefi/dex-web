import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLiquidityForm } from "../useLiquidityForm";

describe("useLiquidityForm", () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

  it("returns form object with correct default values", () => {
    const { result } = renderHook(() =>
      useLiquidityForm({
        onSubmit: mockOnSubmit,
        publicKey: null,
        tokenAAccount: undefined,
      }),
    );

    expect(result.current.form).toBeDefined();
    expect(result.current.form.state.values).toEqual({
      initialPrice: "1",
      tokenAAmount: "0",
      tokenBAmount: "0",
    });
  });

  it("returns resetFormToDefaults function", () => {
    const { result } = renderHook(() =>
      useLiquidityForm({
        onSubmit: mockOnSubmit,
        publicKey: null,
        tokenAAccount: undefined,
      }),
    );

    expect(result.current.resetFormToDefaults).toBeDefined();
    expect(typeof result.current.resetFormToDefaults).toBe("function");
  });

  it("returns validateSufficientBalance function", () => {
    const { result } = renderHook(() =>
      useLiquidityForm({
        onSubmit: mockOnSubmit,
        publicKey: null,
        tokenAAccount: undefined,
      }),
    );

    expect(result.current.validateSufficientBalance).toBeDefined();
    expect(typeof result.current.validateSufficientBalance).toBe("function");
  });
});
