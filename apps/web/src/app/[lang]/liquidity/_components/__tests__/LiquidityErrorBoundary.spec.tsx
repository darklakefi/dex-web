import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  LiquidityErrorBoundary,
  LiquidityFormErrorBoundary,
  LiquidityTokenInputErrorBoundary,
  LiquidityTransactionErrorBoundary,
  LiquidityAPIErrorBoundary,
  withLiquidityErrorBoundary,
} from "../LiquidityErrorBoundary";

vi.mock("@dex-web/ui", () => ({
  Box: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  Button: ({
    children,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  ),
  Icon: ({ name, className }: { name: string; className?: string }) => (
    <span className={className}>{name}</span>
  ),
  Text: {
    Body1: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <p className={className}>{children}</p>,
    Body2: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <p className={className}>{children}</p>,
  },
}));

function ThrowError({ shouldThrow = false, errorMessage = "Test error" }) {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No Error</div>;
}

describe.skip("LiquidityErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("Basic Error Boundary Functionality", () => {
    it("should render children when no error occurs", () => {
      render(
        <LiquidityErrorBoundary>
          <ThrowError shouldThrow={false} />
        </LiquidityErrorBoundary>,
      );

      expect(screen.getByText("No Error")).toBeInTheDocument();
    });

    it("should catch and display error when child component throws", () => {
      render(
        <LiquidityErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Component crashed" />
        </LiquidityErrorBoundary>,
      );

      expect(screen.getByText("Liquidity Form Error")).toBeInTheDocument();
      expect(screen.getByText("Component crashed")).toBeInTheDocument();
    });

    it("should display error ID for tracking", () => {
      render(
        <LiquidityErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LiquidityErrorBoundary>,
      );

      expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
    });
  });

  describe("Error Severity Detection", () => {
    it("should detect high severity for security errors", () => {
      render(
        <LiquidityErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="wallet security error" />
        </LiquidityErrorBoundary>,
      );

      const container = screen
        .getByText("wallet security error")
        .closest("div");
      expect(container).toHaveClass("border-red-400");
    });

    it("should detect medium severity for general errors", () => {
      render(
        <LiquidityErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="general error" />
        </LiquidityErrorBoundary>,
      );

      const container = screen.getByText("general error").closest("div");
      expect(container).toHaveClass("border-yellow-400");
    });

    it("should detect low severity for display errors", () => {
      render(
        <LiquidityErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="render display error" />
        </LiquidityErrorBoundary>,
      );

      const container = screen.getByText("render display error").closest("div");
      expect(container).toHaveClass("border-blue-400");
    });
  });

  describe("Recovery Mechanisms", () => {
    it("should provide retry button when recovery is enabled", () => {
      render(
        <LiquidityErrorBoundary enableRecovery={true}>
          <ThrowError shouldThrow={true} />
        </LiquidityErrorBoundary>,
      );

      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });

    it("should not provide retry button when recovery is disabled", () => {
      render(
        <LiquidityErrorBoundary enableRecovery={false}>
          <ThrowError shouldThrow={true} />
        </LiquidityErrorBoundary>,
      );

      expect(screen.queryByText("Try Again")).not.toBeInTheDocument();
    });

    it("should increment retry count on retry attempts", () => {
      render(
        <LiquidityErrorBoundary enableRecovery={true} maxRetries={3}>
          <ThrowError shouldThrow={true} />
        </LiquidityErrorBoundary>,
      );

      const retryButton = screen.getByText("Try Again");
      fireEvent.click(retryButton);

      expect(screen.getByText("Retry attempts: 1/3")).toBeInTheDocument();
    });

    it("should disable retry button after max retries reached", () => {
      render(
        <LiquidityErrorBoundary enableRecovery={true} maxRetries={1}>
          <ThrowError shouldThrow={true} />
        </LiquidityErrorBoundary>,
      );

      const retryButton = screen.getByText("Try Again");
      fireEvent.click(retryButton);

      expect(screen.queryByText("Try Again")).not.toBeInTheDocument();
      expect(
        screen.getByText(/Maximum retry attempts reached/),
      ).toBeInTheDocument();
    });
  });

  describe("Error Reporting", () => {
    it("should provide error reporting functionality", () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });

      render(
        <LiquidityErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LiquidityErrorBoundary>,
      );

      const reportButton = screen.getByText("Report Issue");
      fireEvent.click(reportButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it("should handle clipboard API not being available", () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        writable: true,
      });

      render(
        <LiquidityErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LiquidityErrorBoundary>,
      );

      const reportButton = screen.getByText("Report Issue");
      fireEvent.click(reportButton);

      expect(alertSpy).toHaveBeenCalled();
    });
  });

  describe("Custom Error Handler", () => {
    it("should call custom error handler when provided", () => {
      const onError = vi.fn();

      render(
        <LiquidityErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} errorMessage="Custom error" />
        </LiquidityErrorBoundary>,
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        }),
      );
    });
  });

  describe("Specialized Error Boundaries", () => {
    it("should render LiquidityFormErrorBoundary with correct component name", () => {
      render(
        <LiquidityFormErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LiquidityFormErrorBoundary>,
      );

      expect(screen.getByText("Liquidity Form Error")).toBeInTheDocument();
    });

    it("should render LiquidityTokenInputErrorBoundary with correct component name", () => {
      render(
        <LiquidityTokenInputErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LiquidityTokenInputErrorBoundary>,
      );

      expect(screen.getByText("Token Input Error")).toBeInTheDocument();
    });

    it("should render LiquidityTransactionErrorBoundary with no retry for transactions", () => {
      render(
        <LiquidityTransactionErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LiquidityTransactionErrorBoundary>,
      );

      expect(
        screen.getByText("Transaction Processing Error"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Try Again")).not.toBeInTheDocument();
    });

    it("should render LiquidityAPIErrorBoundary with API-specific settings", () => {
      render(
        <LiquidityAPIErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LiquidityAPIErrorBoundary>,
      );

      expect(screen.getByText("API Call Error")).toBeInTheDocument();
    });
  });

  describe("HOC withLiquidityErrorBoundary", () => {
    it("should wrap component with error boundary", () => {
      const TestComponent = () => <div>Test Component</div>;
      const WrappedComponent = withLiquidityErrorBoundary(TestComponent);

      render(<WrappedComponent />);

      expect(screen.getByText("Test Component")).toBeInTheDocument();
    });

    it("should catch errors in wrapped component", () => {
      const WrappedComponent = withLiquidityErrorBoundary(ThrowError);

      render(<WrappedComponent shouldThrow={true} />);

      expect(screen.getByText("Component Error")).toBeInTheDocument();
    });

    it("should pass through props to wrapped component", () => {
      const TestComponent = ({ message }: { message: string }) => (
        <div>{message}</div>
      );
      const WrappedComponent = withLiquidityErrorBoundary(TestComponent);

      render(<WrappedComponent message="Hello World" />);

      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });
  });

  describe("Security Warnings", () => {
    it("should show security warning for high severity errors", () => {
      render(
        <LiquidityErrorBoundary>
          <ThrowError
            shouldThrow={true}
            errorMessage="transaction security breach"
          />
        </LiquidityErrorBoundary>,
      );

      expect(
        screen.getByText(/This error may affect your transaction security/),
      ).toBeInTheDocument();
    });

    it("should not show security warning for low severity errors", () => {
      render(
        <LiquidityErrorBoundary>
          <ThrowError
            shouldThrow={true}
            errorMessage="display formatting issue"
          />
        </LiquidityErrorBoundary>,
      );

      expect(
        screen.queryByText(/This error may affect your transaction security/),
      ).not.toBeInTheDocument();
    });
  });
});
