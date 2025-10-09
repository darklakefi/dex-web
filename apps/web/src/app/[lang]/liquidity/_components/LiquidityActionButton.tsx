"use client";

import { Button } from "@dex-web/ui";
import { useWallet } from "@solana/wallet-adapter-react";
import type { PublicKey } from "@solana/web3.js";
import { useStore } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { createSerializer } from "nuqs";
import { LIQUIDITY_PAGE_TYPE } from "../../../_utils/constants";
import { liquidityPageParsers } from "../../../_utils/searchParams";
import type { LiquidityFormApi } from "../_hooks/useLiquidityFormState";
import { useLiquidityValidation } from "../_hooks/useLiquidityValidation";
import type { LiquidityMachineEvent } from "../_machines/liquidityMachine";
import type {
  LiquidityFormValues,
  PoolDetails,
  TokenAccountsData,
} from "../_types/liquidity.types";
import {
  type ButtonState,
  getButtonMessage,
  getLiquidityButtonState,
} from "../_utils/liquidityButtonState";

interface LiquidityActionButtonProps {
  form: LiquidityFormApi;
  publicKey: PublicKey | null;
  buyTokenAccount: TokenAccountsData | undefined;
  sellTokenAccount: TokenAccountsData | undefined;
  poolDetails: PoolDetails | null;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
  isPoolLoading: boolean;
  isTokenAccountsLoading: boolean;
  isCalculating: boolean;
  isError: boolean;
  isSubmitting: boolean;
  isSuccess: boolean;
  onReset: () => void;
  send: (event: LiquidityMachineEvent) => void;
}

const serialize = createSerializer(liquidityPageParsers);

