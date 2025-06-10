import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const POSTGRES_HOSTNAME = process.env.POSTGRES_HOSTNAME || "localhost";
const POSTGRES_DB = process.env.POSTGRES_DB || "postgres";
const POSTGRES_USER = process.env.POSTGRES_USER || "postgres";
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || "password";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOSTNAME}:5432/${POSTGRES_DB}?schema=public`;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  dbCredentials: {
    url: DATABASE_URL,
  },
  dialect: "postgresql",
  out: "./libs/orpc/drizzle",
  schema: "./libs/orpc/src/db/schema.ts",
});
