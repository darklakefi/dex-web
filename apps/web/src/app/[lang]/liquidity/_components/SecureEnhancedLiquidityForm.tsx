"use client";

import {
  ERROR_MESSAGES,
  useLiquidityTracking,
  useTransactionStatus,
  useTransactionToasts,
} from "@dex-web/core";
import { client } from "@dex-web/orpc";
import type { CreateLiquidityTransactionInput } from "@dex-web/orpc/schemas";
import { Box, Icon, Text } from "@dex-web/ui";
import {
  parseAmount,
  sortSolanaAddresses,
} from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletPublicKey, useWalletAdapter } from "../../../../hooks/useWalletCache";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createSerializer, useQueryStates } from "nuqs";
import { useState, useCallback, useEffect } from "react";
import type { WalletAdapter } from "../_types/enhanced.types";
import { useRealtimePoolData } from "../../../../hooks/useRealtimePoolData";
import { useRealtimeTokenAccounts } from "../../../../hooks/useRealtimeTokenAccounts";
import { TokenTransactionSettingsButton } from "../../../_components/TokenTransactionSettingsButton";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
  EMPTY_TOKEN,
  LIQUIDITY_PAGE_TYPE,
} from "../../../_utils/constants";
import { isSquadsX } from "../../../_utils/isSquadsX";
import {
  liquidityPageParsers,
  selectedTokensParsers,
} from "../../../_utils/searchParams";
import { dismissToast, toast } from "../../../_utils/toast";
import { requestLiquidityTransactionSigning } from "../_utils/requestLiquidityTransactionSigning";
import { AddLiquidityDetails } from "./AddLiquidityDetail";
import { LiquidityFormProvider, useLiquidityForm } from "./LiquidityFormProvider";
import { LiquidityTokenInputs } from "./LiquidityTokenInputs";
import { LiquidityActionButton } from "./LiquidityActionButton";
import { LiquidityTransactionStatus } from "./LiquidityTransactionStatus";
import { withErrorBoundary, toLiquidityError } from "../_utils/liquidityErrors";
import {
  LiquidityFormErrorBoundary,
  LiquidityTokenInputErrorBoundary,
  LiquidityTransactionErrorBoundary,
  LiquidityAPIErrorBoundary,
} from "./LiquidityErrorBoundary";
import {
  useLiquiditySecurity,
  useSlippageWarnings,
  useSecurityMonitoring,
  useMultiSigValidation,
} from "../_hooks/useSecurityHooks";
import {
  validateLiquidityTransaction,
  type SecurityValidationResult,
} from "../_utils/securityValidation";

const serialize = createSerializer(liquidityPageParsers);

interface SecurityStatusProps {
  alerts: string[];
  threatLevel: 'low' | 'medium' | 'high';
  onClearAlerts: () => void;
}

function SecurityStatus({ alerts, threatLevel, onClearAlerts }: SecurityStatusProps) {
  if (alerts.length === 0) return null;

  const getBorderColor = () => {
    switch (threatLevel) {
      case 'high': return 'border-red-400';
      case 'medium': return 'border-yellow-400';
      case 'low': return 'border-blue-400';
      default: return 'border-gray-400';
    }
  };

  const getBackgroundColor = () => {
    switch (threatLevel) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getTextColor = () => {
    switch (threatLevel) {
      case 'high': return 'text-red-300';
      case 'medium': return 'text-yellow-300';
      case 'low': return 'text-blue-300';
      default: return 'text-gray-300';
    }
  };

  return (
    <Box className={`border ${getBorderColor()} ${getBackgroundColor()} p-3 mb-4`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Text.Body2 className={`font-semibold ${getTextColor()}`}>
            Security Alert ({threatLevel.toUpperCase()})
          </Text.Body2>
          <div className="mt-2 space-y-1">
            {alerts.map((alert, index) => (
              <Text.Body2 key={index} className={`text-sm ${getTextColor()}`}>
                • {alert}
              </Text.Body2>
            ))}
          </div>
        </div>
        <Button
          size="sm"
          onClick={onClearAlerts}
          className="ml-2 bg-gray-700 hover:bg-gray-600 text-gray-200"
        >
          Dismiss
        </Button>
      </div>
    </Box>
  );
}

interface MultiSigStatusProps {
  isMultiSig: boolean;
  signaturesRequired: number;
  currentSignatures: number;
  progressPercentage: number;
}

function MultiSigStatus({
  isMultiSig,
  signaturesRequired,
  currentSignatures,
  progressPercentage,
}: MultiSigStatusProps) {
  if (!isMultiSig) return null;

  return (
    <Box className="border border-purple-400 bg-purple-600 p-3 mb-4">
      <Text.Body2 className="font-semibold text-purple-300 mb-2">
        Multi-Signature Wallet Detected
      </Text.Body2>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Text.Body2 className="text-purple-200 text-sm">
            Signatures Required: {signaturesRequired}
          </Text.Body2>
          <Text.Body2 className="text-purple-200 text-sm">
            Current: {currentSignatures}/{signaturesRequired}
          </Text.Body2>
        </div>
        <div className="w-full bg-purple-800 rounded-full h-2">
          <div
            className="bg-purple-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        {currentSignatures < signaturesRequired && (
          <Text.Body2 className="text-purple-200 text-xs">
            Transaction will require additional signatures before execution.
          </Text.Body2>
        )}
      </div>
    </Box>
  );
}

