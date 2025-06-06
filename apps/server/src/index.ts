import { createHTTPServer } from "@trpc/server/adapters/standalone";
import "dotenv/config";
import { z } from "zod";
import { db } from "./db";
import { usersTable } from "./db/schema";
import { publicProcedure, router } from "./trpc";

const appRouter: ReturnType<typeof router> = router({
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

const server = createHTTPServer({
  router: appRouter,
});

export type AppRouter = typeof appRouter;

server.listen(3000);
