"use client";

import { client, tanstackClient } from "@dex-web/orpc";
import type { Token } from "@dex-web/orpc/schemas";
import { Box, Button, Icon, Modal, Text } from "@dex-web/ui";
import {
	convertToDecimal,
	getExplorerUrl,
	numberFormatHelper,
} from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useQueryClient, useSuspenseQueries } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { FormFieldset } from "../../../_components/FormFieldset";
import {
	DEFAULT_BUY_TOKEN,
	DEFAULT_SELL_TOKEN,
} from "../../../_utils/constants";
import { isSquadsX } from "../../../_utils/isSquadsX";
import { dismissToast, toast } from "../../../_utils/toast";

type WithdrawLiquidityFormSchema = z.infer<typeof withdrawLiquidityFormSchema>;

const withdrawLiquidityFormSchema = z.object({
	withdrawalAmount: z.string().min(1, "Amount is required"),
});
export const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
	fieldComponents: {
		SwapFormFieldset: FormFieldset,
	},
	fieldContext,
	formComponents: {},
	formContext,
});

interface WithdrawLiquidityModalProps {
	isOpen: boolean;
	onClose: () => void;
	tokenXAddress: string;
	tokenYAddress: string;
	poolReserves?: {
		reserveX: number;
		reserveY: number;
		totalLpSupply: number;
		lpMint: string;
		exists: boolean;
	};
	userLiquidity?: {
		lpTokenBalance: number;
		lpTokenMint: string;
		decimals: number;
		hasLiquidity: boolean;
	};
	liquidityCalculations: {
		totalUsdValue: number;
		userLpShare: number;
		userTokenXAmount: number;
		userTokenYAmount: number;
	};
	tokenXDetails: Token;
	tokenYDetails: Token;
}

