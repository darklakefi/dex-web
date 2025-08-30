import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { blockQueue } from "./blockQueue";
import type { config } from "./config";
import type { pinnedPools } from "./pinnedPools";
import type { sandwichEvents } from "./sandwichEvents";
import type { tokenMetadata } from "./tokenMetadata";
import type { tokens } from "./tokens";
import type { wallets } from "./wallets";

export type Config = InferSelectModel<typeof config>;
export type NewConfig = InferInsertModel<typeof config>;

export type BlockQueue = InferSelectModel<typeof blockQueue>;
export type NewBlockQueue = InferInsertModel<typeof blockQueue>;

export type SandwichEvent = InferSelectModel<typeof sandwichEvents>;
export type NewSandwichEvent = InferInsertModel<typeof sandwichEvents>;

export type TokenMetadata = InferSelectModel<typeof tokenMetadata>;
export type NewTokenMetadata = InferInsertModel<typeof tokenMetadata>;

export type Token = InferSelectModel<typeof tokens>;
export type NewToken = InferInsertModel<typeof tokens>;

export type BlockQueueStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export type WalletRow = InferSelectModel<typeof wallets>;
export type NewWalletRow = InferInsertModel<typeof wallets>;

export type PinnedPoolRow = InferSelectModel<typeof pinnedPools>;
export type NewPinnedPoolRow = InferInsertModel<typeof pinnedPools>;
