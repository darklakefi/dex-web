import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LiquidityTransactionStatus } from "../LiquidityTransactionStatus";
import { LiquidityError, LiquidityErrorCode } from "../../_utils/liquidityErrors";

// Mock the LiquidityFormProvider
const mockUseLiquidityForm = jest.fn();

jest.mock("../LiquidityFormProvider", () => ({
  ...jest.requireActual("../LiquidityFormProvider"),
  useLiquidityForm: () => mockUseLiquidityForm(),
}));

describe("LiquidityTransactionStatus", () => {
  const defaultMockState = {
    state: {
      error: null,
      transactionSignature: null,
      liquidityStep: 0,
    },
    send: jest.fn(),
    isSuccess: false,
    isError: false,
    isSubmitting: false,
    hasError: false,
    resetFormToDefaults: jest.fn(),
    trackError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLiquidityForm.mockReturnValue(defaultMockState);
  });

  describe("Success State", () => {
    it("should display success message and celebration UI", () => {
      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isSuccess: true,
        state: {
          ...defaultMockState.state,
          transactionSignature: "test-signature",
        },
      });

      render(<LiquidityTransactionStatus />);

      expect(screen.getByText("Liquidity Added Successfully!")).toBeInTheDocument();
      expect(screen.getByText(/Your liquidity has been added to the pool/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Add more liquidity/i })).toBeInTheDocument();
      expect(screen.getByRole("status", { name: /Transaction successful/i })).toBeInTheDocument();
    });

    it("should display transaction hash link when provided", () => {
      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isSuccess: true,
        state: {
          ...defaultMockState.state,
          transactionSignature: "abcd1234efgh5678",
        },
      });

      render(<LiquidityTransactionStatus />);

      expect(screen.getByText("Transaction Hash:")).toBeInTheDocument();
      expect(screen.getByText("abcd1234...5678")).toBeInTheDocument();

      const explorerLink = screen.getByRole("link", { name: /View transaction/i });
      expect(explorerLink).toHaveAttribute("href", "https://solscan.io/tx/abcd1234efgh5678");
      expect(explorerLink).toHaveAttribute("target", "_blank");
    });

    it("should call reset when Add More Liquidity is clicked", async () => {
      const user = userEvent.setup();
      const mockSend = jest.fn();
      const mockReset = jest.fn();

      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isSuccess: true,
        send: mockSend,
        resetFormToDefaults: mockReset,
      });

      render(<LiquidityTransactionStatus />);

      const addMoreButton = screen.getByRole("button", { name: /Add more liquidity/i });
      await user.click(addMoreButton);

      expect(mockSend).toHaveBeenCalledWith({ type: "RESET" });
      expect(mockReset).toHaveBeenCalled();
    });
  });

  describe("Error States", () => {
    it("should display error message with retry and reset buttons", () => {
      const error = new LiquidityError(
        "Insufficient balance",
        LiquidityErrorCode.INSUFFICIENT_BALANCE,
        {},
        true
      );

      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isError: true,
        hasError: true,
        state: {
          ...defaultMockState.state,
          error,
        },
      });

      const mockRetry = jest.fn();
      render(<LiquidityTransactionStatus onRetry={mockRetry} />);

      expect(screen.getByText("Insufficient balance for this transaction")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Reset form/i })).toBeInTheDocument();
      expect(screen.getByRole("alert", { name: /Transaction error/i })).toBeInTheDocument();
    });

    it("should display error solution when showDetailedErrors is true", () => {
      const error = new LiquidityError(
        "Network error",
        LiquidityErrorCode.NETWORK_ERROR,
        {},
        true
      );

      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isError: true,
        hasError: true,
        state: {
          ...defaultMockState.state,
          error,
        },
      });

      render(<LiquidityTransactionStatus showDetailedErrors={true} />);

      expect(screen.getByText("Network error. Please check your connection")).toBeInTheDocument();
      expect(screen.getByText("Check your internet connection and try again")).toBeInTheDocument();
    });

    it("should show wallet connection button for wallet errors", () => {
      const error = new LiquidityError(
        "Wallet not connected",
        LiquidityErrorCode.WALLET_NOT_CONNECTED,
        {},
        false
      );

      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isError: true,
        hasError: true,
        state: {
          ...defaultMockState.state,
          error,
        },
      });

      render(<LiquidityTransactionStatus />);

      expect(screen.getByRole("button", { name: /Connect wallet/i })).toBeInTheDocument();
    });

    it("should show gas fee information for gas estimation errors", () => {
      const error = new LiquidityError(
        "Gas estimation failed",
        LiquidityErrorCode.GAS_ESTIMATION_FAILED,
        {},
        true
      );

      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isError: true,
        hasError: true,
        state: {
          ...defaultMockState.state,
          error,
        },
      });

      render(<LiquidityTransactionStatus />);

      expect(screen.getByText(/Gas Info/)).toBeInTheDocument();
      expect(screen.getByText(/Make sure you have at least 0.01 SOL/)).toBeInTheDocument();
    });

    it("should show slippage information for slippage errors", () => {
      const error = new LiquidityError(
        "High slippage detected",
        LiquidityErrorCode.HIGH_SLIPPAGE_WARNING,
        {},
        false,
        'warning'
      );

      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isError: true,
        hasError: true,
        state: {
          ...defaultMockState.state,
          error,
        },
      });

      render(<LiquidityTransactionStatus />);

      expect(screen.getByText(/Slippage/)).toBeInTheDocument();
      expect(screen.getByText(/Consider adjusting your slippage tolerance/)).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should display loading state with progress bar", () => {
      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isSubmitting: true,
        state: {
          ...defaultMockState.state,
          liquidityStep: 2,
        },
      });

      render(<LiquidityTransactionStatus />);

      expect(screen.getByText("Processing Transaction")).toBeInTheDocument();
      expect(screen.getByText("Please sign the transaction in your wallet")).toBeInTheDocument();
      expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
      expect(screen.getByText("67%")).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.getByRole("status", { name: /Transaction in progress/i })).toBeInTheDocument();
    });

    it("should show wallet prompt message during step 2", () => {
      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isSubmitting: true,
        state: {
          ...defaultMockState.state,
          liquidityStep: 2,
        },
      });

      render(<LiquidityTransactionStatus />);

      expect(screen.getByText(/Check your wallet for the transaction approval prompt/)).toBeInTheDocument();
      expect(screen.getByText(/Only sign transactions you initiated/)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels and roles", () => {
      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isSuccess: true,
      });

      render(<LiquidityTransactionStatus />);

      expect(screen.getByRole("status", { name: /Transaction successful/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Add more liquidity to the same pool/i)).toBeInTheDocument();
    });

    it("should have proper live regions", () => {
      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isSuccess: true,
      });

      render(<LiquidityTransactionStatus />);

      const successStatus = screen.getByRole("status");
      expect(successStatus).toHaveAttribute("aria-live", "polite");
    });

    it("should use assertive live region for errors", () => {
      const error = new LiquidityError(
        "Test error",
        LiquidityErrorCode.UNKNOWN,
        {},
        false
      );

      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isError: true,
        hasError: true,
        state: {
          ...defaultMockState.state,
          error,
        },
      });

      render(<LiquidityTransactionStatus />);

      const errorAlert = screen.getByRole("alert");
      expect(errorAlert).toHaveAttribute("aria-live", "assertive");
    });
  });

  describe("Custom Props", () => {
    it("should render with custom className", () => {
      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isSuccess: true,
      });

      render(<LiquidityTransactionStatus className="custom-class" />);

      const container = screen.getByRole("status").parentElement;
      expect(container).toHaveClass("custom-class");
    });

    it("should hide transaction hash when showTransactionHash is false", () => {
      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isSuccess: true,
        state: {
          ...defaultMockState.state,
          transactionSignature: "test-signature",
        },
      });

      render(<LiquidityTransactionStatus showTransactionHash={false} />);

      expect(screen.queryByText("Transaction Hash:")).not.toBeInTheDocument();
    });

    it("should hide detailed errors when showDetailedErrors is false", () => {
      const error = new LiquidityError(
        "Test error",
        LiquidityErrorCode.NETWORK_ERROR,
        {},
        true
      );

      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isError: true,
        hasError: true,
        state: {
          ...defaultMockState.state,
          error,
        },
      });

      render(<LiquidityTransactionStatus showDetailedErrors={false} />);

      expect(screen.queryByText("Check your internet connection and try again")).not.toBeInTheDocument();
    });

    it("should call onNavigateToPool when provided", async () => {
      const user = userEvent.setup();
      const mockNavigateToPool = jest.fn();

      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isSuccess: true,
      });

      render(<LiquidityTransactionStatus onNavigateToPool={mockNavigateToPool} />);

      const viewPositionsButton = screen.getByRole("button", { name: /View your liquidity positions/i });
      await user.click(viewPositionsButton);

      expect(mockNavigateToPool).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should return null when no state matches", () => {
      mockUseLiquidityForm.mockReturnValue(defaultMockState);

      const { container } = render(<LiquidityTransactionStatus />);

      expect(container.firstChild).toBeNull();
    });

    it("should handle missing error gracefully", () => {
      mockUseLiquidityForm.mockReturnValue({
        ...defaultMockState,
        isError: true,
        hasError: false,
        state: {
          ...defaultMockState.state,
          error: null,
        },
      });

      const { container } = render(<LiquidityTransactionStatus />);

      expect(container.firstChild).toBeNull();
    });
  });
});