interface SlippageWarningsProps {
  warnings: string[];
  severity: 'low' | 'medium' | 'high';
  slippage: string;
  onSlippageChange: (slippage: string) => void;
}

function SlippageWarnings({
  warnings,
  severity,
  slippage,
  onSlippageChange,
}: SlippageWarningsProps) {
  if (warnings.length === 0) return null;

  const getTextColor = () => {
    switch (severity) {
      case 'high': return 'text-red-300';
      case 'medium': return 'text-yellow-300';
      case 'low': return 'text-blue-300';
      default: return 'text-gray-300';
    }
  };

  const getBorderColor = () => {
    switch (severity) {
      case 'high': return 'border-red-400';
      case 'medium': return 'border-yellow-400';
      case 'low': return 'border-blue-400';
      default: return 'border-gray-400';
    }
  };

  return (
    <Box className={`border ${getBorderColor()} bg-gray-700 p-3 mb-2`}>
      <Text.Body2 className={`font-semibold ${getTextColor()} mb-2`}>
        Slippage Warning
      </Text.Body2>
      <div className="space-y-1">
        {warnings.map((warning, index) => (
          <Text.Body2 key={index} className={`text-sm ${getTextColor()}`}>
            {warning}
          </Text.Body2>
        ))}
      </div>
      {severity === 'high' && (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            onClick={() => onSlippageChange('0.5')}
            className="bg-green-600 hover:bg-green-700 text-green-100"
          >
            Set to 0.5%
          </Button>
          <Button
            size="sm"
            onClick={() => onSlippageChange('1.0')}
            className="bg-green-600 hover:bg-green-700 text-green-100"
          >
            Set to 1.0%
          </Button>
        </div>
      )}
    </Box>
  );
}

