import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const config = pgTable("config", {
  key: varchar("key").primaryKey().unique(),
  value: varchar("value").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const insertConfigSchema = createInsertSchema(config);
export const selectConfigSchema = createSelectSchema(config);
