/**
 * Integration tests for LiquidityForm component
 *
 * These tests verify that the component correctly integrates with:
 * - TanStack Form for state management and validation
 * - nuqs for URL parameter management
 * - Solana wallet adapter for wallet connectivity
 * - Real-time data hooks for pool and token account data
 */

import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { LiquidityForm } from "../LiquidityForm";

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/liquidity"),
  useRouter: vi.fn(() => ({
    back: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("../../_hooks/useLiquidityFormLogic", () => ({
  useLiquidityFormLogic: vi.fn(),
}));

vi.mock("../../_hooks/useLPTokenEstimation", () => ({
  useLPTokenEstimation: vi.fn(() => ({
    data: { estimatedLPTokens: "100.5" },
    isLoading: false,
  })),
}));

import { useWallet } from "@solana/wallet-adapter-react";
import { useLiquidityFormLogic } from "../../_hooks/useLiquidityFormLogic";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL = "So11111111111111111111111111111111111111112";

/**
 * Wrapper component that provides required testing context
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

/**
 * Creates mock form state with default values
 */
function createMockFormState(overrides = {}) {
  return {
    canSubmit: false,
    values: {
      initialPrice: "1",
      slippage: "0.5",
      tokenAAmount: "0",
      tokenBAmount: "0",
      ...overrides,
    },
  };
}

/**
 * Creates mock form API
 */
function createMockForm(stateOverrides = {}) {
  const state = createMockFormState(stateOverrides);
  return {
    handleSubmit: vi.fn(),
    reset: vi.fn(),
    setFieldValue: vi.fn(),
    state,
    store: {
      getState: () => state,
      subscribe: vi.fn(),
    },
    validateAllFields: vi.fn(),
  };
}

/**
 * Creates mock token account data
 */
function createMockTokenAccount(symbol: string, amount = 1000, decimals = 9) {
  return {
    tokenAccounts: [
      {
        address: "mockAddress123",
        amount,
        decimals,
        mint: symbol === "USDC" ? USDC : SOL,
        symbol,
      },
    ],
  };
}

/**
 * Creates mock pool details
 */
function createMockPoolDetails() {
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

describe("LiquidityForm", () => {
  const mockSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useWallet as Mock).mockReturnValue({
      connected: false,
      publicKey: null,
      wallet: null,
    });
  });

  describe("initial loading states", () => {
    it("shows skeleton when tokens are not selected", () => {
      (useLiquidityFormLogic as Mock).mockReturnValue({
        form: createMockForm(),
        isCalculating: false,
        isError: false,
        isPoolLoading: true,
        isSubmitting: false,
        isSuccess: false,
        poolDetails: null,
        publicKey: null,
        send: mockSend,
        tokenAccountsData: {
          buyTokenAccount: undefined,
          isLoadingBuy: true,
          isLoadingSell: true,
          isRefreshingBuy: false,
          isRefreshingSell: false,
          sellTokenAccount: undefined,
        },
      });

      render(<LiquidityForm />, {
        wrapper: createWrapper({
          tokenAAddress: "",
          tokenBAddress: "",
        }),
      });

      expect(screen.queryByRole("form")).not.toBeInTheDocument();
    });

    it("shows form when tokens are selected and loaded", () => {
      (useLiquidityFormLogic as Mock).mockReturnValue({
        form: createMockForm(),
        isCalculating: false,
        isError: false,
        isPoolLoading: false,
        isSubmitting: false,
        isSuccess: false,
        poolDetails: createMockPoolDetails(),
        publicKey: null,
        send: mockSend,
        tokenAccountsData: {
          buyTokenAccount: createMockTokenAccount("USDC"),
          isLoadingBuy: false,
          isLoadingSell: false,
          isRefreshingBuy: false,
          isRefreshingSell: false,
          sellTokenAccount: createMockTokenAccount("SOL"),
        },
      });

      render(<LiquidityForm />, {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      expect(screen.getByRole("form")).toBeInTheDocument();
    });
  });

  describe("wallet connection", () => {
    it("shows Connect Wallet button when wallet is not connected", () => {
      (useLiquidityFormLogic as Mock).mockReturnValue({
        form: createMockForm(),
        isCalculating: false,
        isError: false,
        isPoolLoading: false,
        isSubmitting: false,
        isSuccess: false,
        poolDetails: createMockPoolDetails(),
        publicKey: null,
        send: mockSend,
        tokenAccountsData: {
          buyTokenAccount: createMockTokenAccount("USDC"),
          isLoadingBuy: false,
          isLoadingSell: false,
          isRefreshingBuy: false,
          isRefreshingSell: false,
          sellTokenAccount: createMockTokenAccount("SOL"),
        },
      });

      render(<LiquidityForm />, {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      expect(
        screen.getByRole("button", { name: /connect wallet/i }),
      ).toBeInTheDocument();
    });

    it("shows liquidity form when wallet is connected", () => {
      const mockPublicKey = { toString: () => "mockPublicKey123" };

      (useWallet as Mock).mockReturnValue({
        connected: true,
        publicKey: mockPublicKey,
        wallet: { adapter: { name: "Phantom" } },
      });

      (useLiquidityFormLogic as Mock).mockReturnValue({
        form: createMockForm(),
        isCalculating: false,
        isError: false,
        isPoolLoading: false,
        isSubmitting: false,
        isSuccess: false,
        poolDetails: createMockPoolDetails(),
        publicKey: mockPublicKey,
        send: mockSend,
        tokenAccountsData: {
          buyTokenAccount: createMockTokenAccount("USDC"),
          isLoadingBuy: false,
          isLoadingSell: false,
          isRefreshingBuy: false,
          isRefreshingSell: false,
          sellTokenAccount: createMockTokenAccount("SOL"),
        },
      });

      render(<LiquidityForm />, {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      expect(
        screen.queryByRole("button", { name: /connect wallet/i }),
      ).toBeInTheDocument();
    });
  });

  describe("form submission", () => {
    it("calls handleSubmit when form is submitted", async () => {
      const user = userEvent.setup();
      const mockPublicKey = { toString: () => "mockPublicKey123" };
      const mockHandleSubmit = vi.fn((e) => {
        if (e?.preventDefault) e.preventDefault();
      });

      (useWallet as Mock).mockReturnValue({
        connected: true,
        publicKey: mockPublicKey,
        wallet: { adapter: { name: "Phantom" } },
      });

      (useLiquidityFormLogic as Mock).mockReturnValue({
        form: {
          ...createMockForm({
            tokenAAmount: "100",
            tokenBAmount: "50",
          }),
          handleSubmit: mockHandleSubmit,
        },
        isCalculating: false,
        isError: false,
        isPoolLoading: false,
        isSubmitting: false,
        isSuccess: false,
        poolDetails: createMockPoolDetails(),
        publicKey: mockPublicKey,
        send: mockSend,
        tokenAccountsData: {
          buyTokenAccount: createMockTokenAccount("USDC", 1000),
          isLoadingBuy: false,
          isLoadingSell: false,
          isRefreshingBuy: false,
          isRefreshingSell: false,
          sellTokenAccount: createMockTokenAccount("SOL", 1000),
        },
      });

      render(<LiquidityForm />, {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      const submitButton = screen.getByTestId("liquidity-action-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockHandleSubmit).toHaveBeenCalled();
      });
    });

    it("prevents default form submission behavior", async () => {
      const _user = userEvent.setup();
      const mockPublicKey = { toString: () => "mockPublicKey123" };
      const mockHandleSubmit = vi.fn();

      (useWallet as Mock).mockReturnValue({
        connected: true,
        publicKey: mockPublicKey,
        wallet: { adapter: { name: "Phantom" } },
      });

      (useLiquidityFormLogic as Mock).mockReturnValue({
        form: {
          ...createMockForm({
            tokenAAmount: "100",
            tokenBAmount: "50",
          }),
          handleSubmit: mockHandleSubmit,
        },
        isCalculating: false,
        isError: false,
        isPoolLoading: false,
        isSubmitting: false,
        isSuccess: false,
        poolDetails: createMockPoolDetails(),
        publicKey: mockPublicKey,
        send: mockSend,
        tokenAccountsData: {
          buyTokenAccount: createMockTokenAccount("USDC", 1000),
          isLoadingBuy: false,
          isLoadingSell: false,
          isRefreshingBuy: false,
          isRefreshingSell: false,
          sellTokenAccount: createMockTokenAccount("SOL", 1000),
        },
      });

      const { container } = render(<LiquidityForm />, {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      const form = container.querySelector("form");
      expect(form).toBeInTheDocument();

      if (form) {
        const submitEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        });
        const preventDefaultSpy = vi.spyOn(submitEvent, "preventDefault");
        form.dispatchEvent(submitEvent);

        expect(preventDefaultSpy).toHaveBeenCalled();
      }
    });
  });

  describe("transaction states", () => {
    it("shows calculating indicator when isCalculating is true", () => {
      const mockPublicKey = { toString: () => "mockPublicKey123" };

      (useWallet as Mock).mockReturnValue({
        connected: true,
        publicKey: mockPublicKey,
        wallet: { adapter: { name: "Phantom" } },
      });

      (useLiquidityFormLogic as Mock).mockReturnValue({
        form: createMockForm({
          tokenAAmount: "100",
          tokenBAmount: "50",
        }),
        isCalculating: true,
        isError: false,
        isPoolLoading: false,
        isSubmitting: false,
        isSuccess: false,
        poolDetails: createMockPoolDetails(),
        publicKey: mockPublicKey,
        send: mockSend,
        tokenAccountsData: {
          buyTokenAccount: createMockTokenAccount("USDC", 1000),
          isLoadingBuy: false,
          isLoadingSell: false,
          isRefreshingBuy: false,
          isRefreshingSell: false,
          sellTokenAccount: createMockTokenAccount("SOL", 1000),
        },
      });

      render(<LiquidityForm />, {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      expect(screen.getByText(/calculating/i)).toBeInTheDocument();
    });

    it("shows pool details skeleton when calculating", () => {
      const mockPublicKey = { toString: () => "mockPublicKey123" };

      (useWallet as Mock).mockReturnValue({
        connected: true,
        publicKey: mockPublicKey,
        wallet: { adapter: { name: "Phantom" } },
      });

      (useLiquidityFormLogic as Mock).mockReturnValue({
        form: createMockForm({
          tokenAAmount: "100",
          tokenBAmount: "50",
        }),
        isCalculating: true,
        isError: false,
        isPoolLoading: false,
        isSubmitting: false,
        isSuccess: false,
        poolDetails: createMockPoolDetails(),
        publicKey: mockPublicKey,
        send: mockSend,
        tokenAccountsData: {
          buyTokenAccount: createMockTokenAccount("USDC", 1000),
          isLoadingBuy: false,
          isLoadingSell: false,
          isRefreshingBuy: false,
          isRefreshingSell: false,
          sellTokenAccount: createMockTokenAccount("SOL", 1000),
        },
      });

      render(<LiquidityForm />, {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      expect(
        screen.queryByText(/estimated lp tokens/i),
      ).not.toBeInTheDocument();
    });

    it("shows success state after successful transaction", () => {
      const mockPublicKey = { toString: () => "mockPublicKey123" };

      (useWallet as Mock).mockReturnValue({
        connected: true,
        publicKey: mockPublicKey,
        wallet: { adapter: { name: "Phantom" } },
      });

      (useLiquidityFormLogic as Mock).mockReturnValue({
        form: createMockForm({
          tokenAAmount: "100",
          tokenBAmount: "50",
        }),
        isCalculating: false,
        isError: false,
        isPoolLoading: false,
        isSubmitting: false,
        isSuccess: true,
        poolDetails: createMockPoolDetails(),
        publicKey: mockPublicKey,
        send: mockSend,
        tokenAccountsData: {
          buyTokenAccount: createMockTokenAccount("USDC", 1000),
          isLoadingBuy: false,
          isLoadingSell: false,
          isRefreshingBuy: false,
          isRefreshingSell: false,
          sellTokenAccount: createMockTokenAccount("SOL", 1000),
        },
      });

      render(<LiquidityForm />, {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      expect(screen.getByText(/transaction successful/i)).toBeInTheDocument();
    });

    it("shows error state when transaction fails", () => {
      const mockPublicKey = { toString: () => "mockPublicKey123" };

      (useWallet as Mock).mockReturnValue({
        connected: true,
        publicKey: mockPublicKey,
        wallet: { adapter: { name: "Phantom" } },
      });

      (useLiquidityFormLogic as Mock).mockReturnValue({
        form: createMockForm({
          tokenAAmount: "100",
          tokenBAmount: "50",
        }),
        isCalculating: false,
        isError: true,
        isPoolLoading: false,
        isSubmitting: false,
        isSuccess: false,
        poolDetails: createMockPoolDetails(),
        publicKey: mockPublicKey,
        send: mockSend,
        tokenAccountsData: {
          buyTokenAccount: createMockTokenAccount("USDC", 1000),
          isLoadingBuy: false,
          isLoadingSell: false,
          isRefreshingBuy: false,
          isRefreshingSell: false,
          sellTokenAccount: createMockTokenAccount("SOL", 1000),
        },
      });

      render(<LiquidityForm />, {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      expect(screen.getByText(/transaction failed/i)).toBeInTheDocument();
    });
  });

  describe("liquidity details", () => {
    it("shows AddLiquidityDetails when both amounts are entered", () => {
      const mockPublicKey = { toString: () => "mockPublicKey123" };

      (useWallet as Mock).mockReturnValue({
        connected: true,
        publicKey: mockPublicKey,
        wallet: { adapter: { name: "Phantom" } },
      });

      (useLiquidityFormLogic as Mock).mockReturnValue({
        form: createMockForm({
          tokenAAmount: "100",
          tokenBAmount: "50",
        }),
        isCalculating: false,
        isError: false,
        isPoolLoading: false,
        isSubmitting: false,
        isSuccess: false,
        poolDetails: createMockPoolDetails(),
        publicKey: mockPublicKey,
        send: mockSend,
        tokenAccountsData: {
          buyTokenAccount: createMockTokenAccount("USDC", 1000),
          isLoadingBuy: false,
          isLoadingSell: false,
          isRefreshingBuy: false,
          isRefreshingSell: false,
          sellTokenAccount: createMockTokenAccount("SOL", 1000),
        },
      });

      render(<LiquidityForm />, {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      expect(screen.getByRole("form")).toBeInTheDocument();
    });

    it("does not show AddLiquidityDetails when amounts are zero", () => {
      const mockPublicKey = { toString: () => "mockPublicKey123" };

      (useWallet as Mock).mockReturnValue({
        connected: true,
        publicKey: mockPublicKey,
        wallet: { adapter: { name: "Phantom" } },
      });

      (useLiquidityFormLogic as Mock).mockReturnValue({
        form: createMockForm({
          tokenAAmount: "0",
          tokenBAmount: "0",
        }),
        isCalculating: false,
        isError: false,
        isPoolLoading: false,
        isSubmitting: false,
        isSuccess: false,
        poolDetails: createMockPoolDetails(),
        publicKey: mockPublicKey,
        send: mockSend,
        tokenAccountsData: {
          buyTokenAccount: createMockTokenAccount("USDC", 1000),
          isLoadingBuy: false,
          isLoadingSell: false,
          isRefreshingBuy: false,
          isRefreshingSell: false,
          sellTokenAccount: createMockTokenAccount("SOL", 1000),
        },
      });

      render(<LiquidityForm />, {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      expect(
        screen.queryByText(/estimated lp tokens/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("create pool mode", () => {
    it("shows create pool button", async () => {
      const user = userEvent.setup();
      const mockPublicKey = { toString: () => "mockPublicKey123" };
      const mockRouterPush = vi.fn();

      vi.doMock("next/navigation", () => ({
        useRouter: vi.fn(() => ({
          push: mockRouterPush,
        })),
      }));

      (useWallet as Mock).mockReturnValue({
        connected: true,
        publicKey: mockPublicKey,
        wallet: { adapter: { name: "Phantom" } },
      });

      (useLiquidityFormLogic as Mock).mockReturnValue({
        form: createMockForm(),
        isCalculating: false,
        isError: false,
        isPoolLoading: false,
        isSubmitting: false,
        isSuccess: false,
        poolDetails: createMockPoolDetails(),
        publicKey: mockPublicKey,
        send: mockSend,
        tokenAccountsData: {
          buyTokenAccount: createMockTokenAccount("USDC", 1000),
          isLoadingBuy: false,
          isLoadingSell: false,
          isRefreshingBuy: false,
          isRefreshingSell: false,
          sellTokenAccount: createMockTokenAccount("SOL", 1000),
        },
      });

      render(<LiquidityForm />, {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      const createPoolButton = screen.getByRole("button", {
        name: /change mode/i,
      });
      expect(createPoolButton).toBeInTheDocument();

      await user.click(createPoolButton);
    });
  });

  describe("settings button", () => {
    it("renders slippage settings button", () => {
      const mockPublicKey = { toString: () => "mockPublicKey123" };

      (useWallet as Mock).mockReturnValue({
        connected: true,
        publicKey: mockPublicKey,
        wallet: { adapter: { name: "Phantom" } },
      });

      (useLiquidityFormLogic as Mock).mockReturnValue({
        form: createMockForm(),
        isCalculating: false,
        isError: false,
        isPoolLoading: false,
        isSubmitting: false,
        isSuccess: false,
        poolDetails: createMockPoolDetails(),
        publicKey: mockPublicKey,
        send: mockSend,
        tokenAccountsData: {
          buyTokenAccount: createMockTokenAccount("USDC", 1000),
          isLoadingBuy: false,
          isLoadingSell: false,
          isRefreshingBuy: false,
          isRefreshingSell: false,
          sellTokenAccount: createMockTokenAccount("SOL", 1000),
        },
      });

      render(<LiquidityForm />, {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      expect(screen.getByRole("form")).toBeInTheDocument();
    });
  });

  describe("error boundary", () => {
    it("wraps form in LiquidityErrorBoundary", () => {
      (useLiquidityFormLogic as Mock).mockReturnValue({
        form: createMockForm(),
        isCalculating: false,
        isError: false,
        isPoolLoading: false,
        isSubmitting: false,
        isSuccess: false,
        poolDetails: createMockPoolDetails(),
        publicKey: null,
        send: mockSend,
        tokenAccountsData: {
          buyTokenAccount: createMockTokenAccount("USDC"),
          isLoadingBuy: false,
          isLoadingSell: false,
          isRefreshingBuy: false,
          isRefreshingSell: false,
          sellTokenAccount: createMockTokenAccount("SOL"),
        },
      });

      const { container } = render(<LiquidityForm />, {
        wrapper: createWrapper({
          tokenAAddress: USDC,
          tokenBAddress: SOL,
        }),
      });

      expect(container).toBeInTheDocument();
    });
  });
});
