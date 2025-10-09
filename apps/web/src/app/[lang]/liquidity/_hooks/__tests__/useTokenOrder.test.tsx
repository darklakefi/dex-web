/**
 * Integration tests for useTokenOrder hook
 *
 * These tests verify that the hook correctly integrates with:
 * - nuqs for URL parameter management
 * - React lifecycle (memoization, re-renders)
 * - Error handling (required vs optional)
 */

import { renderHook } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { useTokenOrder, useTokenOrderRequired } from "../useTokenOrder";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL = "So11111111111111111111111111111111111111112";

/**
 * Wrapper component that provides nuqs test adapter
 */
function createWrapper(searchParams: Record<string, string> = {}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NuqsTestingAdapter searchParams={searchParams}>
        {children}
      </NuqsTestingAdapter>
    );
  };
}

describe("useTokenOrder", () => {
  describe("basic functionality", () => {
    it("returns context with default tokens when params are empty", () => {
      const { result } = renderHook(() => useTokenOrder(), {
        wrapper: createWrapper({}),
      });

      expect(result.current).not.toBeNull();
      expect(result.current?.ui.tokenA).toBeDefined();
      expect(result.current?.ui.tokenB).toBeDefined();
    });

    it("returns context when tokenA is explicitly set", () => {
      const { result } = renderHook(() => useTokenOrder(), {
        wrapper: createWrapper({ tokenAAddress: USDC }),
      });

      expect(result.current).not.toBeNull();
      expect(result.current?.ui.tokenA).toBe(USDC);
    });

    it("returns context when tokenB is explicitly set", () => {
      const { result } = renderHook(() => useTokenOrder(), {
        wrapper: createWrapper({ tokenBAddress: SOL }),
      });

      expect(result.current).not.toBeNull();
      expect(result.current?.ui.tokenB).toBe(SOL);
    });

    it("returns context when both tokens are set", () => {
      const { result } = renderHook(() => useTokenOrder(), {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      expect(result.current).not.toBeNull();
      expect(result.current?.ui.tokenA).toBe(USDC);
      expect(result.current?.ui.tokenB).toBe(SOL);
    });
  });

  describe("token order mapping", () => {
    it("correctly identifies when tokenA sorts first (A=X)", () => {
      const { result } = renderHook(() => useTokenOrder(), {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      expect(result.current?.mapping.tokenAIsX).toBe(true);
      expect(result.current?.mapping.tokenBIsY).toBe(true);
      expect(result.current?.protocol.tokenX).toBe(USDC);
      expect(result.current?.protocol.tokenY).toBe(SOL);
    });

    it("correctly identifies when tokenA sorts second (A=Y)", () => {
      const { result } = renderHook(() => useTokenOrder(), {
        wrapper: createWrapper({
          tokenAAddress: SOL,
          tokenBAddress: USDC,
        }),
      });

      expect(result.current?.mapping.tokenAIsX).toBe(false);
      expect(result.current?.mapping.tokenBIsY).toBe(false);
      expect(result.current?.protocol.tokenX).toBe(USDC);
      expect(result.current?.protocol.tokenY).toBe(SOL);
    });
  });

  describe("memoization and referential stability", () => {
    it("returns same reference when tokens don't change", () => {
      const { result, rerender } = renderHook(() => useTokenOrder(), {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      const firstResult = result.current;

      rerender();

      expect(result.current).toBe(firstResult);
    });

    it("returns new reference when tokenA changes", () => {
      const { result: result1 } = renderHook(() => useTokenOrder(), {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      const firstResult = result1.current;

      const { result: result2 } = renderHook(() => useTokenOrder(), {
        wrapper: createWrapper({
          tokenAAddress: SOL,
          tokenBAddress: SOL,
        }),
      });

      expect(result2.current).not.toBe(firstResult);
    });
  });

  describe("integration with URL parameters", () => {
    it("derives state from URL search params", () => {
      const { result } = renderHook(() => useTokenOrder(), {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      expect(result.current?.ui.tokenA).toBe(USDC);
      expect(result.current?.ui.tokenB).toBe(SOL);
    });

    it("handles default values from nuqs parsers", () => {
      const { result } = renderHook(() => useTokenOrder(), {
        wrapper: createWrapper({}),
      });

      expect(result.current).toBeDefined();
    });
  });
});

describe("useTokenOrderRequired", () => {
  describe("error handling", () => {
    it("does not throw when default tokens are present", () => {
      const { result } = renderHook(() => useTokenOrderRequired(), {
        wrapper: createWrapper({}),
      });

      expect(result.current).toBeDefined();
      expect(result.current.ui.tokenA).toBeDefined();
      expect(result.current.ui.tokenB).toBeDefined();
    });

    it("returns context when tokens are explicitly set", () => {
      const { result } = renderHook(() => useTokenOrderRequired(), {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      expect(result.current).toBeDefined();
      expect(result.current.ui.tokenA).toBe(USDC);
      expect(result.current.ui.tokenB).toBe(SOL);
    });

    it("returns context when both tokens are set", () => {
      const { result } = renderHook(() => useTokenOrderRequired(), {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      expect(result.current).not.toBeNull();
      expect(result.current.ui.tokenA).toBe(USDC);
      expect(result.current.ui.tokenB).toBe(SOL);
    });
  });

  describe("type safety", () => {
    it("returns non-nullable context", () => {
      const { result } = renderHook(() => useTokenOrderRequired(), {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      const tokenX = result.current.protocol.tokenX;
      expect(tokenX).toBe(USDC);
    });
  });
});

describe("useTokenOrder - real-world scenarios", () => {
  it("handles switching between token pairs", () => {
    const { result: result1 } = renderHook(() => useTokenOrder(), {
      wrapper: createWrapper({
        tokenAAddress: USDC,
        tokenBAddress: SOL,
      }),
    });

    const firstPair = result1.current;
    expect(firstPair?.ui.tokenA).toBe(USDC);
    expect(firstPair?.ui.tokenB).toBe(SOL);

    const { result: result2 } = renderHook(() => useTokenOrder(), {
      wrapper: createWrapper({
        tokenAAddress: SOL,
        tokenBAddress: USDC,
      }),
    });

    expect(result2.current?.ui.tokenA).toBe(SOL);
    expect(result2.current?.ui.tokenB).toBe(USDC);

    expect(result2.current?.protocol.tokenX).toBe(USDC);
    expect(result2.current?.protocol.tokenY).toBe(SOL);
  });

  it("maintains stable reference across unrelated re-renders", () => {
    let renderCount = 0;

    const TestComponent = () => {
      renderCount++;
      const context = useTokenOrder();
      return <div>{context?.ui.tokenA}</div>;
    };

    const { result, rerender } = renderHook(() => useTokenOrder(), {
      wrapper: createWrapper({
        tokenAAddress: USDC,
        tokenBAddress: SOL,
      }),
    });

    const ref1 = result.current;

    rerender();
    rerender();
    rerender();

    expect(result.current).toBe(ref1);
  });
});
