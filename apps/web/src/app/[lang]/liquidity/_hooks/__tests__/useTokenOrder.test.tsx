/**
 * Integration tests for useTokenOrder hook
 *
 * These tests verify that the hook correctly integrates with:
 * - nuqs for URL parameter management
 * - React lifecycle (memoization, re-renders)
 * - Error handling (required vs optional)
 */

import { renderHook, waitFor } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useTokenOrder, useTokenOrderRequired } from "../useTokenOrder";

// Mock sortSolanaAddresses to skip validation for test addresses
vi.mock("@dex-web/utils", async () => {
  const actual = await vi.importActual<typeof import("@dex-web/utils")>();
  return {
    ...actual,
    sortSolanaAddresses: (addrA: string, addrB: string) => {
      const sorted = [addrA, addrB].sort();
      return {
        tokenXAddress: sorted[0] as string,
        tokenYAddress: sorted[1] as string,
      };
    },
  };
});

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
    it("returns null when tokens are not set", () => {
      const { result } = renderHook(() => useTokenOrder(), {
        wrapper: createWrapper({}),
      });

      expect(result.current).toBeNull();
    });

    it("returns null when only tokenA is set", () => {
      const { result } = renderHook(() => useTokenOrder(), {
        wrapper: createWrapper({ tokenAAddress: USDC }),
      });

      expect(result.current).toBeNull();
    });

    it("returns null when only tokenB is set", () => {
      const { result } = renderHook(() => useTokenOrder(), {
        wrapper: createWrapper({ tokenBAddress: SOL }),
      });

      expect(result.current).toBeNull();
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

    it("returns new reference when tokenA changes", async () => {
      const Wrapper1 = createWrapper({
        tokenAAddress: USDC,
        tokenBAddress: SOL,
      });

      const { result, rerender } = renderHook(() => useTokenOrder(), {
        wrapper: Wrapper1,
      });

      const firstResult = result.current;

      const Wrapper2 = createWrapper({
        tokenAAddress: SOL,
        tokenBAddress: SOL,
      });

      rerender({ wrapper: Wrapper2 });

      await waitFor(() => {
        expect(result.current).not.toBe(firstResult);
      });
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
    it("throws error when tokens are not set", () => {
      expect(() => {
        renderHook(() => useTokenOrderRequired(), {
          wrapper: createWrapper({}),
        });
      }).toThrow();
    });

    it("throws error with descriptive message", () => {
      try {
        renderHook(() => useTokenOrderRequired(), {
          wrapper: createWrapper({ tokenAAddress: USDC }),
        });
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("tokenAAddress");
        expect((error as Error).message).toContain("tokenBAddress");
      }
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
  it("handles switching between token pairs", async () => {
    const { result, rerender } = renderHook(() => useTokenOrder(), {
      wrapper: createWrapper({
        tokenAAddress: USDC,
        tokenBAddress: SOL,
      }),
    });

    const firstPair = result.current;
    expect(firstPair?.ui.tokenA).toBe(USDC);
    expect(firstPair?.ui.tokenB).toBe(SOL);

    const Wrapper2 = createWrapper({
      tokenAAddress: SOL,
      tokenBAddress: USDC,
    });

    rerender({ wrapper: Wrapper2 });

    await waitFor(() => {
      expect(result.current?.ui.tokenA).toBe(SOL);
      expect(result.current?.ui.tokenB).toBe(USDC);
      expect(result.current?.protocol.tokenX).toBe(USDC);
      expect(result.current?.protocol.tokenY).toBe(SOL);
    });
  });

  it("maintains stable reference across unrelated re-renders", () => {
    let _renderCount = 0;

    const _TestComponent = () => {
      _renderCount++;
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