function SecureLiquidityFormContent() {
  const router = useRouter();
  const { signTransaction } = useWallet();
  const { data: publicKey } = useWalletPublicKey();
  const { data: walletAdapter } = useWalletAdapter() as { data: WalletAdapter | null };
  const { trackLiquidity, trackError } = useAnalytics();
  const queryClient = useQueryClient();
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(selectedTokensParsers);
  const { state, send } = useLiquidityForm();

  const tx = useTranslations("liquidity");

  // Security hooks
  const {
    validateForm,
    securityMonitoring,
    slippageWarnings,
    multiSigValidation,
    transactionLimits,
  } = useLiquiditySecurity();

  const sortedTokenAddresses = sortSolanaAddresses(tokenAAddress, tokenBAddress);
  const tokenXMint = sortedTokenAddresses.tokenXAddress;
  const tokenYMint = sortedTokenAddresses.tokenYAddress;

  const { poolDetails, isLoading: isPoolLoading } = useRealtimePoolData({
    tokenXMint,
    tokenYMint,
  });

  const {
    buyTokenAccount,
    sellTokenAccount,
    refetchBuyTokenAccount,
    refetchSellTokenAccount,
    isLoadingBuy,
    isLoadingSell,
    isRefreshingBuy,
    isRefreshingSell,
    isRealtime: _isTokenAccountsRealtime,
  } = useRealtimeTokenAccounts({
    publicKey,
    tokenAAddress,
    tokenBAddress,
  });

  const [slippage, setSlippage] = useState("0.5");

  // Update slippage warnings when slippage changes
  useEffect(() => {
    slippageWarnings.updateSlippage(slippage);
  }, [slippage, slippageWarnings]);

  // Get multi-sig status
  const multiSigStatus = multiSigValidation.getMultiSigStatus();

  // Security monitoring
  useEffect(() => {
    if (state.formValues.tokenAAmount && state.formValues.tokenBAmount) {
      securityMonitoring.recordSubmission({
        tokenAAmount: state.formValues.tokenAAmount,
        tokenBAmount: state.formValues.tokenBAmount,
        tokenAAddress: tokenAAddress || '',
        tokenBAddress: tokenBAddress || '',
      });
    }
  }, [state.formValues, tokenAAddress, tokenBAddress, securityMonitoring]);

  const {
    trackInitiated,
    trackSigned,
    trackConfirmed,
    trackFailed,
    trackError: trackLiquidityError,
  } = useLiquidityTracking({
    trackError: (error: unknown, context?: Record<string, unknown>) => {
      trackError({
        context: "liquidity",
        details: context,
        error: error instanceof Error ? error.message : String(error),
      });
    },
    trackLiquidity,
  });

  const toasts = useTransactionToasts({
    customMessages: {
      squadsXFailure: {
        description: tx("squadsX.responseStatus.failed.description"),
        title: tx("squadsX.responseStatus.failed.title"),
      },
      squadsXSuccess: {
        description: tx("squadsX.responseStatus.confirmed.description"),
        title: tx("squadsX.responseStatus.confirmed.title"),
      },
    },
    dismissToast,
    isSquadsX: isSquadsX(walletAdapter?.wallet),
    toast,
    transactionType: "LIQUIDITY",
  });

  const handleError = useCallback((error: unknown, context?: Record<string, unknown>): void => {
    const liquidityError = toLiquidityError(error, context);
    send({ type: "ERROR", error: liquidityError.message });
    toasts.showErrorToast(liquidityError.message);

    if (context) {
      trackLiquidityError(error, context);
    }
  }, [send, toasts, trackLiquidityError]);

  // Enhanced security validation before submission
  const validateSecureTransaction = useCallback((): SecurityValidationResult => {
    if (!tokenAAddress || !tokenBAddress) {
      return {
        isValid: false,
        error: 'Token addresses are required',
        severity: 'high',
      };
    }

    const validation = validateForm({
      tokenAAddress,
      tokenBAddress,
      tokenAAmount: state.formValues.tokenAAmount,
      tokenBAmount: state.formValues.tokenBAmount,
      slippage,
      tokenADecimals: buyTokenAccount?.tokenAccounts[0]?.decimals || 9,
      tokenBDecimals: sellTokenAccount?.tokenAccounts[0]?.decimals || 9,
      maxBalanceA: buyTokenAccount?.tokenAccounts[0]?.amount?.toString(),
      maxBalanceB: sellTokenAccount?.tokenAccounts[0]?.amount?.toString(),
    });

    return validation;
  }, [
    tokenAAddress,
    tokenBAddress,
    state.formValues,
    slippage,
    buyTokenAccount,
    sellTokenAccount,
    validateForm,
  ]);

  const statusChecker = useTransactionStatus({
    checkStatus: async (signature: string) => {
      const response = await client.liquidity.checkLiquidityTransactionStatus({
        signature,
      });
      return {
        data: response,
        error: response.error,
        status: response.status,
      };
    },
    failStates: ["failed"],
    maxAttempts: 15,
    onFailure: (result) => {
      handleError(new Error(result.error || "Unknown error"));
    },
    onStatusUpdate: (status, attempt) => {
      toasts.showStatusToast(
        `Finalizing transaction... (${attempt}/15) - ${status}`,
      );
    },
    onSuccess: (result) => {
      if (result.error) {
        const tokenAAmount = parseAmount(state.formValues.tokenAAmount);
        const tokenBAmount = parseAmount(state.formValues.tokenBAmount);

        handleError(new Error(result.error), {
          amountA: state.formValues.tokenAAmount,
          amountB: state.formValues.tokenBAmount,
          tokenA: tokenAAddress,
          tokenB: tokenBAddress,
        });

        trackFailed({
          action: "add",
          amountA: tokenAAmount,
          amountB: tokenBAmount,
          tokenA: tokenAAddress || "",
          tokenB: tokenBAddress || "",
          transactionHash: "",
        });
        return;
      }

      send({ type: "SUCCESS" });
      const tokenAAmount = parseAmount(state.formValues.tokenAAmount);
      const tokenBAmount = parseAmount(state.formValues.tokenBAmount);

      trackConfirmed({
        action: "add",
        amountA: tokenAAmount,
        amountB: tokenBAmount,
        tokenA: tokenAAddress || "",
        tokenB: tokenBAddress || "",
        transactionHash: "",
      });

      const successMessage = !isSquadsX(walletAdapter?.wallet)
        ? `ADDED LIQUIDITY: ${state.formValues.tokenAAmount} ${tokenBAddress} + ${state.formValues.tokenBAmount} ${tokenAAddress}`
        : undefined;

      toasts.showSuccessToast(successMessage);
      refetchBuyTokenAccount();
      refetchSellTokenAccount();
      queryClient.invalidateQueries({
        queryKey: ["token-accounts", publicKey?.toBase58()],
      });
    },
    onTimeout: () => {
      handleError(
        new Error("Transaction may still be processing. Check explorer for status."),
      );
    },
    retryDelay: 2000,
    successStates: ["finalized"],
  });

  const checkLiquidityTransactionStatus = async (signature: string) => {
    await statusChecker.checkTransactionStatus(signature);
  };

  const handleDeposit = useCallback(async () => {
    if (!publicKey) {
      toasts.showErrorToast(ERROR_MESSAGES.MISSING_WALLET_INFO);
      return;
    }

    // Perform comprehensive security validation
    const securityValidation = validateSecureTransaction();
    if (!securityValidation.isValid) {
      toasts.showErrorToast(`Security validation failed: ${securityValidation.error}`);
      return;
    }

    // Show warnings if any
    if (securityValidation.warnings && securityValidation.warnings.length > 0) {
      securityValidation.warnings.forEach(warning => {
        toast({
          title: "Security Warning",
          description: warning,
          variant: "warning",
        });
      });
    }

    await withErrorBoundary(
      async () => {
        toasts.showStepToast(1);

        const tokenAAmount = parseAmount(state.formValues.tokenAAmount);
        const tokenBAmount = parseAmount(state.formValues.tokenBAmount);
        trackInitiated({
          action: "add",
          amountA: tokenAAmount,
          amountB: tokenBAmount,
          tokenA: tokenAAddress || "",
          tokenB: tokenBAddress || "",
        });

        const finalTokenAAddress = tokenAAddress?.trim() || DEFAULT_BUY_TOKEN;
        const finalTokenBAddress = tokenBAddress?.trim() || DEFAULT_SELL_TOKEN;

        const sortedTokens = sortSolanaAddresses(finalTokenAAddress, finalTokenBAddress);
        const { tokenXAddress, tokenYAddress } = sortedTokens;

        if (!walletAdapter?.wallet) {
          throw new Error(ERROR_MESSAGES.MISSING_WALLET);
        }

        if (!tokenXAddress || !tokenYAddress) {
          throw new Error("Invalid token addresses after sorting");
        }

        // Sanitize amounts before sending
        const sanitizedTokenAAmount = sanitizeNumericInput(state.formValues.tokenAAmount);
        const sanitizedTokenBAmount = sanitizeNumericInput(state.formValues.tokenBAmount);
        const sanitizedSlippage = sanitizeNumericInput(slippage);

        const sellAmount = parseAmount(sanitizedTokenBAmount);
        const buyAmount = parseAmount(sanitizedTokenAAmount);

        const isTokenXSell = poolDetails?.tokenXMint === tokenBAddress;
        const maxAmountX = isTokenXSell ? sellAmount : buyAmount;
        const maxAmountY = isTokenXSell ? buyAmount : sellAmount;

        const requestPayload = {
          maxAmountX: maxAmountX,
          maxAmountY: maxAmountY,
          slippage: Number(sanitizedSlippage || "0.5"),
          tokenXMint: tokenXAddress,
          tokenYMint: tokenYAddress,
          user: publicKey.toBase58(),
        } satisfies CreateLiquidityTransactionInput;

        const response = await client.liquidity.createLiquidityTransaction(requestPayload);

        if (response.success && response.transaction) {
          trackSigned({
            action: "add",
            amountA: buyAmount,
            amountB: sellAmount,
            tokenA: tokenAAddress || "",
            tokenB: tokenBAddress || "",
          });

          requestLiquidityTransactionSigning({
            checkLiquidityTransactionStatus,
            publicKey,
            setLiquidityStep: () => {},
            signTransaction,
            unsignedTransaction: response.transaction,
          });
        } else {
          throw new Error("Failed to create liquidity transaction");
        }
      },
      handleError,
      {
        amountA: state.formValues.tokenAAmount,
        amountB: state.formValues.tokenBAmount,
        tokenA: tokenAAddress,
        tokenB: tokenBAddress,
      }
    );
  }, [
    publicKey,
    state.formValues,
    tokenAAddress,
    tokenBAddress,
    poolDetails,
    slippage,
    walletAdapter,
    validateSecureTransaction,
    trackInitiated,
    trackSigned,
    toasts,
    handleError,
    checkLiquidityTransactionStatus,
    signTransaction,
  ]);

  const handleRetry = useCallback(async () => {
    send({ type: "RETRY" });
    await handleDeposit();
  }, [send, handleDeposit]);

  const handleReset = useCallback(() => {
    send({ type: "RESET" });
    securityMonitoring.clearAlerts();
  }, [send, securityMonitoring]);

  const handleSlippageChange = useCallback((newSlippage: string) => {
    setSlippage(newSlippage);
    slippageWarnings.updateSlippage(newSlippage);
  }, [slippageWarnings]);

  return (
    <section className="flex w-full max-w-xl items-start gap-1">
      <div className="size-9" />

      <Box padding="lg">
        <div className="flex flex-col gap-4">
          {/* Security Status Display */}
          <SecurityStatus
            alerts={securityMonitoring.securityAlerts}
            threatLevel={securityMonitoring.threatLevel}
            onClearAlerts={securityMonitoring.clearAlerts}
          />

          {/* Multi-Sig Status Display */}
          <MultiSigStatus
            isMultiSig={multiSigStatus.isMultiSig}
            signaturesRequired={multiSigStatus.signaturesRequired}
            currentSignatures={multiSigStatus.currentSignatures}
            progressPercentage={multiSigStatus.progressPercentage}
          />

          {/* Slippage Warnings */}
          <SlippageWarnings
            warnings={slippageWarnings.warnings}
            severity={slippageWarnings.severity}
            slippage={slippage}
            onSlippageChange={handleSlippageChange}
          />

          {/* Token Inputs with Error Boundary */}
          <LiquidityTokenInputErrorBoundary>
            <LiquidityTokenInputs
              buyTokenAccount={buyTokenAccount}
              sellTokenAccount={sellTokenAccount}
              isLoadingBuy={isLoadingBuy}
              isLoadingSell={isLoadingSell}
              isRefreshingBuy={isRefreshingBuy}
              isRefreshingSell={isRefreshingSell}
              tokenAAddress={tokenAAddress}
              tokenBAddress={tokenBAddress}
              poolDetails={poolDetails}
            />
          </LiquidityTokenInputErrorBoundary>

          <div className="w-full">
            <LiquidityTransactionErrorBoundary>
              <LiquidityActionButton
                publicKey={publicKey}
                buyTokenAccount={buyTokenAccount}
                sellTokenAccount={sellTokenAccount}
                poolDetails={poolDetails}
                tokenAAddress={tokenAAddress}
                tokenBAddress={tokenBAddress}
                isPoolLoading={isPoolLoading}
                isTokenAccountsLoading={isLoadingBuy || isLoadingSell}
                onSubmit={handleDeposit}
              />
            </LiquidityTransactionErrorBoundary>
          </div>

          <LiquidityTransactionStatus
            onRetry={handleRetry}
            onReset={handleReset}
          />
        </div>

        {poolDetails &&
          state.formValues.tokenBAmount !== "0" &&
          state.formValues.tokenAAmount !== "0" && (
            <AddLiquidityDetails
              slippage={slippage}
              tokenAAmount={state.formValues.tokenAAmount}
              tokenASymbol={buyTokenAccount?.tokenAccounts[0]?.symbol || ""}
              tokenBAmount={state.formValues.tokenBAmount}
              tokenBSymbol={sellTokenAccount?.tokenAccounts[0]?.symbol || ""}
            />
          )}
      </Box>

      <div className="flex flex-col gap-1">
        <LiquidityAPIErrorBoundary>
          <TokenTransactionSettingsButton
            onChange={handleSlippageChange}
          />
        </LiquidityAPIErrorBoundary>

        <button
          aria-label="change mode"
          className="inline-flex cursor-pointer items-center justify-center bg-green-800 p-2 text-green-300 hover:text-green-200 focus:text-green-200"
          onClick={() => {
            const urlWithParams = serialize("liquidity", {
              tokenAAddress: EMPTY_TOKEN,
              tokenBAddress: EMPTY_TOKEN,
              type: LIQUIDITY_PAGE_TYPE.CREATE_POOL,
            });
            router.push(`/${urlWithParams}`);
          }}
          type="button"
        >
          <Icon className="size-5" name="plus-circle" />
        </button>
      </div>
    </section>
  );
}

export function SecureEnhancedLiquidityForm() {
  return (
    <LiquidityFormErrorBoundary>
      <LiquidityFormProvider>
        <SecureLiquidityFormContent />
      </LiquidityFormProvider>
    </LiquidityFormErrorBoundary>
  );
}