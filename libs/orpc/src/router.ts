import { selectUserSchema } from "@dex-web/db";
import { os } from "@orpc/server";
import "dotenv/config";
import type { IncomingHttpHeaders } from "node:http";
import { z } from "zod";

const base = os.errors({
  UNAUTHORIZED: {
    message: "You must be authenticated to perform this action",
  },
});

export const listUser = base
  .input(
    z.object({
      limit: z.number().int().min(1).max(100).optional(),
      cursor: z.number().int().min(0).default(0),
    }),
  )
  .handler(async () => {
    return [{ id: 1, name: "name", age: 10, email: "email" }];
  });

export const findUser = base

  .input(selectUserSchema)
  .handler(async () => {
    return { id: 1, name: "name", age: 10, email: "email" };
  });

export const createUser = base
  .$context<{ headers: IncomingHttpHeaders }>()
  .input(selectUserSchema)
  .handler(async () => {
    return { id: 1, name: "name", age: 10, email: "email" };
  });

export const router = {
	user: {
		list: listUser,
		find: findUser,
		create: createUser,
	},
};
