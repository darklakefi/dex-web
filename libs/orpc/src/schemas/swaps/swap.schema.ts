import { z } from "zod/v4";
import { tokenSchema } from "../tokens/token.schema";

export const swapSchema = z.object({
	buyAmount: z.number().positive("Amount must be positive"),
	buyBalance: z.number().nonnegative(),
	buyToken: tokenSchema,
	estimatedFeesUsd: z.number().nonnegative(),
	exchangeRate: z.number().positive("Exchange rate must be positive"),
	mevProtectionEnabled: z.boolean(),
	priceImpactPercentage: z.number().min(0).max(100),
	sellAmount: z.number().positive("Amount must be positive"),
	sellBalance: z.number().nonnegative(),
	sellToken: tokenSchema,
	slippageTolerancePercentage: z.number().min(0).max(100),
	swapProgressStep: z.number().min(1).max(3),
	swapStatus: z.enum([
		"pending",
		"encrypting",
		"submitted",
		"failed",
		"success",
	]),
	swapType: z.enum(["swap", "limit", "other"]),
	transactionSignature: z
		.string()
		.regex(/^[1-9A-HJ-NP-Za-km-z]{87,88}$/, "Invalid transaction signature")
		.optional(),
	updatedAt: z.iso.datetime(),
	userAddress: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, {
		message: "Invalid Solana address",
	}),
});

export type Swap = z.infer<typeof swapSchema>;
