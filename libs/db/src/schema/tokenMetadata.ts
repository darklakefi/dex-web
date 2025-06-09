import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const tokenMetadata = pgTable("token_metadata", {
  token_address: varchar("token_address").primaryKey(),
  name: varchar("name").notNull(),
  symbol: varchar("symbol").notNull(),
  decimals: integer("decimals").notNull(),
  uri: varchar("uri"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const insertTokenMetadataSchema = createInsertSchema(tokenMetadata);
export const selectTokenMetadataSchema = createSelectSchema(tokenMetadata);
