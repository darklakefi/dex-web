"use client";

import { Button } from "@dex-web/ui";
import { useLiquidityFormState } from "./LiquidityContexts";
import { useLiquidityValidation } from "../_hooks/useLiquidityValidation";
import { getLiquidityButtonState, getButtonMessage, type ButtonState } from "../_utils/liquidityButtonState";
import { useRouter } from "next/navigation";
import { createSerializer } from "nuqs";
import { liquidityPageParsers } from "../../../_utils/searchParams";
import { LIQUIDITY_PAGE_TYPE } from "../../../_utils/constants";
import type { PublicKey } from "@solana/web3.js";
import type { TokenAccountsData, PoolDetails } from "../_types/enhanced.types";

interface LiquidityActionButtonProps {
  publicKey: PublicKey | null;
  buyTokenAccount: TokenAccountsData | undefined;
  sellTokenAccount: TokenAccountsData | undefined;
  poolDetails: PoolDetails | null;
  tokenAAddress: string;
  tokenBAddress: string;
  isPoolLoading: boolean;
  isTokenAccountsLoading: boolean;
  onSubmit: () => void;
}

const serialize = createSerializer(liquidityPageParsers);

export function LiquidityActionButton({
  publicKey,
  buyTokenAccount,
  sellTokenAccount,
  poolDetails,
  tokenAAddress,
  tokenBAddress,
  isPoolLoading,
  isTokenAccountsLoading,
  onSubmit,
}: LiquidityActionButtonProps) {
  const router = useRouter();
  const { state, isCalculating, form } = useLiquidityFormState();

  const validation = useLiquidityValidation({
    formValues: form.state.values,
    buyTokenAccount,
    sellTokenAccount,
    poolDetails,
    tokenAAddress,
    tokenBAddress,
    hasWallet: !!publicKey,
  });

  const buttonState = getLiquidityButtonState({
    machineContext: state,
    validation,
    poolDetails,
    hasWallet: !!publicKey,
    isPoolLoading,
    isTokenAccountsLoading,
    isCalculating,
  });

  const buttonMessage = getButtonMessage(buttonState);

  const handleButtonClick = () => {
    if (shouldShowTransactionPreview(validation)) {
      console.warn('High-value transaction - consider adding preview modal');
    }
    onSubmit();
  };

  const getButtonProps = () => {
    const isDisabled = buttonState === 'INSUFFICIENT_BALANCE' ||
                       buttonState === 'SAME_TOKENS' ||
                       buttonState === 'INVALID_PRICE' ||
                       buttonState === 'ENTER_AMOUNTS' ||
                       buttonState === 'ENTER_AMOUNT' ||
                       buttonState === 'LOADING' ||
                       buttonState === 'DISABLED';

    const isLoading = buttonState === 'SUBMITTING' || buttonState === 'CALCULATING';

    return {
      isDisabled,
      isLoading,
      variant: _getButtonVariant(buttonState) as 'primary' | 'secondary' | 'danger',
      'aria-label': _getAriaLabel(buttonState, buttonMessage),
      'aria-describedby': isDisabled ? `${buttonState.toLowerCase()}-help` : undefined,
    };
  };

  const buttonProps = getButtonProps();

  if (!publicKey) {
    return (
      <Button
        className="w-full cursor-pointer py-3 leading-6"
        onClick={() => router.push("/select-wallet")}
        variant="primary"
        aria-label="Connect wallet to add liquidity"
      >
        {buttonMessage}
      </Button>
    );
  }

  if (isPoolLoading) {
    return (
      <Button className="w-full cursor-pointer py-3 leading-6" disabled>
        Loading Pool...
      </Button>
    );
  }

  if (!poolDetails || buttonState === 'CREATE_POOL') {
    return (
      <Button
        className="w-full cursor-pointer py-3 leading-6"
        onClick={() => {
          const urlWithParams = serialize("liquidity", {
            tokenAAddress,
            tokenBAddress,
            type: LIQUIDITY_PAGE_TYPE.CREATE_POOL,
          });
          router.push(`/${urlWithParams}`);
        }}
        aria-label={`Create new liquidity pool for ${tokenAAddress} and ${tokenBAddress}`}
      >
        {buttonMessage}
      </Button>
    );
  }

  return (
    <>
      <Button
        className={`w-full cursor-pointer py-3 leading-6 transition-all duration-200 ${
          buttonProps.isDisabled ? 'opacity-60' : 'hover:opacity-90'
        }`}
        disabled={buttonProps.isDisabled}
        loading={buttonProps.isLoading}
        onClick={handleButtonClick}
        variant={buttonProps.variant}
        aria-label={buttonProps['aria-label']}
        aria-describedby={buttonProps['aria-describedby']}
        data-testid="liquidity-action-button"
        data-button-state={buttonState}
      >
        {buttonMessage}
      </Button>

      {shouldShowSecurityWarning(validation, buttonState) && (
        <SecurityWarning
          validation={validation}
          buttonState={buttonState}
        />
      )}
    </>
  );
}

function _getButtonVariant(buttonState: ButtonState): 'primary' | 'secondary' | 'danger' {
  switch (buttonState) {
    case 'INSUFFICIENT_BALANCE':
    case 'SAME_TOKENS':
    case 'INVALID_PRICE':
      return 'danger';
    case 'CREATE_POOL':
      return 'secondary';
    default:
      return 'primary';
  }
}

function _getAriaLabel(buttonState: ButtonState, buttonMessage: string): string {
  const stateDescriptions: Record<ButtonState, string> = {
    SUBMITTING: 'Transaction in progress, please wait',
    CALCULATING: 'Calculating optimal amounts, please wait',
    INSUFFICIENT_BALANCE: 'Cannot proceed due to insufficient token balance',
    ENTER_AMOUNTS: 'Enter token amounts to continue',
    ENTER_AMOUNT: 'Enter an amount to add liquidity',
    CREATE_POOL: 'Navigate to create new liquidity pool',
    ADD_LIQUIDITY: 'Add liquidity to existing pool',
    SAME_TOKENS: 'Cannot proceed - same token selected twice',
    INVALID_PRICE: 'Cannot proceed - invalid initial price',
    LOADING: 'Loading pool information',
    DISABLED: 'Action not available'
  };

  return stateDescriptions[buttonState] || buttonMessage;
}

function SecurityWarning({ validation: _validation, buttonState: _buttonState }: { validation: unknown; buttonState: ButtonState }) {
  return (
    <div className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-3">
      <div className="flex">
        <div className="text-sm text-yellow-800">
          ⚠️ High-value transaction detected. Please review amounts carefully.
        </div>
      </div>
    </div>
  );
}

function shouldShowSecurityWarning(_validation: unknown, _buttonState: ButtonState): boolean {
  return false;
}

function shouldShowTransactionPreview(_validation: unknown): boolean {
  return false;
}