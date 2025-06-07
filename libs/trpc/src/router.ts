import { initTRPC } from "@trpc/server";
import "dotenv/config";
import superjson from "superjson";
import { z } from "zod";
import type { Context } from "./context";
import { db } from "./db";
import { usersTable } from "./db/schema";

const trpc = initTRPC.context<Context>().create({
  transformer: superjson,
});
export const router = trpc.router;

export const publicProcedure = trpc.procedure;

export const appRouter: ReturnType<typeof router> = router({
  userList: publicProcedure.query(async () => {
    const users = await db.select().from(usersTable);
    return users;
  }),
  createUser: publicProcedure
    .input(z.object({ name: z.string(), age: z.number(), email: z.string() }))
    .mutation(async ({ input }) => {
      const user = await db.insert(usersTable).values(input);
      return user;
    }),
});

export type AppRouter = typeof appRouter;
