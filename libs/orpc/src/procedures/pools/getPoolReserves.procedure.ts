import { getPoolReservesHandler } from "../../handlers/pools/getPoolReserves.handler";
import {
  getPoolReservesInputSchema,
  getPoolReservesOutputSchema,
} from "../../schemas/pools/getPoolReserves.schema";
import { baseProcedure } from "../base.procedure";

export const getPoolReserves = baseProcedure
  .input(getPoolReservesInputSchema)
  .output(getPoolReservesOutputSchema)
  .handler(async ({ input }) => {
    return await getPoolReservesHandler(input);
  });
