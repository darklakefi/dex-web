import { os } from "@orpc/server";
import * as z from "zod";

export const baseProcedure = os.errors({
  NETWORK_ERROR: {
    data: z.object({
      retryable: z.boolean(),
    }),
    message: "Network connection error",
  },
  SIMULATION_ERROR: {
    data: z.object({
      originalError: z.string(),
      recoverable: z.boolean(),
    }),
    message: "Transaction simulation failed",
  },
  TRANSACTION_FAILED: {
    data: z.object({
      errorCode: z.string().optional(),
      signature: z.string().optional(),
    }),
    message: "Transaction failed",
  },
  UNAUTHORIZED: {
    message: "You must be authenticated to perform this action",
  },
  VALIDATION_ERROR: {
    data: z.object({
      field: z.string().optional(),
      reason: z.string(),
    }),
    message: "Invalid input provided",
  },
});
