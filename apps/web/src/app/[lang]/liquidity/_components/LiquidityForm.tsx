"use client";

import {
	ERROR_MESSAGES,
	useLiquidityTracking,
	useTokenAccounts,
	useTransactionState,
	useTransactionStatus,
	useTransactionToasts,
} from "@dex-web/core";
import { client, tanstackClient } from "@dex-web/orpc";
import type { CreateLiquidityTransactionInput } from "@dex-web/orpc/schemas";
import { Box, Button, Icon, Text } from "@dex-web/ui";
import {
	convertToDecimal,
	formatAmountInput,
	parseAmount,
	parseAmountBigNumber,
	sortSolanaAddresses,
	validateHasSufficientBalance,
} from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createSerializer, useQueryStates } from "nuqs";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod";
import { useAnalytics } from "../../../../hooks/useAnalytics";
import { ConnectWalletButton } from "../../../_components/ConnectWalletButton";
import { FormFieldset } from "../../../_components/FormFieldset";
import { SelectTokenButton } from "../../../_components/SelectTokenButton";
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
import { getLiquidityFormButtonMessage } from "../_utils/getLiquidityFormButtonMessage";
import { requestLiquidityTransactionSigning } from "../_utils/requestLiquidityTransactionSigning";
import { AddLiquidityDetails } from "./AddLiquidityDetail";

export const { fieldContext, formContext } = createFormHookContexts();

const liquidityFormSchema = z.object({
	initialPrice: z.string(),
	tokenAAmount: z.string(),
	tokenBAmount: z.string(),
});

export type LiquidityFormSchema = z.infer<typeof liquidityFormSchema>;

const { useAppForm } = createFormHook({
	fieldComponents: {
		SwapFormFieldset: FormFieldset,
	},
	fieldContext,
	formComponents: {},
	formContext,
});

const serialize = createSerializer(liquidityPageParsers);

