import { z } from "zod/v4";

export const createTorqueReferralInputSchema = z.object({
  userId: z.string(),
});

export const createTorqueReferralOutputSchema = z.object({
  error: z.string().optional(),
  publicKey: z.string().optional(),
  referralCode: z.string(),
  success: z.boolean(),
  vanity: z.string().nullable().optional(),
});

export type CreateTorqueReferralInput = z.infer<
  typeof createTorqueReferralInputSchema
>;

export type CreateTorqueReferralOutput = z.infer<
  typeof createTorqueReferralOutputSchema
>;
