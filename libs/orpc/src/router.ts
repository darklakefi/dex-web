import { selectUserSchema } from "@dex-web/db";
import { parseJWT } from "@dex-web/utils";
import { ORPCError, os } from "@orpc/server";
import "dotenv/config";
import type { IncomingHttpHeaders } from "node:http";
import { z } from "zod";

export const listUser = os
	.input(
		z.object({
			limit: z.number().int().min(1).max(100).optional(),
			cursor: z.number().int().min(0).default(0),
		}),
	)
	.handler(async () => {
		return [{ id: 1, name: "name" }];
	});

export const findUser = os

	.input(selectUserSchema.pick({ id: true }))
	.handler(async () => {
		return { id: 1, name: "name" };
	});

export const createUser = os
	.$context<{ headers: IncomingHttpHeaders }>()
	.use(({ context, next }) => {
		const user = parseJWT(context.headers.authorization?.split(" ")[1] ?? "");

		if (user) {
			return next({ context: { user } });
		}

		throw new ORPCError("UNAUTHORIZED");
	})
	.input(selectUserSchema.omit({ id: true }))
	.handler(async () => {
		return { id: 1, name: "name" };
	});

export const router = {
	user: {
		list: listUser,
		find: findUser,
		create: createUser,
	},
};
