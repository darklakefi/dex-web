import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormFieldset } from "../FormFieldset";

vi.mock("@dex-web/orpc", () => ({
  tanstackClient: {
    tokens: {
      getTokenPrice: {
        queryOptions: vi.fn(() => ({
          queryFn: () => Promise.resolve({ price: 1.5 }),
          queryKey: ["tokenPrice", "token-a"],
          staleTime: 5000,
        })),
      },
    },
  },
}));

vi.mock("../../../_utils/useFormatPrice", () => ({
  useFormatPrice: vi.fn(() => "$150.00"),
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

const mockTokenAccount = {
  address: "test-address",
  amount: 1000000000,
  decimals: 9,
  symbol: "SOL",
};

const mockTokenAccountSmall = {
  address: "test-address-small",
  amount: 1000000,
  decimals: 6,
  symbol: "USDC",
};

const renderWithWrapper = (props: Record<string, unknown> = {}) => {
  const queryClient = createQueryClient();
  const onUrlUpdate = vi.fn();
  const mockMessages = {};

  const defaultProps = {
    name: "tokenAAmount",
    onBlur: vi.fn(),
    onChange: vi.fn(),
    onClearPendingCalculations: vi.fn(),
    onHalfMaxClick: vi.fn(),
    tokenAccount: mockTokenAccount,
    value: "",
    ...props,
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      <NuqsTestingAdapter
        onUrlUpdate={onUrlUpdate}
        searchParams={{ tokenAAddress: "token-a", tokenBAddress: "token-b" }}
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </NuqsTestingAdapter>
    </NextIntlClientProvider>
  );

  return {
    ...render(<FormFieldset {...defaultProps} />, { wrapper }),
    onUrlUpdate,
    props: defaultProps,
    queryClient,
  };
};

describe.skip("FormFieldset Max/Half Functionality", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Half Button Functionality", () => {
    it("should render Half button when token account is available", async () => {
      renderWithWrapper();

      await waitFor(() => {
        expect(screen.getByText("Half")).toBeInTheDocument();
      });
    });

    it("should not render Half button when token account is missing", async () => {
      renderWithWrapper({ tokenAccount: null });

      await waitFor(() => {
        expect(screen.queryByText("Half")).not.toBeInTheDocument();
      });
    });

    it("should calculate half amount correctly for SOL (9 decimals)", async () => {
      const mockOnChange = vi.fn();
      renderWithWrapper({ onChange: mockOnChange });

      await waitFor(() => {
        expect(screen.getByText("Half")).toBeInTheDocument();
      });

      const halfButton = screen.getByText("Half");
      await user.click(halfButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        target: { value: "0.50000" },
      });
    });

    it("should calculate half amount correctly for USDC (6 decimals)", async () => {
      const mockOnChange = vi.fn();
      renderWithWrapper({
        onChange: mockOnChange,
        tokenAccount: mockTokenAccountSmall,
      });

      await waitFor(() => {
        expect(screen.getByText("Half")).toBeInTheDocument();
      });

      const halfButton = screen.getByText("Half");
      await user.click(halfButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        target: { value: "0.50000" },
      });
    });

    it("should be disabled when loading", async () => {
      renderWithWrapper({ isLoading: true });

      await waitFor(() => {
        const halfButton = screen.getByText("Half");
        expect(halfButton).toHaveAttribute("disabled");
        expect(halfButton).toHaveClass("cursor-not-allowed", "opacity-50");
      });
    });

    it("should be disabled when refreshing", async () => {
      renderWithWrapper({ isRefreshing: true });

      await waitFor(() => {
        const halfButton = screen.getByText("Half");
        expect(halfButton).toHaveAttribute("disabled");
        expect(halfButton).toHaveClass("cursor-not-allowed", "opacity-50");
      });
    });

    it("should not work when token account amount is 0", async () => {
      const mockOnChange = vi.fn();
      const zeroTokenAccount = { ...mockTokenAccount, amount: 0 };
      renderWithWrapper({
        onChange: mockOnChange,
        tokenAccount: zeroTokenAccount,
      });

      await waitFor(() => {
        expect(screen.getByText("Half")).toBeInTheDocument();
      });

      const halfButton = screen.getByText("Half");
      await user.click(halfButton);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should call onClearPendingCalculations when clicked", async () => {
      const mockClearCalculations = vi.fn();
      renderWithWrapper({ onClearPendingCalculations: mockClearCalculations });

      await waitFor(() => {
        expect(screen.getByText("Half")).toBeInTheDocument();
      });

      const halfButton = screen.getByText("Half");
      await user.click(halfButton);

      expect(mockClearCalculations).toHaveBeenCalled();
    });

    it("should call onHalfMaxClick with 'half' when clicked", async () => {
      const mockHalfMaxClick = vi.fn();
      renderWithWrapper({ onHalfMaxClick: mockHalfMaxClick });

      await waitFor(() => {
        expect(screen.getByText("Half")).toBeInTheDocument();
      });

      const halfButton = screen.getByText("Half");
      await user.click(halfButton);

      expect(mockHalfMaxClick).toHaveBeenCalledWith("half");
    });

    it("should trigger DOM input change event", async () => {
      const { container } = renderWithWrapper();

      await waitFor(() => {
        expect(screen.getByText("Half")).toBeInTheDocument();
      });

      const input = container.querySelector('input[name="tokenAAmount"]');
      const spy = vi.fn();
      input?.addEventListener("change", spy);

      const halfButton = screen.getByText("Half");
      await user.click(halfButton);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe("Max Button Functionality", () => {
    it("should render Max button when token account is available", async () => {
      renderWithWrapper();

      await waitFor(() => {
        expect(screen.getByText("Max")).toBeInTheDocument();
      });
    });

    it("should not render Max button when token account is missing", async () => {
      renderWithWrapper({ tokenAccount: null });

      await waitFor(() => {
        expect(screen.queryByText("Max")).not.toBeInTheDocument();
      });
    });

    it("should set max amount correctly for SOL (9 decimals)", async () => {
      const mockOnChange = vi.fn();
      renderWithWrapper({ onChange: mockOnChange });

      await waitFor(() => {
        expect(screen.getByText("Max")).toBeInTheDocument();
      });

      const maxButton = screen.getByText("Max");
      await user.click(maxButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        target: { value: "1.00000" },
      });
    });

    it("should set max amount correctly for USDC (6 decimals)", async () => {
      const mockOnChange = vi.fn();
      renderWithWrapper({
        onChange: mockOnChange,
        tokenAccount: mockTokenAccountSmall,
      });

      await waitFor(() => {
        expect(screen.getByText("Max")).toBeInTheDocument();
      });

      const maxButton = screen.getByText("Max");
      await user.click(maxButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        target: { value: "1.00000" },
      });
    });

    it("should be disabled when loading", async () => {
      renderWithWrapper({ isLoading: true });

      await waitFor(() => {
        const maxButton = screen.getByText("Max");
        expect(maxButton).toHaveAttribute("disabled");
        expect(maxButton).toHaveClass("cursor-not-allowed", "opacity-50");
      });
    });

    it("should be disabled when refreshing", async () => {
      renderWithWrapper({ isRefreshing: true });

      await waitFor(() => {
        const maxButton = screen.getByText("Max");
        expect(maxButton).toHaveAttribute("disabled");
        expect(maxButton).toHaveClass("cursor-not-allowed", "opacity-50");
      });
    });

    it("should not work when token account amount is 0", async () => {
      const mockOnChange = vi.fn();
      const zeroTokenAccount = { ...mockTokenAccount, amount: 0 };
      renderWithWrapper({
        onChange: mockOnChange,
        tokenAccount: zeroTokenAccount,
      });

      await waitFor(() => {
        expect(screen.getByText("Max")).toBeInTheDocument();
      });

      const maxButton = screen.getByText("Max");
      await user.click(maxButton);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should call onClearPendingCalculations when clicked", async () => {
      const mockClearCalculations = vi.fn();
      renderWithWrapper({ onClearPendingCalculations: mockClearCalculations });

      await waitFor(() => {
        expect(screen.getByText("Max")).toBeInTheDocument();
      });

      const maxButton = screen.getByText("Max");
      await user.click(maxButton);

      expect(mockClearCalculations).toHaveBeenCalled();
    });

    it("should call onHalfMaxClick with 'max' when clicked", async () => {
      const mockHalfMaxClick = vi.fn();
      renderWithWrapper({ onHalfMaxClick: mockHalfMaxClick });

      await waitFor(() => {
        expect(screen.getByText("Max")).toBeInTheDocument();
      });

      const maxButton = screen.getByText("Max");
      await user.click(maxButton);

      expect(mockHalfMaxClick).toHaveBeenCalledWith("max");
    });

    it("should trigger DOM input change event", async () => {
      const { container } = renderWithWrapper();

      await waitFor(() => {
        expect(screen.getByText("Max")).toBeInTheDocument();
      });

      const input = container.querySelector('input[name="tokenAAmount"]');
      const spy = vi.fn();
      input?.addEventListener("change", spy);

      const maxButton = screen.getByText("Max");
      await user.click(maxButton);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe("Edge Cases and Consistency Issues", () => {
    it("should handle very small token amounts correctly", async () => {
      const mockOnChange = vi.fn();
      const smallTokenAccount = {
        ...mockTokenAccount,
        amount: 1,
      };
      renderWithWrapper({
        onChange: mockOnChange,
        tokenAccount: smallTokenAccount,
      });

      await waitFor(() => {
        expect(screen.getByText("Half")).toBeInTheDocument();
      });

      const halfButton = screen.getByText("Half");
      await user.click(halfButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        target: { value: "0.00000" },
      });
    });

    it("should handle very large token amounts correctly", async () => {
      const mockOnChange = vi.fn();
      const largeTokenAccount = {
        ...mockTokenAccount,
        amount: 1000000000000000,
        decimals: 9,
      };
      renderWithWrapper({
        onChange: mockOnChange,
        tokenAccount: largeTokenAccount,
      });

      await waitFor(() => {
        expect(screen.getByText("Max")).toBeInTheDocument();
      });

      const maxButton = screen.getByText("Max");
      await user.click(maxButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        target: { value: "1000000.00000" },
      });
    });

    it("should handle tokens with 0 decimals", async () => {
      const mockOnChange = vi.fn();
      const noDecimalToken = {
        address: "test-address",
        amount: 100,
        decimals: 0,
        symbol: "NFT",
      };
      renderWithWrapper({
        onChange: mockOnChange,
        tokenAccount: noDecimalToken,
      });

      await waitFor(() => {
        expect(screen.getByText("Half")).toBeInTheDocument();
      });

      const halfButton = screen.getByText("Half");
      await user.click(halfButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        target: { value: "50.00000" },
      });
    });

    it("should handle rapid clicking consistently", async () => {
      const mockOnChange = vi.fn();
      renderWithWrapper({ onChange: mockOnChange });

      await waitFor(() => {
        expect(screen.getByText("Half")).toBeInTheDocument();
      });

      const halfButton = screen.getByText("Half");

      await user.click(halfButton);
      await user.click(halfButton);
      await user.click(halfButton);

      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, {
        target: { value: "0.50000" },
      });
      expect(mockOnChange).toHaveBeenNthCalledWith(2, {
        target: { value: "0.50000" },
      });
      expect(mockOnChange).toHaveBeenNthCalledWith(3, {
        target: { value: "0.50000" },
      });
    });

    it("should work correctly when switching between different tokens", async () => {
      const mockOnChange = vi.fn();
      const { rerender } = renderWithWrapper({ onChange: mockOnChange });

      await waitFor(() => {
        expect(screen.getByText("Half")).toBeInTheDocument();
      });

      const halfButton = screen.getByText("Half");
      await user.click(halfButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        target: { value: "0.50000" },
      });

      mockOnChange.mockClear();

      const newProps = {
        name: "tokenBAmount",
        onBlur: vi.fn(),
        onChange: mockOnChange,
        onClearPendingCalculations: vi.fn(),
        onHalfMaxClick: vi.fn(),
        tokenAccount: mockTokenAccountSmall,
        value: "",
      };

      rerender(<FormFieldset {...newProps} />);

      await waitFor(() => {
        expect(screen.getByText("Half")).toBeInTheDocument();
      });

      const newHalfButton = screen.getByText("Half");
      await user.click(newHalfButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        target: { value: "0.50000" },
      });
    });

    it("should maintain button state during loading transitions", async () => {
      const { rerender } = renderWithWrapper({ isLoading: false });

      await waitFor(() => {
        const halfButton = screen.getByText("Half");
        expect(halfButton).not.toHaveAttribute("disabled");
      });

      const loadingProps = {
        isLoading: true,
        name: "tokenAAmount",
        onBlur: vi.fn(),
        onChange: vi.fn(),
        onClearPendingCalculations: vi.fn(),
        onHalfMaxClick: vi.fn(),
        tokenAccount: mockTokenAccount,
        value: "",
      };

      rerender(<FormFieldset {...loadingProps} />);

      await waitFor(() => {
        const halfButton = screen.getByText("Half");
        expect(halfButton).toHaveAttribute("disabled");
        expect(halfButton).toHaveClass("cursor-not-allowed", "opacity-50");
      });
    });

    it("should handle missing onClearPendingCalculations gracefully", async () => {
      const mockOnChange = vi.fn();
      renderWithWrapper({
        onChange: mockOnChange,
        onClearPendingCalculations: undefined,
      });

      await waitFor(() => {
        expect(screen.getByText("Half")).toBeInTheDocument();
      });

      const halfButton = screen.getByText("Half");

      expect(() => user.click(halfButton)).not.toThrow();

      await user.click(halfButton);
      expect(mockOnChange).toHaveBeenCalled();
    });

    it("should handle missing onHalfMaxClick gracefully", async () => {
      const mockOnChange = vi.fn();
      renderWithWrapper({
        onChange: mockOnChange,
        onHalfMaxClick: undefined,
      });

      await waitFor(() => {
        expect(screen.getByText("Half")).toBeInTheDocument();
      });

      const halfButton = screen.getByText("Half");

      expect(() => user.click(halfButton)).not.toThrow();

      await user.click(halfButton);
      expect(mockOnChange).toHaveBeenCalled();
    });

    it("should handle consistency issue: Half/Max buttons working with cross-pair calculations", async () => {
      const mockHalfMaxClick = vi.fn();
      const mockOnChange = vi.fn();

      renderWithWrapper({
        onChange: mockOnChange,
        onHalfMaxClick: mockHalfMaxClick,
      });

      await waitFor(() => {
        expect(screen.getByText("Half")).toBeInTheDocument();
        expect(screen.getByText("Max")).toBeInTheDocument();
      });

      const halfButton = screen.getByText("Half");
      await user.click(halfButton);

      expect(mockHalfMaxClick).toHaveBeenCalledWith("half");
      expect(mockOnChange).toHaveBeenCalledWith({
        target: { value: "0.50000" },
      });

      mockHalfMaxClick.mockClear();
      mockOnChange.mockClear();

      const maxButton = screen.getByText("Max");
      await user.click(maxButton);

      expect(mockHalfMaxClick).toHaveBeenCalledWith("max");
      expect(mockOnChange).toHaveBeenCalledWith({
        target: { value: "1.00000" },
      });
    });

    it("should handle precision issues with decimal calculations", async () => {
      const mockOnChange = vi.fn();
      const precisionTokenAccount = {
        address: "test-address",
        amount: 333333333,
        decimals: 9,
        symbol: "TEST",
      };

      renderWithWrapper({
        onChange: mockOnChange,
        tokenAccount: precisionTokenAccount,
      });

      await waitFor(() => {
        expect(screen.getByText("Half")).toBeInTheDocument();
      });

      const halfButton = screen.getByText("Half");
      await user.click(halfButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        target: { value: "0.16667" },
      });
    });
  });
});
