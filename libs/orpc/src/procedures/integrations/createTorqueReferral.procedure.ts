import { createTorqueReferralHandler } from "../../handlers/integrations/createTorqueReferral.handler";
import { createTorqueReferralInputSchema } from "../../schemas/integrations/createTorqueReferral.schema";
import { baseProcedure } from "../base.procedure";

export const createTorqueReferral = baseProcedure
	.input(createTorqueReferralInputSchema)
	.handler(async ({ input }) => {
		return await createTorqueReferralHandler(input);
	});