export function LiquidityActionButton({
  form,
  publicKey,
  buyTokenAccount,
  sellTokenAccount,
  poolDetails,
  tokenAAddress,
  tokenBAddress,
  isPoolLoading,
  isTokenAccountsLoading,
  isCalculating,
  isError,
  isSubmitting,
  isSuccess,
  onReset,
  send,
}: LiquidityActionButtonProps) {
  const router = useRouter();
  const { wallet, connected } = useWallet();

  const tokenAAmount = useStore(
    form.store,
    (state) => state.values.tokenAAmount,
  );
  const tokenBAmount = useStore(
    form.store,
    (state) => state.values.tokenBAmount,
  );
  const initialPrice = useStore(
    form.store,
    (state) => state.values.initialPrice,
  );
  const formValues: LiquidityFormValues = {
    initialPrice,
    slippage: undefined,
    tokenAAmount,
    tokenBAmount,
  };
  const hasAnyAmount =
    isPositiveNumber(tokenAAmount) || isPositiveNumber(tokenBAmount);
  const formCanSubmit = useStore(form.store, (state) => state.canSubmit);

  const validation = useLiquidityValidation({
    buyTokenAccount,
    formValues,
    hasWallet: !!publicKey,
    poolDetails,
    sellTokenAccount,
    tokenAAddress: tokenAAddress || "",
    tokenBAddress: tokenBAddress || "",
  });

  const buttonState = getLiquidityButtonState({
    formCanSubmit,
    hasAnyAmount,
    hasWallet: !!publicKey,
    isCalculating,
    isError,
    isFormSubmitting: isSubmitting,
    isPoolLoading,
    isTokenAccountsLoading,
    poolDetails,
    validation,
  });

  const buttonMessage = getButtonMessage(buttonState);

  const getButtonProps = (buttonState: ButtonState) => {
    const isDisabled =
      buttonState === "INSUFFICIENT_BALANCE" ||
      buttonState === "SAME_TOKENS" ||
      buttonState === "INVALID_PRICE" ||
      buttonState === "ENTER_AMOUNTS" ||
      buttonState === "ENTER_AMOUNT" ||
      buttonState === "LOADING" ||
      buttonState === "DISABLED";

    const isLoading =
      buttonState === "SUBMITTING" || buttonState === "CALCULATING";

    return {
      "aria-describedby": isDisabled
        ? `${buttonState.toLowerCase()}-help`
        : undefined,
      "aria-label": _getAriaLabel(buttonState, getButtonMessage(buttonState)),
      isDisabled,
      isLoading,
      variant: _getButtonVariant(buttonState),
    };
  };

  if (!wallet || !connected || !publicKey) {
    return (
      <Button
        aria-label="Connect wallet to add liquidity"
        className="w-full cursor-pointer py-3 leading-6"
        onClick={() => router.push("/select-wallet")}
        variant="primary"
      >
        Connect Wallet
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

  if (!poolDetails || buttonState === "CREATE_POOL") {
    return (
      <Button
        aria-label={`Create new liquidity pool for ${tokenAAddress} and ${tokenBAddress}`}
        className="w-full cursor-pointer py-3 leading-6"
        onClick={() => {
          const urlWithParams = serialize("liquidity", {
            tokenAAddress,
            tokenBAddress,
            type: LIQUIDITY_PAGE_TYPE.CREATE_POOL,
          });
          router.push(`/${urlWithParams}`);
        }}
      >
        {buttonMessage}
      </Button>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-md border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <div className="font-medium text-green-800 text-sm">
              Transaction Successful!
            </div>
          </div>
          <div className="mt-1 text-green-700 text-xs">
            Your liquidity has been added to the pool.
          </div>
        </div>
        <Button
          aria-label="Start a new liquidity transaction"
          className="w-full cursor-pointer py-3 leading-6"
          onClick={() => {
            console.log("🔄 User clicked 'Start New Transaction'");
            onReset();
          }}
          type="button"
          variant="secondary"
        >
          Start New Transaction
        </Button>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <div className="font-medium text-red-800 text-sm">
              Transaction Failed
            </div>
          </div>
          <div className="mt-1 text-red-700 text-xs">
            Please review the error and try again.
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            aria-label="Retry the transaction with the same values"
            className="flex-1 cursor-pointer py-3 leading-6"
            onClick={() => {
              console.log("🔄 User clicked 'Retry'");
              send({ type: "RETRY" });
            }}
            type="button"
            variant="primary"
          >
            Retry
          </Button>
          <Button
            aria-label="Dismiss error and return to form"
            className="flex-1 cursor-pointer py-3 leading-6"
            onClick={() => {
              console.log("❌ User clicked 'Dismiss'");
              send({ type: "DISMISS" });
            }}
            type="button"
            variant="secondary"
          >
            Dismiss
          </Button>
        </div>
      </div>
    );
  }

  const enhancedButtonProps = getButtonProps(buttonState);

  return (
    <>
      <Button
        aria-describedby={enhancedButtonProps["aria-describedby"]}
        aria-label={enhancedButtonProps["aria-label"]}
        className={`w-full cursor-pointer py-3 leading-6 transition-all duration-200 ${
          enhancedButtonProps.isDisabled ? "opacity-60" : "hover:opacity-90"
        }`}
        data-button-state={buttonState}
        data-testid="liquidity-action-button"
        disabled={enhancedButtonProps.isDisabled}
        loading={enhancedButtonProps.isLoading}
        type="submit"
        variant={enhancedButtonProps.variant}
      >
        {buttonMessage}
      </Button>

      {shouldShowSecurityWarning(validation, buttonState) && (
        <SecurityWarning buttonState={buttonState} validation={validation} />
      )}
    </>
  );
}

function isPositiveNumber(value: string): boolean {
  if (!value) return false;
  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed > 0;
}

function _getButtonVariant(
  buttonState: ButtonState,
): "primary" | "secondary" | "danger" {
  switch (buttonState) {
    case "INSUFFICIENT_BALANCE":
    case "SAME_TOKENS":
    case "INVALID_PRICE":
    case "ERROR":
      return "danger";
    case "CREATE_POOL":
      return "secondary";
    default:
      return "primary";
  }
}

function _getAriaLabel(
  buttonState: ButtonState,
  buttonMessage: string,
): string {
  const stateDescriptions: Record<ButtonState, string> = {
    ADD_LIQUIDITY: "Add liquidity to existing pool",
    CALCULATING: "Calculating optimal amounts, please wait",
    CREATE_POOL: "Navigate to create new liquidity pool",
    DISABLED: "Action not available",
    ENTER_AMOUNT: "Enter an amount to add liquidity",
    ENTER_AMOUNTS: "Enter token amounts to continue",
    ERROR: "Transaction failed, click to retry",
    INSUFFICIENT_BALANCE: "Cannot proceed due to insufficient token balance",
    INVALID_PRICE: "Cannot proceed - invalid initial price",
    LOADING: "Loading pool information",
    SAME_TOKENS: "Cannot proceed - same token selected twice",
    SUBMITTING: "Transaction in progress, please wait",
  };

  return stateDescriptions[buttonState] || buttonMessage;
}

function SecurityWarning({
  validation: _validation,
  buttonState: _buttonState,
}: {
  validation: unknown;
  buttonState: ButtonState;
}) {
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

function shouldShowSecurityWarning(
  _validation: unknown,
  _buttonState: ButtonState,
): boolean {
  return false;
}
