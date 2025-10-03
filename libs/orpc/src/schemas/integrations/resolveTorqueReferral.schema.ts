import { z } from "zod/v4";

export const resolveTorqueReferralInputSchema = z.object({
  referralCode: z.string(),
});

export const resolveTorqueReferralOutputSchema = z.object({
  error: z.string().optional(),
  publicKey: z.string().optional(),
  success: z.boolean(),
  vanity: z.string().nullable().optional(),
});

export type ResolveTorqueReferralInput = z.infer<
  typeof resolveTorqueReferralInputSchema
>;

export type ResolveTorqueReferralOutput = z.infer<
  typeof resolveTorqueReferralOutputSchema
>;
