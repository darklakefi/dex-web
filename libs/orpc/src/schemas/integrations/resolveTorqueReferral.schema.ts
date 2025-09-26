import { z } from "zod/v4";

export const resolveTorqueReferralInputSchema = z.object({
	referralCode: z.string(),
});

export const resolveTorqueReferralOutputSchema = z.object({
	success: z.boolean(),
	publicKey: z.string().optional(),
	vanity: z.string().nullable().optional(),
	error: z.string().optional(),
});

export type ResolveTorqueReferralInput = z.infer<
	typeof resolveTorqueReferralInputSchema
>;

export type ResolveTorqueReferralOutput = z.infer<
	typeof resolveTorqueReferralOutputSchema
>;