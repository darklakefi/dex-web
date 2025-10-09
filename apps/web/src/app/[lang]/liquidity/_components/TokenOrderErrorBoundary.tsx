"use client";

import { Box, Button, Text } from "@dex-web/ui";
import Link from "next/link";
import { Component, type ReactNode } from "react";

interface TokenOrderErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

interface TokenOrderErrorBoundaryState {
  readonly hasError: boolean;
  readonly error: Error | null;
}

/**
 * Error boundary specifically for token order errors.
 *
 * This boundary catches errors thrown by `useTokenOrderRequired()` and displays
 * a contextual fallback UI that guides users to select tokens.
 *
 * Benefits:
 * - Prevents entire app crash from missing tokens
 * - Provides clear, actionable guidance to users
 * - Maintains component isolation (error doesn't bubble up)
 *
 * @example
 * ```tsx
 * <TokenOrderErrorBoundary>
 *   <ComponentThatRequiresTokens />
 * </TokenOrderErrorBoundary>
 * ```
 */
export class TokenOrderErrorBoundary extends Component<
  TokenOrderErrorBoundaryProps,
  TokenOrderErrorBoundaryState
> {
  constructor(props: TokenOrderErrorBoundaryProps) {
    super(props);
    this.state = { error: null, hasError: false };
  }

  static getDerivedStateFromError(error: Error): TokenOrderErrorBoundaryState {
    const isTokenOrderError =
      error.message.includes("tokenAAddress") ||
      error.message.includes("tokenBAddress") ||
      error.message.includes("useTokenOrderRequired");

    if (isTokenOrderError) {
      return { error, hasError: true };
    }

    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV === "production") {
      console.error("TokenOrderErrorBoundary caught error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box className="flex flex-col items-center gap-4 p-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <Text.Heading as="h3" className="text-green-300">
              Select Tokens to Continue
            </Text.Heading>
            <Text.Body1 className="text-green-400">
              To add liquidity, you need to select two tokens. Click below to
              choose your token pair.
            </Text.Body1>
          </div>

          <Link href="/liquidity?tokenAAddress=&tokenBAddress=" passHref>
            <Button variant="primary">Select Tokens</Button>
          </Link>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-4 w-full max-w-md">
              <summary className="cursor-pointer text-green-500 text-sm">
                Error Details (Dev Only)
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-green-900 p-2 text-green-200 text-xs">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-friendly wrapper for TokenOrderErrorBoundary.
 * Use this when you need error boundary behavior but want to keep using hooks.
 *
 * @example
 * ```tsx
 * export function MyPage() {
 *   return (
 *     <TokenOrderErrorBoundary>
 *       <ComponentThatMightError />
 *     </TokenOrderErrorBoundary>
 *   );
 * }
 * ```
 */
export function withTokenOrderErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
): React.ComponentType<P> {
  return function WithTokenOrderErrorBoundary(props: P) {
    return (
      <TokenOrderErrorBoundary>
        <Component {...props} />
      </TokenOrderErrorBoundary>
    );
  };
}
