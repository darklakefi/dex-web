import { resolveTorqueReferralHandler } from "../../handlers/integrations/resolveTorqueReferral.handler";
import { resolveTorqueReferralInputSchema } from "../../schemas/integrations/resolveTorqueReferral.schema";
import { baseProcedure } from "../base.procedure";

export const resolveTorqueReferral = baseProcedure
	.input(resolveTorqueReferralInputSchema)
	.handler(async ({ input }) => {
		return await resolveTorqueReferralHandler(input);
	});