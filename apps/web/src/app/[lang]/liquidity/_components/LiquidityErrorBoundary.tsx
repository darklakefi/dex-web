"use client";

import { Box, Button, Icon, Text } from "@dex-web/ui";
import type React from "react";
import { Component, type ReactNode } from "react";

interface LiquidityErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
  retryCount: number;
}

interface LiquidityErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  enableRecovery?: boolean;
  componentName?: string;
}

interface ErrorFallbackProps {
  error?: Error;
  errorId?: string;
  retryCount: number;
  maxRetries: number;
  enableRecovery: boolean;
  componentName: string;
  onRetry: () => void;
  onReset: () => void;
  onReport: () => void;
}

function ErrorFallback({
  error,
  errorId,
  retryCount,
  maxRetries,
  enableRecovery,
  componentName,
  onRetry,
  onReset,
  onReport,
}: ErrorFallbackProps) {
  const isRetryLimitReached = retryCount >= maxRetries;
  const errorMessage = error?.message || "An unexpected error occurred";

  const getSeverityLevel = (error?: Error): "low" | "medium" | "high" => {
    if (!error) return "medium";

    const message = error.message.toLowerCase();

    if (
      message.includes("wallet") ||
      message.includes("transaction") ||
      message.includes("signature") ||
      message.includes("insufficient") ||
      message.includes("security")
    ) {
      return "high";
    }

    if (
      message.includes("render") ||
      message.includes("display") ||
      message.includes("format")
    ) {
      return "low";
    }

    return "medium";
  };

  const severity = getSeverityLevel(error);

  const getBorderColor = () => {
    switch (severity) {
      case "high":
        return "border-red-400";
      case "medium":
        return "border-yellow-400";
      case "low":
        return "border-blue-400";
      default:
        return "border-gray-400";
    }
  };

  const getBackgroundColor = () => {
    switch (severity) {
      case "high":
        return "bg-red-600";
      case "medium":
        return "bg-yellow-600";
      case "low":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  const getTextColor = () => {
    switch (severity) {
      case "high":
        return "text-red-300";
      case "medium":
        return "text-yellow-300";
      case "low":
        return "text-blue-300";
      default:
        return "text-gray-300";
    }
  };

  const getIconName = () => {
    switch (severity) {
      case "high":
        return "exclamation";
      case "medium":
        return "exclamation";
      case "low":
        return "info";
      default:
        return "exclamation";
    }
  };

  return (
    <Box className={`border ${getBorderColor()} ${getBackgroundColor()} p-4`}>
      <div className="flex items-start gap-3">
        <Icon
          className={`size-6 ${getTextColor()} flex-shrink-0`}
          name={getIconName()}
        />
        <div className="flex-1 space-y-3">
          <div>
            <Text.Body1 className={`font-semibold ${getTextColor()}`}>
              {componentName} Error
            </Text.Body1>
            {errorId && (
              <Text.Body2 className="font-mono text-gray-400 text-xs">
                Error ID: {errorId}
              </Text.Body2>
            )}
          </div>

          <Text.Body2 className={getTextColor()}>{errorMessage}</Text.Body2>

          {severity === "high" && (
            <Box className="border border-red-300 bg-red-700 p-2">
              <Text.Body2 className="text-red-200 text-sm">
                ⚠️ This error may affect your transaction security. Please
                refresh the page or contact support.
              </Text.Body2>
            </Box>
          )}

          {retryCount > 0 && (
            <Text.Body2 className="text-gray-400 text-sm">
              Retry attempts: {retryCount}/{maxRetries}
            </Text.Body2>
          )}

          <div className="flex flex-wrap gap-2">
            {enableRecovery && !isRetryLimitReached && (
              <Button
                className="bg-green-600 text-green-100 hover:bg-green-700"
                onClick={onRetry}
                size="sm"
              >
                Try Again
              </Button>
            )}

            <Button
              className="bg-gray-600 text-gray-100 hover:bg-gray-700"
              onClick={onReset}
              size="sm"
            >
              Reset Form
            </Button>

            <Button
              className="bg-blue-600 text-blue-100 hover:bg-blue-700"
              onClick={onReport}
              size="sm"
            >
              Report Issue
            </Button>
          </div>

          {isRetryLimitReached && (
            <Text.Body2 className="text-red-300 text-sm">
              Maximum retry attempts reached. Please refresh the page or contact
              support.
            </Text.Body2>
          )}
        </div>
      </div>
    </Box>
  );
}

export class LiquidityErrorBoundary extends Component<
  LiquidityErrorBoundaryProps,
  LiquidityErrorBoundaryState
> {
  private retryTimeoutId?: NodeJS.Timeout;

  constructor(props: LiquidityErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(
    error: Error,
  ): Partial<LiquidityErrorBoundaryState> {
    const errorId = `liquidity_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      error,
      errorId,
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    this.props.onError?.(error, errorInfo);

    this.logErrorToAnalytics(error, errorInfo);

    if (process.env.NODE_ENV === "development") {
      console.error(
        "LiquidityErrorBoundary caught an error:",
        error,
        errorInfo,
      );
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private logErrorToAnalytics = (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      const errorData = {
        component: this.props.componentName || "LiquidityForm",
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        metadata: {
          errorId: this.state.errorId,
          retryCount: this.state.retryCount,
          timestamp: new Date().toISOString(),
          url: typeof window !== "undefined" ? window.location.href : "unknown",
          userAgent:
            typeof window !== "undefined"
              ? window.navigator.userAgent
              : "unknown",
        },
      };

      console.info("Error logged to analytics:", errorData);
    } catch (loggingError) {
      console.error("Failed to log error to analytics:", loggingError);
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;

    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState((prevState) => ({
      retryCount: prevState.retryCount + 1,
    }));

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        error: undefined,
        errorInfo: undefined,
        hasError: false,
      });
    }, 1000);
  };

  private handleReset = () => {
    this.setState({
      error: undefined,
      errorInfo: undefined,
      hasError: false,
      retryCount: 0,
    });

    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  private handleReport = () => {
    const { error, errorInfo, errorId } = this.state;

    const errorReport = {
      component: this.props.componentName || "LiquidityForm",
      error: error
        ? {
            message: error.message,
            name: error.name,
            stack: error.stack,
          }
        : null,
      errorId,
      errorInfo: errorInfo
        ? {
            componentStack: errorInfo.componentStack,
          }
        : null,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
    };

    console.info("Error report generated:", errorReport);

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(JSON.stringify(errorReport, null, 2))
        .then(() => {
          alert(
            "Error details copied to clipboard. Please share this with support.",
          );
        })
        .catch(() => {
          alert(`Error ID: ${errorId}. Please share this with support.`);
        });
    } else {
      alert(`Error ID: ${errorId}. Please share this with support.`);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          componentName={this.props.componentName || "Liquidity Form"}
          enableRecovery={this.props.enableRecovery !== false}
          error={this.state.error}
          errorId={this.state.errorId}
          maxRetries={this.props.maxRetries || 3}
          onReport={this.handleReport}
          onReset={this.handleReset}
          onRetry={this.handleRetry}
          retryCount={this.state.retryCount}
        />
      );
    }

    return this.props.children;
  }
}

export function withLiquidityErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<LiquidityErrorBoundaryProps>,
) {
  const displayName = Component.displayName || Component.name || "Component";

  const WrappedComponent = (props: P) => (
    <LiquidityErrorBoundary componentName={displayName} {...errorBoundaryProps}>
      <Component {...props} />
    </LiquidityErrorBoundary>
  );

  WrappedComponent.displayName = `withLiquidityErrorBoundary(${displayName})`;

  return WrappedComponent;
}

export function LiquidityFormErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <LiquidityErrorBoundary
      componentName="Liquidity Form"
      enableRecovery={true}
      maxRetries={3}
    >
      {children}
    </LiquidityErrorBoundary>
  );
}

export function LiquidityTokenInputErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <LiquidityErrorBoundary
      componentName="Token Input"
      enableRecovery={true}
      maxRetries={5}
    >
      {children}
    </LiquidityErrorBoundary>
  );
}

export function LiquidityTransactionErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <LiquidityErrorBoundary
      componentName="Transaction Processing"
      enableRecovery={false}
      maxRetries={2}
    >
      {children}
    </LiquidityErrorBoundary>
  );
}

export function LiquidityAPIErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <LiquidityErrorBoundary
      componentName="API Call"
      enableRecovery={true}
      maxRetries={3}
    >
      {children}
    </LiquidityErrorBoundary>
  );
}
