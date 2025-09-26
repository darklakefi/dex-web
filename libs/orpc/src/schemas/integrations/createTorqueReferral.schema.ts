import { z } from "zod/v4";

export const createTorqueReferralInputSchema = z.object({
	userId: z.string(),
});

export const createTorqueReferralOutputSchema = z.object({
	success: z.boolean(),
	referralCode: z.string(),
	publicKey: z.string().optional(),
	vanity: z.string().nullable().optional(),
	error: z.string().optional(),
});

export type CreateTorqueReferralInput = z.infer<
	typeof createTorqueReferralInputSchema
>;

export type CreateTorqueReferralOutput = z.infer<
	typeof createTorqueReferralOutputSchema
>;
