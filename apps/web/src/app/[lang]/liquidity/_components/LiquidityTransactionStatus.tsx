"use client";

import { useCallback, useMemo } from "react";
import { Button, Text, Icon } from "@dex-web/ui";
import { useLiquidityFormState } from "./LiquidityContexts";
import { useLiquidityActions } from "./LiquidityContexts";
import {
  LiquidityError,
  toLiquidityError,
  getErrorMessage,
  getErrorSolution,
  isRetryableError,
  LiquidityErrorCode
} from "../_utils/liquidityErrors";

interface LiquidityTransactionStatusProps {
  onRetry?: () => Promise<void>;
  onNavigateToPool?: () => void;
  onContactSupport?: () => void;
  className?: string;
  showDetailedErrors?: boolean;
  showTransactionHash?: boolean;
  explorerUrl?: string;
}

export function LiquidityTransactionStatus({
  onRetry,
  onNavigateToPool,
  onContactSupport,
  className = "",
  showDetailedErrors = true,
  showTransactionHash = true,
  explorerUrl = "https://solscan.io/tx",
}: LiquidityTransactionStatusProps) {
  const {
    state,
    send,
    isSuccess,
    isError,
    isSubmitting,
    hasError,
  } = useLiquidityFormState();

  const {
    resetFormToDefaults,
    trackError
  } = useLiquidityActions();

  const liquidityError = useMemo(() => {
    if (!state.error) return null;
    return state.error instanceof LiquidityError
      ? state.error
      : toLiquidityError(state.error);
  }, [state.error]);

  const handleRetry = useCallback(async () => {
    if (isSubmitting || !onRetry) return;

    send({ type: "RETRY" });
    try {
      await onRetry();
    } catch (error) {
      trackError(error, { context: 'retry_attempt' });
    }
  }, [onRetry, send, isSubmitting, trackError]);

  const handleReset = useCallback(() => {
    send({ type: "RESET" });
    resetFormToDefaults();
  }, [send, resetFormToDefaults]);

  const renderTransactionHash = () => {
    if (!showTransactionHash || !state.transactionSignature) return null;

    return (
      <div className="mt-3 p-2 bg-gray-800 rounded border border-gray-600">
        <Text.Body2 className="text-gray-300 text-xs font-medium">
          Transaction Hash:
        </Text.Body2>
        <div className="flex items-center gap-2 mt-1">
          <Text.Body2 className="text-gray-400 text-xs font-mono break-all">
            {state.transactionSignature.slice(0, 8)}...{state.transactionSignature.slice(-8)}
          </Text.Body2>
          <a
            href={`${explorerUrl}/${state.transactionSignature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
            aria-label={`View transaction ${state.transactionSignature} on Solana explorer`}
          >
            <Icon name="external-link" className="size-3" />
            <span className="text-xs">View</span>
          </a>
        </div>
      </div>
    );
  };

  if (isSuccess) {
    return (
      <div
        className={`mt-4 ${className}`}
        role="status"
        aria-live="polite"
        aria-label="Transaction successful"
      >
        <div className="p-4 bg-gradient-to-r from-green-600 to-green-500 border border-green-400 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Icon name="check-filled" className="size-8 text-green-200 animate-pulse" />
            </div>
            <div className="flex-1">
              <Text.Body2 className="text-green-100 font-medium">
                Liquidity Added Successfully!
              </Text.Body2>
              <Text.Body2 className="text-green-200 text-sm mt-1">
                Your liquidity has been added to the pool and you'll start earning fees immediately.
              </Text.Body2>
            </div>
          </div>

          {renderTransactionHash()}

          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              onClick={handleReset}
              className="flex-1 sm:flex-none text-sm bg-green-700 hover:bg-green-800 border-green-600"
              aria-label="Add more liquidity to the same pool"
            >
              <Icon name="plus" className="size-4 mr-1" />
              Add More Liquidity
            </Button>

            {onNavigateToPool && (
              <Button
                onClick={onNavigateToPool}
                variant="outline"
                className="flex-1 sm:flex-none text-sm border-green-400 text-green-200 hover:bg-green-800"
                aria-label="View your liquidity positions"
              >
                View Your Positions
              </Button>
            )}
          </div>

          <div className="mt-3 p-2 bg-green-700 bg-opacity-50 rounded border border-green-500">
            <Text.Body2 className="text-green-200 text-xs">
              💡 <strong>Pro tip:</strong> Monitor your position for impermanent loss and consider
              rebalancing if token prices diverge significantly.
            </Text.Body2>
          </div>
        </div>
      </div>
    );
  }

  if (isError && hasError && liquidityError) {
    const canRetry = isRetryableError(liquidityError);
    const errorMessage = getErrorMessage(liquidityError);
    const errorSolution = getErrorSolution(liquidityError);

    const severityClasses = {
      error: "bg-red-600 border-red-400",
      warning: "bg-yellow-600 border-yellow-400",
      info: "bg-blue-600 border-blue-400"
    };

    const textClasses = {
      error: "text-red-200",
      warning: "text-yellow-200",
      info: "text-blue-200"
    };

    const iconClasses = {
      error: "text-red-300",
      warning: "text-yellow-300",
      info: "text-blue-300"
    };

    const iconNames = {
      error: "exclamation" as const,
      warning: "exclamation" as const,
      info: "info" as const
    };

    return (
      <div
        className={`mt-4 ${className}`}
        role="alert"
        aria-live="assertive"
        aria-label="Transaction error"
      >
        <div className={`p-4 ${severityClasses[liquidityError.severity]} rounded-lg`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Icon
                name={iconNames[liquidityError.severity]}
                className={`size-6 ${iconClasses[liquidityError.severity]}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <Text.Body2 className={`${textClasses[liquidityError.severity]} font-medium`}>
                {errorMessage}
              </Text.Body2>

              {showDetailedErrors && (
                <Text.Body2 className={`${textClasses[liquidityError.severity]} text-sm mt-2 opacity-90`}>
                  {errorSolution}
                </Text.Body2>
              )}

              {liquidityError.context && showDetailedErrors && (
                <details className="mt-2">
                  <summary className={`${textClasses[liquidityError.severity]} text-xs cursor-pointer opacity-75 hover:opacity-100`}>
                    Technical Details
                  </summary>
                  <pre className={`${textClasses[liquidityError.severity]} text-xs mt-1 opacity-60 overflow-auto`}>
                    {JSON.stringify(liquidityError.context, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>

          {renderTransactionHash()}

          <div className="flex flex-wrap gap-2 mt-4">
            {canRetry && onRetry && (
              <Button
                onClick={handleRetry}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none text-sm"
                aria-label="Retry the failed transaction"
              >
                <Icon name="refresh" className={`size-4 mr-1 ${isSubmitting ? 'animate-spin' : ''}`} />
                {isSubmitting ? 'Retrying...' : 'Retry'}
              </Button>
            )}

            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 sm:flex-none text-sm"
              aria-label="Reset form and start over"
            >
              Reset Form
            </Button>

            {liquidityError.code === LiquidityErrorCode.WALLET_NOT_CONNECTED && (
              <Button
                onClick={() => {
                  window.location.reload();
                }}
                className="flex-1 sm:flex-none text-sm bg-blue-600 hover:bg-blue-700"
                aria-label="Connect wallet"
              >
                Connect Wallet
              </Button>
            )}

            {liquidityError.code === LiquidityErrorCode.POOL_NOT_FOUND && onNavigateToPool && (
              <Button
                onClick={onNavigateToPool}
                className="flex-1 sm:flex-none text-sm bg-purple-600 hover:bg-purple-700"
                aria-label="Create new pool"
              >
                Create Pool
              </Button>
            )}

            {!canRetry && onContactSupport && (
              <Button
                onClick={onContactSupport}
                variant="outline"
                className="flex-1 sm:flex-none text-sm"
                aria-label="Contact customer support"
              >
                <Icon name="telegram" className="size-4 mr-1" />
                Get Help
              </Button>
            )}
          </div>

          {liquidityError.severity === 'warning' && (
            <div className="mt-3 p-2 bg-yellow-700 bg-opacity-50 rounded border border-yellow-500">
              <Text.Body2 className="text-yellow-200 text-xs">
                ⚠️ <strong>Important:</strong> This is a warning that requires your attention.
                You can proceed but understand the risks involved.
              </Text.Body2>
            </div>
          )}

          {[LiquidityErrorCode.IMPERMANENT_LOSS_WARNING, LiquidityErrorCode.PRICE_IMPACT_HIGH].includes(liquidityError.code) && (
            <div className="mt-3">
              <a
                href="https://docs.uniswap.org/concepts/protocol/liquidity-mining/impermanent-loss"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs transition-colors"
              >
                <Icon name="info" className="size-3" />
                Learn about impermanent loss
                <Icon name="external-link" className="size-3" />
              </a>
            </div>
          )}

          {liquidityError.code === LiquidityErrorCode.GAS_ESTIMATION_FAILED && (
            <div className="mt-3 p-2 bg-orange-700 bg-opacity-50 rounded border border-orange-500">
              <Text.Body2 className="text-orange-200 text-xs">
                ⛽ <strong>Gas Info:</strong> This transaction requires SOL for network fees.
                Make sure you have at least 0.01 SOL in your wallet.
              </Text.Body2>
            </div>
          )}

          {[LiquidityErrorCode.SLIPPAGE_ERROR, LiquidityErrorCode.HIGH_SLIPPAGE_WARNING].includes(liquidityError.code) && (
            <div className="mt-3 p-2 bg-amber-700 bg-opacity-50 rounded border border-amber-500">
              <Text.Body2 className="text-amber-200 text-xs">
                📊 <strong>Slippage:</strong> Consider adjusting your slippage tolerance in settings
                or reducing your transaction size during high volatility periods.
              </Text.Body2>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isSubmitting) {
    const loadingMessages = {
      1: "Preparing transaction...",
      2: "Please sign the transaction in your wallet",
      3: "Transaction submitted. Waiting for confirmation..."
    };

    return (
      <div
        className={`mt-4 ${className}`}
        role="status"
        aria-live="polite"
        aria-label="Transaction in progress"
      >
        <div className="p-4 bg-blue-600 border border-blue-400 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Icon name="loading-stripe" className="size-6 text-blue-200 animate-spin" />
            </div>
            <div className="flex-1">
              <Text.Body2 className="text-blue-100 font-medium">
                Processing Transaction
              </Text.Body2>
              <Text.Body2 className="text-blue-200 text-sm mt-1">
                {loadingMessages[state.liquidityStep as keyof typeof loadingMessages] || "Processing..."}
              </Text.Body2>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <Text.Body2 className="text-blue-200 text-xs">
                Step {state.liquidityStep} of 3
              </Text.Body2>
              <Text.Body2 className="text-blue-200 text-xs">
                {Math.round((state.liquidityStep / 3) * 100)}%
              </Text.Body2>
            </div>
            <div className="w-full bg-blue-800 rounded-full h-1.5">
              <div
                className="bg-blue-300 h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(state.liquidityStep / 3) * 100}%` }}
                role="progressbar"
                aria-valuenow={state.liquidityStep}
                aria-valuemin={0}
                aria-valuemax={3}
              />
            </div>
          </div>

          {state.liquidityStep === 2 && (
            <div className="mt-3 p-2 bg-blue-700 bg-opacity-50 rounded border border-blue-500">
              <Text.Body2 className="text-blue-200 text-xs">
                💼 Check your wallet for the transaction approval prompt.
                This may take a moment to appear.
              </Text.Body2>
            </div>
          )}

          {state.liquidityStep === 2 && (
            <div className="mt-2 p-2 bg-blue-800 bg-opacity-50 rounded border border-blue-600">
              <Text.Body2 className="text-blue-300 text-xs">
                🔒 <strong>Security:</strong> Only sign transactions you initiated.
                Verify the transaction details in your wallet before approving.
              </Text.Body2>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}