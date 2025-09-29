"use client";

import { Button } from "@dex-web/ui";
import type { PublicKey } from "@solana/web3.js";
import { useStore } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { createSerializer } from "nuqs";
import { LIQUIDITY_PAGE_TYPE } from "../../../_utils/constants";
import { liquidityPageParsers } from "../../../_utils/searchParams";
import { useLiquidityValidation } from "../_hooks/useLiquidityValidation";
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
import { useLiquidityFormState } from "./LiquidityContexts";

interface LiquidityActionButtonProps {
  publicKey: PublicKey | null;
  buyTokenAccount: TokenAccountsData | undefined;
  sellTokenAccount: TokenAccountsData | undefined;
  poolDetails: PoolDetails | null;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
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

  const formValues = useStore(
    form.store,
    (state) => state.values,
  ) as LiquidityFormValues;

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
    hasWallet: !!publicKey,
    isCalculating,
    isPoolLoading,
    isTokenAccountsLoading,
    poolDetails,
    validation,
  });

  const buttonMessage = getButtonMessage(buttonState);

  const handleButtonClick = () => {
    if (shouldShowTransactionPreview(validation)) {
    }
    onSubmit();
  };

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
      variant: _getButtonVariant(buttonState) as
        | "primary"
        | "secondary"
        | "danger",
    };
  };

  if (!publicKey) {
    return (
      <Button
        aria-label="Connect wallet to add liquidity"
        className="w-full cursor-pointer py-3 leading-6"
        onClick={() => router.push("/select-wallet")}
        variant="primary"
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

  const formState = useStore(form.store, (state) => state);
  const formCanSubmit = formState.canSubmit;
  const formIsSubmitting = formState.isSubmitting;

  const enhancedButtonState = getLiquidityButtonState({
    formCanSubmit,
    hasWallet: !!publicKey,
    isCalculating,
    isFormSubmitting: formIsSubmitting,
    isPoolLoading,
    isTokenAccountsLoading,
    poolDetails,
    validation,
  });

  const enhancedButtonMessage = getButtonMessage(enhancedButtonState);
  const enhancedButtonProps = getButtonProps(enhancedButtonState);

  return (
    <>
      <Button
        aria-describedby={enhancedButtonProps["aria-describedby"]}
        aria-label={enhancedButtonProps["aria-label"]}
        className={`w-full cursor-pointer py-3 leading-6 transition-all duration-200 ${
          enhancedButtonProps.isDisabled
            ? "opacity-60"
            : "hover:opacity-90"
        }`}
        data-button-state={enhancedButtonState}
        data-testid="liquidity-action-button"
        disabled={enhancedButtonProps.isDisabled}
        loading={enhancedButtonProps.isLoading}
        onClick={handleButtonClick}
        variant={enhancedButtonProps.variant}
      >
        {enhancedButtonMessage}
      </Button>

      {shouldShowSecurityWarning(validation, enhancedButtonState) && (
        <SecurityWarning
          buttonState={enhancedButtonState}
          validation={validation}
        />
      )}
    </>
  );
}

function _getButtonVariant(
  buttonState: ButtonState,
): "primary" | "secondary" | "danger" {
  switch (buttonState) {
    case "INSUFFICIENT_BALANCE":
    case "SAME_TOKENS":
    case "INVALID_PRICE":
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

function shouldShowTransactionPreview(_validation: unknown): boolean {
  return false;
}
