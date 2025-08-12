import { procedure } from "@dex-web/orpc/core";
import { submitLiquidityTxHandler } from "../../handlers/pools/submitLiquidityTx.handler";
import {
  submitLiquidityTxInputSchema,
  submitLiquidityTxOutputSchema,
} from "../../schemas/pools/submitLiquidityTx.schema";

export const submitLiquidityTx = procedure
  .input(submitLiquidityTxInputSchema)
  .output(submitLiquidityTxOutputSchema)
  .handler(submitLiquidityTxHandler);
