"use client";

/**
 * Example usage of LiquidityTransactionStatus component
 * This demonstrates all the features and states of the component
 */

import { useState } from "react";
import { Button, Text } from "@dex-web/ui";
import { LiquidityTransactionStatus } from "../LiquidityTransactionStatus";
import { LiquidityError, LiquidityErrorCode } from "../../_utils/liquidityErrors";

// Mock the context for demonstration purposes
const mockContextProvider = (state: unknown, children: React.ReactNode) => {
  const mockContext = {
    state: {
      error: state.error,
      transactionSignature: state.transactionSignature,
      liquidityStep: state.liquidityStep,
    },
    send: state.send,
    isSuccess: state.isSuccess,
    isError: state.isError,
    isSubmitting: state.isSubmitting,
    hasError: state.hasError,
    resetFormToDefaults: state.resetFormToDefaults,
    trackError: state.trackError,
  };

  return (
    <div className="mock-context-provider">
      {children}
    </div>
  );
};

export function LiquidityTransactionStatusExample() {
  const [currentState, setCurrentState] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');
  const [errorType, setErrorType] = useState<LiquidityErrorCode>(LiquidityErrorCode.NETWORK_ERROR);

  // Mock handlers
  const handleRetry = async () => {
    console.log("Retrying transaction...");
    setCurrentState('loading');
    // Simulate retry
    setTimeout(() => {
      setCurrentState('success');
    }, 2000);
  };

  const handleNavigateToPool = () => {
    console.log("Navigating to pool...");
  };

  const handleContactSupport = () => {
    console.log("Opening support...");
  };

  // Mock state based on current demo state
  const getMockState = () => {
    const baseState = {
      send: (event: unknown) => console.log('State event:', event),
      resetFormToDefaults: () => console.log('Resetting form...'),
      trackError: (error: unknown, context: unknown) => console.log('Tracking error:', error, context),
      error: null,
      transactionSignature: null,
      liquidityStep: 0,
      isSuccess: false,
      isError: false,
      isSubmitting: false,
      hasError: false,
    };

    switch (currentState) {
      case 'success':
        return {
          ...baseState,
          isSuccess: true,
          transactionSignature: 'ABCDEFGHijklmnop1234567890abcdefghijklmnopqrstuvwxyz1234567890ABCD',
        };
      case 'error':
        const error = new LiquidityError(
          getErrorMessage(errorType),
          errorType,
          { timestamp: Date.now(), userAgent: navigator.userAgent },
          isRetryableError(errorType)
        );
        return {
          ...baseState,
          isError: true,
          hasError: true,
          error,
        };
      case 'loading':
        return {
          ...baseState,
          isSubmitting: true,
          liquidityStep: 2,
        };
      default:
        return baseState;
    }
  };

  const getErrorMessage = (code: LiquidityErrorCode): string => {
    const messages: Record<LiquidityErrorCode, string> = {
      [LiquidityErrorCode.NETWORK_ERROR]: "Network connection failed",
      [LiquidityErrorCode.INSUFFICIENT_BALANCE]: "Not enough tokens in wallet",
      [LiquidityErrorCode.HIGH_SLIPPAGE_WARNING]: "Slippage tolerance exceeded",
      [LiquidityErrorCode.GAS_ESTIMATION_FAILED]: "Cannot estimate gas fees",
      [LiquidityErrorCode.WALLET_NOT_CONNECTED]: "Please connect your wallet",
      [LiquidityErrorCode.POOL_NOT_FOUND]: "Pool does not exist",
      [LiquidityErrorCode.USER_REJECTED]: "Transaction was cancelled by user",
      [LiquidityErrorCode.TRANSACTION_TIMEOUT]: "Transaction took too long",
    } as any;
    return messages[code] || "Unknown error occurred";
  };

  const isRetryableError = (code: LiquidityErrorCode): boolean => {
    return [
      LiquidityErrorCode.NETWORK_ERROR,
      LiquidityErrorCode.GAS_ESTIMATION_FAILED,
      LiquidityErrorCode.TRANSACTION_TIMEOUT,
    ].includes(code);
  };

  const mockState = getMockState();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <Text.H3 className="text-xl font-bold mb-4">
          LiquidityTransactionStatus Component Demo
        </Text.H3>
        <Text.Body2 className="text-gray-600 mb-6">
          This component provides comprehensive transaction status feedback with proper error handling,
          accessibility support, and DeFi-specific features.
        </Text.Body2>
      </div>

      {/* State Controls */}
      <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
        <Text.Body2 className="font-medium mb-3">Demo Controls:</Text.Body2>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            onClick={() => setCurrentState('idle')}
            variant={currentState === 'idle' ? 'default' : 'outline'}
            className="text-sm"
          >
            Idle
          </Button>
          <Button
            onClick={() => setCurrentState('success')}
            variant={currentState === 'success' ? 'default' : 'outline'}
            className="text-sm"
          >
            Success
          </Button>
          <Button
            onClick={() => setCurrentState('error')}
            variant={currentState === 'error' ? 'default' : 'outline'}
            className="text-sm"
          >
            Error
          </Button>
          <Button
            onClick={() => setCurrentState('loading')}
            variant={currentState === 'loading' ? 'default' : 'outline'}
            className="text-sm"
          >
            Loading
          </Button>
        </div>

        {currentState === 'error' && (
          <div>
            <Text.Body2 className="font-medium mb-2">Error Type:</Text.Body2>
            <select
              value={errorType}
              onChange={(e) => setErrorType(e.target.value as LiquidityErrorCode)}
              className="px-3 py-2 border border-gray-300 rounded text-sm"
            >
              <option value={LiquidityErrorCode.NETWORK_ERROR}>Network Error</option>
              <option value={LiquidityErrorCode.INSUFFICIENT_BALANCE}>Insufficient Balance</option>
              <option value={LiquidityErrorCode.HIGH_SLIPPAGE_WARNING}>High Slippage Warning</option>
              <option value={LiquidityErrorCode.GAS_ESTIMATION_FAILED}>Gas Estimation Failed</option>
              <option value={LiquidityErrorCode.WALLET_NOT_CONNECTED}>Wallet Not Connected</option>
              <option value={LiquidityErrorCode.POOL_NOT_FOUND}>Pool Not Found</option>
              <option value={LiquidityErrorCode.USER_REJECTED}>User Rejected</option>
              <option value={LiquidityErrorCode.TRANSACTION_TIMEOUT}>Transaction Timeout</option>
            </select>
          </div>
        )}
      </div>

      {/* Component Showcase */}
      <div className="border border-gray-200 rounded-lg p-4">
        <Text.Body2 className="font-medium mb-4">Component Output:</Text.Body2>

        {/* Mock the context */}
        {mockContextProvider(
          mockState,
          <LiquidityTransactionStatus
            onRetry={handleRetry}
            onNavigateToPool={handleNavigateToPool}
            onContactSupport={handleContactSupport}
            showDetailedErrors={true}
            showTransactionHash={true}
            explorerUrl="https://solscan.io/tx"
          />
        )}
      </div>

      {/* Features List */}
      <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
        <Text.Body2 className="font-medium mb-3">Key Features:</Text.Body2>
        <ul className="space-y-1 text-sm text-gray-700">
          <li>• <strong>XState Integration:</strong> Proper state checking with state.matches()</li>
          <li>• <strong>Enhanced Error Types:</strong> DeFi-specific error categorization</li>
          <li>• <strong>Accessibility:</strong> ARIA labels, live regions, screen reader support</li>
          <li>• <strong>Transaction Hash:</strong> Clickable explorer links with truncated display</li>
          <li>• <strong>Progress Tracking:</strong> Visual progress bar with step indicators</li>
          <li>• <strong>Error Recovery:</strong> Contextual retry/reset options</li>
          <li>• <strong>DeFi Education:</strong> Links to impermanent loss and slippage resources</li>
          <li>• <strong>Gas Fee Warnings:</strong> SOL balance reminders for transactions</li>
          <li>• <strong>Security Reminders:</strong> Wallet signature verification guidance</li>
          <li>• <strong>Responsive Design:</strong> Mobile-friendly button layouts</li>
        </ul>
      </div>

      {/* Usage Example */}
      <div className="p-4 border border-green-200 rounded-lg bg-green-50">
        <Text.Body2 className="font-medium mb-3">Usage Example:</Text.Body2>
        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`<LiquidityTransactionStatus
  onRetry={handleRetry}
  onNavigateToPool={handleNavigateToPool}
  onContactSupport={handleContactSupport}
  showDetailedErrors={true}
  showTransactionHash={true}
  explorerUrl="https://solscan.io/tx"
  className="custom-spacing"
/>`}
        </pre>
      </div>
    </div>
  );
}