export function WithdrawLiquidityModal({
	isOpen,
	onClose,
	tokenXAddress,
	tokenYAddress,
	poolReserves,
	userLiquidity,
	liquidityCalculations,
	tokenXDetails,
	tokenYDetails,
}: WithdrawLiquidityModalProps) {
	const { publicKey, signTransaction, wallet } = useWallet();
	const queryClient = useQueryClient();
	const [withdrawalCalculations, setWithdrawalCalculations] = useState({
		percentage: 0,
		tokenXAmount: 0,
		tokenYAmount: 0,
		usdValue: 0,
	});

	const form = useAppForm({
		defaultValues: {
			withdrawalAmount: "",
		} satisfies WithdrawLiquidityFormSchema,
	});
	const [withdrawStep, setWithdrawStep] = useState(0);
	const [isWithdrawing, setIsWithdrawing] = useState(false);

	const [
		{ data: tokenXPrice },
		{ data: tokenYPrice }
	] = useSuspenseQueries({
		queries: [
			{
				...tanstackClient.tokens.getTokenPrice.queryOptions({
					input: {
						amount: 1,
						mint: tokenXAddress || DEFAULT_BUY_TOKEN,
						quoteCurrency: "USD",
					},
				}),
				staleTime: 5 * 1000,
			},
			{
				...tanstackClient.tokens.getTokenPrice.queryOptions({
					input: {
						amount: 1,
						mint: tokenYAddress || DEFAULT_SELL_TOKEN,
						quoteCurrency: "USD",
					},
				}),
				staleTime: 5 * 1000,
			}
		]
	});

	const setCalculationEmpty = () => {
		setWithdrawalCalculations({
			percentage: 0,
			tokenXAmount: 0,
			tokenYAmount: 0,
			usdValue: 0,
		});
	};

	const onWithdrawalAmountChange = (withdrawalAmountPercentage: string) => {
		if (
			!userLiquidity ||
			!poolReserves ||
			!withdrawalAmountPercentage ||
			withdrawalAmountPercentage.trim() === "" ||
			withdrawalAmountPercentage === "0" ||
			poolReserves.totalLpSupply === 0
		) {
			setCalculationEmpty();
			return;
		}

		let withdrawLpPercentage: BigNumber;
		try {
			withdrawLpPercentage = BigNumber(
				withdrawalAmountPercentage.replace(/,/g, ""),
			);
			if (withdrawLpPercentage.isNaN() || withdrawLpPercentage.lte(0)) {
				setCalculationEmpty();
				return;
			}
		} catch {
			setCalculationEmpty();
			return;
		}

    const percentage = withdrawLpPercentage.toNumber();
    const tokenXAmount =
			(liquidityCalculations.userTokenXAmount * percentage) / 100;
		const tokenYAmount =
			(liquidityCalculations.userTokenYAmount * percentage) / 100;

		const tokenXValue = BigNumber(tokenXAmount).multipliedBy(
			tokenXPrice.price || 0,
		);
		const tokenYValue = BigNumber(tokenYAmount).multipliedBy(
			tokenYPrice.price || 0,
		);
		const usdValue = tokenXValue.plus(tokenYValue).toNumber();

		setWithdrawalCalculations({
			percentage,
			tokenXAmount,
			tokenYAmount,
			usdValue,
		});
	};

	const handlePercentageClick = (percentage: number) => {
		form.setFieldValue("withdrawalAmount", percentage.toString());
		onWithdrawalAmountChange(percentage.toString());
	};

	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		form.setFieldValue("withdrawalAmount", e.target.value);
		onWithdrawalAmountChange(e.target.value);
	};

	const resetWithdrawState = () => {
		setWithdrawStep(0);
		setIsWithdrawing(false);
	};

	const requestSigning = async (
		unsignedTransaction: string,
		opts: {
			minTokenXOut: string;
			minTokenYOut: string;
			tokenXMint: string;
			tokenYMint: string;
			lpTokenAmount: string;
		},
	) => {
		try {
			if (!publicKey) throw new Error("Wallet not connected!");
			if (!signTransaction)
				throw new Error("Wallet does not support transaction signing!");

			setWithdrawStep(2);
			setIsWithdrawing(true);
			toast({
				description: "Please confirm the transaction in your wallet.",
				title: "Confirm withdrawal [2/3]",
				variant: "loading",
			});

			const unsignedTransactionBuffer = Buffer.from(
				unsignedTransaction,
				"base64",
			);
			const transaction = Transaction.from(unsignedTransactionBuffer);

			const signedTransaction = await signTransaction(transaction);

			setWithdrawStep(3);
			toast({
				description: "Submitting transaction to the blockchain...",
				title: "Processing withdrawal [3/3]",
				variant: "loading",
			});

			const signedTransactionBase64 = Buffer.from(
				signedTransaction.serialize(),
			).toString("base64");

			const submitRes = await client.liquidity.submitWithdrawal({
				lpTokenAmount: opts.lpTokenAmount,
				minTokenXOut: opts.minTokenXOut,
				minTokenYOut: opts.minTokenYOut,
				ownerAddress: publicKey.toBase58(),
				signedTransaction: signedTransactionBase64,
				tokenXMint: opts.tokenXMint,
				tokenYMint: opts.tokenYMint,
			});

			if (!submitRes.success || !submitRes.signature) {
				throw new Error(submitRes.error || "Withdrawal submission failed");
			}

			dismissToast();
			const squads = isSquadsX(wallet);
			toast({
				customAction: (
					<Text
						as={Link}
						className="inline-flex items-center gap-2 text-green-300 leading-none no-underline"
						href={getExplorerUrl({ tx: submitRes.signature })}
						target="_blank"
						variant="link"
					>
						View Transaction <Icon className="size-4" name="external-link" />
					</Text>
				),
				description: (
					<div className="flex flex-col gap-1">
						<Text.Body2>
							{squads
								? `Transaction initiated. You can now cast votes for this proposal on the Squads app.`
								: `Successfully withdrew ${form.state.values.withdrawalAmount} LP tokens. Transaction: ${submitRes.signature}`}
						</Text.Body2>
					</div>
				),

				title: squads ? "Proposal created" : "Withdrawal complete",
				variant: "success",
			});

            try {
				const userLiqOpts =
					tanstackClient.liquidity.getUserLiquidity.queryOptions({
						input: {
							ownerAddress: publicKey.toBase58(),
							tokenXMint: opts.tokenXMint,
							tokenYMint: opts.tokenYMint,
						},
					});
				const reservesOpts = tanstackClient.pools.getPoolReserves.queryOptions({
					input: { tokenXMint: opts.tokenXMint, tokenYMint: opts.tokenYMint },
				});
				const poolDetailsOpts = tanstackClient.pools.getPoolDetails.queryOptions({
					input: { tokenXMint: opts.tokenXMint, tokenYMint: opts.tokenYMint },
				});

                const poolKey = `${opts.tokenXMint}-${opts.tokenYMint}`;
				const sortedPoolKey = [opts.tokenXMint, opts.tokenYMint].sort().join("-");

                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: userLiqOpts.queryKey }),
					queryClient.invalidateQueries({ queryKey: reservesOpts.queryKey }),
					queryClient.invalidateQueries({ queryKey: poolDetailsOpts.queryKey }),

                    queryClient.invalidateQueries({ queryKey: ["pool-details", poolKey] }),
					queryClient.invalidateQueries({ queryKey: ["pool-details", sortedPoolKey] }),

                    queryClient.invalidateQueries({ queryKey: ["pool", opts.tokenXMint, opts.tokenYMint] }),
					queryClient.invalidateQueries({ queryKey: ["pool", opts.tokenYMint, opts.tokenXMint] }),

                    queryClient.invalidateQueries({ queryKey: ["token-accounts", publicKey.toBase58()] }),
				]);
			} catch (error) {
				console.error("Cache invalidation error:", error);
			}

			form.reset();
			onClose();
			resetWithdrawState();
		} catch (error) {
			console.error("Signing error:", error);
			dismissToast();
			const squads = isSquadsX(wallet);
			toast({
				description: squads
					? `Transaction failed in Squads. Please review the proposal in the Squads app.`
					: `${error instanceof Error ? error.message : "Unknown error occurred"}`,
				title: squads ? "Proposal failed" : "Transaction Error",
				variant: "error",
			});
			resetWithdrawState();
		}
	};

	const handleWithdraw = async () => {
		if (!publicKey || !userLiquidity || !poolReserves) {
			toast({
				description: "Missing wallet address or token information",
				title: "Withdrawal Error",
				variant: "error",
			});
			return;
		}

		if (isWithdrawing) return;

		toast({
			description: "Building withdrawal transaction...",
			title: "Preparing withdrawal [1/3]",
			variant: "loading",
		});
		setWithdrawStep(1);
		setIsWithdrawing(true);

		try {
			const userLpBalance = convertToDecimal(
				userLiquidity.lpTokenBalance || 0,
				userLiquidity.decimals,
			);

			const slippageTolerance = 0.01;
			const withdrawLpAmountPercentage = BigNumber(
				form.state.values.withdrawalAmount.replace(/,/g, ""),
			);
			const withdrawLpAmount = withdrawLpAmountPercentage
				.multipliedBy(userLpBalance)
				.dividedBy(100);

			const withdrawShare = withdrawLpAmount.dividedBy(
				poolReserves?.totalLpSupply || 1,
			);
			const expectedX = withdrawShare.multipliedBy(poolReserves?.reserveX || 0);
			const expectedY = withdrawShare.multipliedBy(poolReserves?.reserveY || 0);

			const minXOut = expectedX
				.multipliedBy(1 - slippageTolerance)
				.integerValue(BigNumber.ROUND_FLOOR)
				.toString();
			const minYOut = expectedY
				.multipliedBy(1 - slippageTolerance)
				.integerValue(BigNumber.ROUND_FLOOR)
				.toString();

			const response = await client.liquidity.withdrawLiquidity({
				lpTokenAmount: withdrawLpAmount.toString(),
				minTokenXOut: minXOut,
				minTokenYOut: minYOut,
				ownerAddress: publicKey.toBase58(),
				tokenXMint: tokenXAddress,
				tokenYMint: tokenYAddress,
			});

			if (response.success && response.unsignedTransaction) {
				await requestSigning(response.unsignedTransaction, {
					lpTokenAmount: withdrawLpAmount.toString(),
					minTokenXOut: minXOut,
					minTokenYOut: minYOut,
					tokenXMint: tokenXAddress,
					tokenYMint: tokenYAddress,
				});
			} else {
				throw new Error(
					response.error || "Failed to create withdrawal transaction",
				);
			}
		} catch (error) {
			console.error("Withdrawal error:", error);
			dismissToast();
			toast({
				description:
					error instanceof Error ? error.message : "Unknown error occurred",
				title: "Withdrawal Error",
				variant: "error",
			});
			resetWithdrawState();
		}
	};

	const pendingYield = "$0.00";

	if (!isOpen) return null;

	return (
		<Modal onClose={onClose}>
			<Box className="fixed right-0 flex h-full max-h-full w-full max-w-sm drop-shadow-xl">
				<div className="mb-6 flex justify-between border-green-600 border-b pb-3">
					<Text className="font-bold text-2xl" variant="heading">
						WITHDRAW LIQUIDITY
					</Text>
					<button className="cursor-pointer" onClick={onClose} type="button">
						<Icon className="size-6" name="times" />
					</button>
				</div>

				<div className="flex flex-col gap-6">
					<div>
						<Box className="mb-3 flex-row border border-green-400 bg-green-600 px-5 py-3 hover:border-green-300">
							<div>
								<Text.Body2
									as="label"
									className="mb-7 block text-green-300 uppercase"
								>
									Withdrawal Amount
								</Text.Body2>
								<Text.Body2 className="flex max-w-fit items-center bg-green-700 p-2 text-green-300 leading-none">
									{tokenXDetails.symbol} / {tokenYDetails.symbol}
								</Text.Body2>
							</div>
							<form.Field
								name="withdrawalAmount"
								validators={{
									onChange: ({ value }) => {
										if (!value || value.trim() === "") {
											return undefined;
										}

										return undefined;
									},
								}}
							>
								{(field) => (
									<FormFieldset
										controls={
											<Text.Body2 className="flex gap-3 text-green-300 uppercase">
												<span className="flex gap-3 text-sm">
													{[25, 50, 75, 100].map((percentage) => (
														<button
															className="cursor-pointer uppercase underline"
															key={percentage}
															onClick={(e) => {
																e.preventDefault();
																handlePercentageClick(percentage);
															}}
															type="button"
														>
															{percentage}%
														</button>
													))}
												</span>
											</Text.Body2>
										}
										currencyCode="%"
										maxAmount={100}
										name={field.name}
										onBlur={field.handleBlur}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            handleAmountChange(e);
                                        }}
										value={field.state.value}
									/>
								)}
							</form.Field>
						</Box>
					</div>

					{withdrawalCalculations.percentage > 0 && (
						<div className="space-y-2 bg-green-800 p-3">
							<Text.Body2 className="text-green-300">
								Total Withdrawal
							</Text.Body2>
							<div className="text-green-200 text-lg">
								<div>
									{numberFormatHelper({
										decimalScale: 4,
										trimTrailingZeros: true,
										value: withdrawalCalculations.tokenXAmount,
									})}{" "}
									{tokenXDetails.symbol}
								</div>
								<div>
									{numberFormatHelper({
										decimalScale: 4,
										trimTrailingZeros: true,
										value: withdrawalCalculations.tokenYAmount,
									})}{" "}
									{tokenYDetails.symbol}
								</div>
							</div>
						</div>
					)}

					<div className="space-y-2 bg-green-600 p-3">
						<Text.Body2 className="text-green-300">Your Liquidity</Text.Body2>
						<div className="text-green-200 text-lg">
							<div>
								{numberFormatHelper({
									decimalScale: 4,
									trimTrailingZeros: true,
									value: liquidityCalculations.userTokenXAmount,
								})}{" "}
								{tokenXDetails.symbol}
							</div>
							<div>
								{numberFormatHelper({
									decimalScale: 4,
									trimTrailingZeros: true,
									value: liquidityCalculations.userTokenYAmount,
								})}{" "}
								{tokenYDetails.symbol}
							</div>
						</div>
					</div>

					<div className="hidden space-y-3">
						<div className="flex justify-between">
							<Text.Body2 className="text-green-300">YOUR LIQUIDITY</Text.Body2>
							<Text.Body2 className="text-green-300">
								${liquidityCalculations.totalUsdValue}
							</Text.Body2>
						</div>
						<div className="flex justify-between">
							<Text.Body2 className="text-green-300">PENDING YIELD</Text.Body2>
							<Text.Body2 className="text-green-300">{pendingYield}</Text.Body2>
						</div>
					</div>

					<form.Subscribe
						selector={(state) =>
							[state.canSubmit, state.values.withdrawalAmount] as const
						}
					>
						{([canSubmit, withdrawalAmount]) => {
							const hasEnteredValue = !!(
								withdrawalAmount && withdrawalAmount.trim() !== ""
							);
							const isDisabled = !canSubmit || isWithdrawing;

							return (
								<Button
									className="mt-6 w-full cursor-pointer py-3"
									disabled={isDisabled}
									onClick={handleWithdraw}
									variant={!isDisabled ? "primary" : "secondary"}
								>
									{withdrawStep === 1
										? "PREPARING WITHDRAWAL [1/3]"
										: withdrawStep === 2
											? "CONFIRM TRANSACTION IN WALLET [2/3]"
											: withdrawStep === 3
												? "PROCESSING WITHDRAWAL [3/3]"
												: !hasEnteredValue
													? "SELECT OR ENTER AMOUNT"
													: "WITHDRAW LIQUIDITY"}
								</Button>
							);
						}}
					</form.Subscribe>
				</div>
			</Box>
		</Modal>
	);
}
