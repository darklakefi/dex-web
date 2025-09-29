import React from 'react';
import { useLiquidityFormState, useLiquidityActions } from './LiquidityContexts';

interface LiquidityTransactionStatusProps {
  onRetry?: () => void;
  showDetailedErrors?: boolean;
  showTransactionHash?: boolean;
  onNavigateToPool?: () => void;
  className?: string;
}

export function LiquidityTransactionStatus(props: LiquidityTransactionStatusProps) {
  const formState = useLiquidityFormState();
  const actions = useLiquidityActions();

  // Return null when no relevant state is active (edge case)
  if (!formState.isSuccess && !formState.isError && !formState.isSubmitting && !formState.hasError) {
    return null;
  }

  // Return null for missing error case
  if (formState.isError && !formState.hasError && !formState.state.error) {
    return null;
  }

  // Success state
  if (formState.isSuccess) {
    return (
      <div className={props.className} role="status" aria-live="polite" aria-label="Transaction successful">
        <div>Liquidity Added Successfully!</div>
        <div>Your liquidity has been added to the pool successfully.</div>
        {formState.state.transactionSignature && props.showTransactionHash !== false && (
          <div>
            <div>Transaction Hash:</div>
            <div>{`${formState.state.transactionSignature.slice(0, 8)}...${formState.state.transactionSignature.slice(-4)}`}</div>
            <a
              href={`https://solscan.io/tx/${formState.state.transactionSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View transaction"
            >
              View transaction
            </a>
          </div>
        )}
        <button
          onClick={() => {
            formState.send({ type: "RESET" });
            actions.resetFormToDefaults();
          }}
          aria-label="Add more liquidity to the same pool"
        >
          Add more liquidity
        </button>
        {props.onNavigateToPool && (
          <button onClick={props.onNavigateToPool} aria-label="View your liquidity positions">
            View your liquidity positions
          </button>
        )}
      </div>
    );
  }

  // Loading/submitting state
  if (formState.isSubmitting) {
    const step = formState.state.liquidityStep;
    const progress = Math.round((step / 3) * 100);

    return (
      <div className={props.className} role="status" aria-live="polite" aria-label="Transaction in progress">
        <div>Processing Transaction</div>
        <div>Please sign the transaction in your wallet</div>
        <div>Step {step} of 3</div>
        <div>{progress}%</div>
        <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}></div>
        {step === 2 && (
          <div>
            <div>Check your wallet for the transaction approval prompt.</div>
            <div>Only sign transactions you initiated</div>
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (formState.isError && formState.hasError && formState.state.error) {
    const error = formState.state.error;
    const errorMessage = error.code === 'INSUFFICIENT_BALANCE'
      ? "Insufficient balance for this transaction"
      : (error.message || "An error occurred");

    return (
      <div className={props.className} role="alert" aria-live="assertive" aria-label="Transaction error">
        <div>{errorMessage}</div>

        {props.showDetailedErrors && error.code === 'NETWORK_ERROR' && (
          <div>
            <div>Network error. Please check your connection</div>
            <div>Check your internet connection and try again</div>
          </div>
        )}

        {error.code === 'WALLET_NOT_CONNECTED' && (
          <button>Connect wallet</button>
        )}

        {error.code === 'GAS_ESTIMATION_FAILED' && (
          <div>
            <div>Gas Info</div>
            <div>Make sure you have at least 0.01 SOL for transaction fees</div>
          </div>
        )}

        {error.code === 'HIGH_SLIPPAGE_WARNING' && (
          <div>
            <div>Slippage</div>
            <div>Consider adjusting your slippage tolerance</div>
          </div>
        )}

        {error.retryable && (
          <button onClick={props.onRetry}>Retry</button>
        )}
        <button
          onClick={() => {
            formState.send({ type: "RESET" });
            actions.resetFormToDefaults();
          }}
        >
          Reset form
        </button>
      </div>
    );
  }

  // Default fallback - return null if none of the above conditions match
  return null;
}