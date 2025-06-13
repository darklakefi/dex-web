import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const tokens = pgTable("tokens", {
  created_at: timestamp("created_at").defaultNow().notNull(),
  name: varchar("name").notNull(),
  symbol: varchar("symbol").notNull(),
  token_address: varchar("token_address").primaryKey(),
});

export const insertTokensSchema = createInsertSchema(tokens);
export const selectTokensSchema = createSelectSchema(tokens);
