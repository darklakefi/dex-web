import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const config = pgTable("config", {
  created_at: timestamp("created_at").defaultNow().notNull(),
  key: varchar("key").primaryKey().unique(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  value: varchar("value").notNull(),
});

export const insertConfigSchema = createInsertSchema(config);
export const selectConfigSchema = createSelectSchema(config);
