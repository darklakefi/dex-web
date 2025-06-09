import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { blockQueue } from "./blockQueue";
import type { config } from "./config";
import type { sandwichEvents } from "./sandwichEvents";
import type { tokenMetadata } from "./tokenMetadata";
import type { user } from "./user";

export type Config = InferSelectModel<typeof config>;
export type NewConfig = InferInsertModel<typeof config>;

export type BlockQueue = InferSelectModel<typeof blockQueue>;
export type NewBlockQueue = InferInsertModel<typeof blockQueue>;

export type SandwichEvent = InferSelectModel<typeof sandwichEvents>;
export type NewSandwichEvent = InferInsertModel<typeof sandwichEvents>;

export type TokenMetadata = InferSelectModel<typeof tokenMetadata>;
export type NewTokenMetadata = InferInsertModel<typeof tokenMetadata>;

export type BlockQueueStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export type User = InferSelectModel<typeof user>;
export type NewUser = InferInsertModel<typeof user>;
