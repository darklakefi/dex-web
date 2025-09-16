import { getTokenDetailsHandler } from "../../handlers/tokens/getTokenDetails.handler";
import { getTokenDetailsInputSchema } from "../../schemas/tokens/getTokenDetails.schema";
import { baseProcedure } from "../base.procedure";

export const getTokenDetails = baseProcedure
	.input(getTokenDetailsInputSchema)
	.handler(async ({ input }) => {
		return await getTokenDetailsHandler(input);
	});