export function LiquidityForm() {
	const router = useRouter();
	const { publicKey, wallet, signTransaction } = useWallet();
	const { trackLiquidity, trackError } = useAnalytics();
	const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
		selectedTokensParsers,
	);

	const tx = useTranslations("liquidity");

	const liquidityState = useTransactionState(0, false, true);
	const [slippage, setSlippage] = useState("0.5");

	const sortedTokenAddresses = sortSolanaAddresses(
		tokenAAddress,
		tokenBAddress,
	);

	const tokenXMint = sortedTokenAddresses.tokenXAddress;
	const tokenYMint = sortedTokenAddresses.tokenYAddress;

	const { data: poolDetails } = useSuspenseQuery(
		tanstackClient.pools.getPoolDetails.queryOptions({
			input: {
				tokenXMint,
				tokenYMint,
			},
		}),
	);

	const {
		buyTokenAccount,
		sellTokenAccount,
		refetchBuyTokenAccount,
		refetchSellTokenAccount,
	} = useTokenAccounts({
		tokenAAddress,
		tokenBAddress,
		publicKey,
		tanstackClient,
	});

	const {
		trackInitiated,
		trackSigned,
		trackConfirmed,
		trackFailed,
		trackError: trackLiquidityError,
	} = useLiquidityTracking({
		trackLiquidity,
		trackError: (error: unknown, context?: Record<string, any>) => {
			trackError({
				error: error instanceof Error ? error.message : String(error),
				context: "liquidity",
				details: context,
			});
		},
	});

	const toasts = useTransactionToasts({
		toast,
		dismissToast,
		transactionType: "LIQUIDITY",
		isSquadsX: isSquadsX(wallet),
		customMessages: {
			squadsXSuccess: {
				title: tx("squadsX.responseStatus.confirmed.title"),
				description: tx("squadsX.responseStatus.confirmed.description"),
			},
			squadsXFailure: {
				title: tx("squadsX.responseStatus.failed.title"),
				description: tx("squadsX.responseStatus.failed.description"),
			},
		},
	});

	const statusChecker = useTransactionStatus({
		checkStatus: async (signature: string) => {
			const response = await client.liquidity.checkLiquidityTransactionStatus({
				signature,
			});
			return {
				status: response.status,
				data: response,
				error: response.error,
			};
		},
		successStates: ["finalized"],
		failStates: ["failed"],
		maxAttempts: 15,
		retryDelay: 2000,
		onStatusUpdate: (status, attempt) => {
			toasts.showStatusToast(
				`Finalizing transaction... (${attempt}/15) - ${status}`,
			);
		},
		onSuccess: (result) => {
			if (result.error) {
				liquidityState.reset();
				toasts.showErrorToast(`Transaction failed: ${result.error}`);

				const tokenAAmount = parseAmount(form.state.values.tokenAAmount);
				const tokenBAmount = parseAmount(form.state.values.tokenBAmount);
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

			liquidityState.reset();
			const tokenAAmount = parseAmount(form.state.values.tokenAAmount);
			const tokenBAmount = parseAmount(form.state.values.tokenBAmount);

			trackConfirmed({
				action: "add",
				amountA: tokenAAmount,
				amountB: tokenBAmount,
				tokenA: tokenAAddress || "",
				tokenB: tokenBAddress || "",
				transactionHash: "",
			});

			const successMessage = !isSquadsX(wallet)
				? `ADDED LIQUIDITY: ${form.state.values.tokenAAmount} ${tokenBAddress} + ${form.state.values.tokenBAmount} ${tokenAAddress}`
				: undefined;

			toasts.showSuccessToast(successMessage);
			refetchBuyTokenAccount();
			refetchSellTokenAccount();
		},
		onFailure: (result) => {
			liquidityState.reset();
			toasts.showErrorToast(
				`Transaction failed: ${result.error || "Unknown error"}`,
			);
		},
		onTimeout: () => {
			liquidityState.reset();
			toasts.showErrorToast(
				"Transaction may still be processing. Check explorer for status.",
			);
		},
	});

	const formConfig = {
		defaultValues: {
			initialPrice: "1",
			tokenAAmount: "0",
			tokenBAmount: "0",
		} satisfies LiquidityFormSchema,
		onSubmit: async ({
			value,
		}: {
			value: { tokenAAmount: string; tokenBAmount: string };
		}) => {
			console.log(value);
		},
		validators: {
			onChange: liquidityFormSchema,
			onDynamic: ({ value }: { value: LiquidityFormSchema }) => {
				if (
					value.tokenAAmount &&
					publicKey &&
					buyTokenAccount?.tokenAccounts?.[0]
				) {
					const tokenANumericValue = formatAmountInput(value.tokenAAmount);
					if (parseAmountBigNumber(tokenANumericValue).gt(0)) {
						const tokenAccount = buyTokenAccount.tokenAccounts[0];
						const maxBalance = convertToDecimal(
							tokenAccount.amount || 0,
							tokenAccount.decimals || 0,
						);

						if (parseAmountBigNumber(tokenANumericValue).gt(maxBalance)) {
							const symbol = tokenAccount.symbol || "token";
							return { tokenAAmount: `Insufficient ${symbol} balance.` };
						}
					}
				}
			},
		},
	};

	const form = useAppForm(formConfig);

	const checkLiquidityTransactionStatus = async (signature: string) => {
		await statusChecker.checkTransactionStatus(signature);
	};

	const handleDeposit = async () => {
		if (!publicKey) {
			toasts.showErrorToast(ERROR_MESSAGES.MISSING_WALLET_INFO);
			return;
		}

		toasts.showStepToast(1);
		liquidityState.setStep(1);

		const tokenAAmount = parseAmount(form.state.values.tokenAAmount);
		const tokenBAmount = parseAmount(form.state.values.tokenBAmount);
		trackInitiated({
			action: "add",
			amountA: tokenAAmount,
			amountB: tokenBAmount,
			tokenA: tokenAAddress || "",
			tokenB: tokenBAddress || "",
		});

		try {
			const finalTokenAAddress = tokenAAddress?.trim() || DEFAULT_BUY_TOKEN;
			const finalTokenBAddress = tokenBAddress?.trim() || DEFAULT_SELL_TOKEN;

			const sortedTokens = sortSolanaAddresses(
				finalTokenAAddress,
				finalTokenBAddress,
			);

			const { tokenXAddress, tokenYAddress } = sortedTokens;

			if (!wallet) {
				throw new Error(ERROR_MESSAGES.MISSING_WALLET);
			}

			if (!tokenXAddress || !tokenYAddress) {
				throw new Error("Invalid token addresses after sorting");
			}

			const sellAmount = parseAmount(form.state.values.tokenBAmount);
			const buyAmount = parseAmount(form.state.values.tokenAAmount);

			const isTokenXSell = poolDetails?.tokenXMint === tokenBAddress;
			const maxAmountX = isTokenXSell ? sellAmount : buyAmount;
			const maxAmountY = isTokenXSell ? buyAmount : sellAmount;

			const requestPayload = {
				maxAmountX: maxAmountX,
				maxAmountY: maxAmountY,
				slippage: Number(slippage || "0.5"),
				tokenXMint: tokenXAddress,
				tokenYMint: tokenYAddress,
				user: publicKey.toBase58(),
			} satisfies CreateLiquidityTransactionInput;

			const response =
				await client.liquidity.createLiquidityTransaction(requestPayload);

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
					setLiquidityStep: liquidityState.setStep,
					signTransaction,
					unsignedTransaction: response.transaction,
				});
			} else {
				throw new Error("Failed to create liquidity transaction");
			}
		} catch (error) {
			console.error("Liquidity error:", error);
			toasts.showErrorToast(
				error instanceof Error ? error.message : "Unknown error occurred",
			);

			trackLiquidityError(error, {
				amountA: form.state.values.tokenAAmount,
				amountB: form.state.values.tokenBAmount,
				tokenA: tokenAAddress,
				tokenB: tokenBAddress,
			});

			liquidityState.reset();
		}
	};

	const calculateTokenAmounts = async ({
		inputAmount,
		inputType,
	}: {
		inputAmount: string;
		inputType: "tokenX" | "tokenY";
	}) => {
		const amountNumber = parseAmount(inputAmount);
		if (!poolDetails || parseAmountBigNumber(inputAmount).lte(0)) return;

		liquidityState.setStep(10);
		liquidityState.setDisabled(true);

		const response = await client.liquidity.getAddLiquidityReview({
			isTokenX: inputType === "tokenX",
			tokenAmount: amountNumber,
			tokenXMint: poolDetails.tokenXMint,
			tokenYMint: poolDetails.tokenYMint,
		});

		if (inputType === "tokenX") {
			form.setFieldValue("tokenBAmount", String(response.tokenAmount));
			form.validateAllFields("change");
		} else {
			form.setFieldValue("tokenAAmount", String(response.tokenAmount));
			form.validateAllFields("change");
		}

		liquidityState.setDisabled(false);
		liquidityState.setStep(0);
	};

	const debouncedCalculateTokenAmounts = useDebouncedCallback(
		calculateTokenAmounts,
		500,
	);

	const handleAmountChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		type: "buy" | "sell",
	) => {
		const value = formatAmountInput(e.target.value);

		if (poolDetails && parseAmountBigNumber(value).gt(0)) {
			const inputType =
				(type === "sell" && poolDetails?.tokenXMint === tokenBAddress) ||
				(type === "buy" && poolDetails?.tokenXMint === tokenAAddress)
					? "tokenX"
					: "tokenY";

			debouncedCalculateTokenAmounts({
				inputAmount: value,
				inputType,
			});
		} else if (!poolDetails) {
			if (type === "buy") {
				const price = form.state.values.initialPrice || "1";
				if (
					parseAmountBigNumber(value).gt(0) &&
					parseAmountBigNumber(price).gt(0)
				) {
					const calculatedTokenB = parseAmountBigNumber(value)
						.multipliedBy(price)
						.toString();
					form.setFieldValue("tokenBAmount", calculatedTokenB);
				}
			}
		} else {
			liquidityState.setDisabled(true);
		}
	};

	return (
		<section className="flex w-full max-w-xl items-start gap-1">
			<div className="size-9" />

			<Box padding="lg">
				<div className="flex flex-col gap-4">
					<Box className="flex-row border border-green-400 bg-green-600 pt-3 pb-3 hover:border-green-300">
						<div>
							<Text.Body2
								as="label"
								className="mb-3 block text-green-300 uppercase"
							>
								AMOUNT
							</Text.Body2>
							<SelectTokenButton returnUrl="liquidity" type="sell" />
						</div>
						<form.Field
							name="tokenBAmount"
							validators={{
								onChange: ({ value }) => {
									return validateHasSufficientBalance({
										amount: value,
										tokenAccount: sellTokenAccount?.tokenAccounts[0],
									});
								},
								onChangeListenTo: ["tokenAAmount"],
							}}
						>
							{(field) => (
								<FormFieldset
									maxDecimals={5}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										handleAmountChange(e, "sell");
										field.handleChange(e.target.value);
									}}
									tokenAccount={sellTokenAccount?.tokenAccounts[0]}
									value={field.state.value}
								/>
							)}
						</form.Field>
					</Box>

					<div className="flex items-center justify-center">
						<div className="inline-flex size-8 items-center justify-center border border-green-600 bg-green-800 p-1 text-green-300">
							<Icon className="size-5" name="plus" />
						</div>
					</div>
					<Box className="flex-row border border-green-400 bg-green-600 pt-3 pb-3 hover:border-green-300">
						<div>
							<Text.Body2
								as="label"
								className="mb-3 block text-green-300 uppercase"
							>
								AMOUNT
							</Text.Body2>
							<SelectTokenButton returnUrl="liquidity" type="buy" />
						</div>
						<form.Field
							name="tokenAAmount"
							validators={{
								onChange: ({ value }) => {
									return validateHasSufficientBalance({
										amount: value,
										tokenAccount: buyTokenAccount?.tokenAccounts[0],
									});
								},
								onChangeListenTo: ["tokenBAmount"],
							}}
						>
							{(field) => (
								<FormFieldset
									maxDecimals={5}
									name={field.name}
									onBlur={field.handleBlur}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										handleAmountChange(e, "buy");
										field.handleChange(e.target.value);
									}}
									tokenAccount={buyTokenAccount?.tokenAccounts[0]}
									value={field.state.value}
								/>
							)}
						</form.Field>
					</Box>

					<div className="w-full">
						{!publicKey ? (
							<ConnectWalletButton className="w-full py-3" />
						) : poolDetails ? (
							<form.Subscribe
								selector={(state) => [state.canSubmit, state.isSubmitting]}
							>
								{([canSubmit, isSubmitting]) => (
									<Button
										className="w-full cursor-pointer py-3 leading-6"
										disabled={
											liquidityState.step !== 0 ||
											liquidityState.isDisabled ||
											!form.state.canSubmit ||
											isSubmitting ||
											!canSubmit
										}
										loading={liquidityState.step !== 0}
										onClick={handleDeposit}
									>
										{getLiquidityFormButtonMessage({
											buyTokenAccount,
											initialPrice: form.state.values.initialPrice,
											liquidityStep: liquidityState.step,
											poolDetails,
											publicKey,
											sellTokenAccount,
											tokenAAddress,
											tokenAAmount: form.state.values.tokenAAmount,
											tokenBAddress,
											tokenBAmount: form.state.values.tokenBAmount,
										})}
									</Button>
								)}
							</form.Subscribe>
						) : (
							<Button
								className="w-full cursor-pointer py-3 leading-6"
								onClick={() => {
									const urlWithParams = serialize("liquidity", {
										tokenAAddress,
										tokenBAddress,
										type: LIQUIDITY_PAGE_TYPE.CREATE_POOL,
									});
									router.push(`/${urlWithParams}`);
									return;
								}}
							>
								Create Pool
							</Button>
						)}
					</div>
				</div>
				{poolDetails &&
					form.state.values.tokenBAmount !== "0" &&
					form.state.values.tokenAAmount !== "0" && (
						<AddLiquidityDetails
							slippage={slippage}
							tokenAAmount={form.state.values.tokenAAmount}
							tokenASymbol={buyTokenAccount?.tokenAccounts[0]?.symbol || ""}
							tokenBAmount={form.state.values.tokenBAmount}
							tokenBSymbol={sellTokenAccount?.tokenAccounts[0]?.symbol || ""}
						/>
					)}
			</Box>

			<div className="flex flex-col gap-1">
				<TokenTransactionSettingsButton
					onChange={(slippage) => {
						setSlippage(slippage);
						if (form.state.values.tokenBAmount !== "0") {
							const inputType =
								poolDetails?.tokenXMint === tokenBAddress ? "tokenX" : "tokenY";
							debouncedCalculateTokenAmounts({
								inputAmount: form.state.values.tokenBAmount,
								inputType,
							});
						}
					}}
				/>

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
					<Icon className={`size-5`} name="plus-circle" />
				</button>
			</div>
		</section>
	);
}
