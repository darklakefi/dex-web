import { os } from "@orpc/server";

export const baseProcedure = os.errors({
  UNAUTHORIZED: {
    message: "You must be authenticated to perform this action",
  },
});
