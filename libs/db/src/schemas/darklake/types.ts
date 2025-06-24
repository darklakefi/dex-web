import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
  darklakeTransactions,
  dexTvlAggregates,
  dexVolumeAggregates,
  pairTvlAggregates,
  pairVolumeAggregates,
  tokenTvlAggregates,
  tokenVolumeAggregates,
} from "./schema";

export type DarklakeTransaction = InferSelectModel<typeof darklakeTransactions>;
export type PairVolumeAggregate = InferSelectModel<typeof pairVolumeAggregates>;
export type TokenVolumeAggregate = InferSelectModel<
  typeof tokenVolumeAggregates
>;
export type PairTvlAggregate = InferSelectModel<typeof pairTvlAggregates>;
export type TokenTvlAggregate = InferSelectModel<typeof tokenTvlAggregates>;
export type DexVolumeAggregate = InferSelectModel<typeof dexVolumeAggregates>;
export type DexTvlAggregate = InferSelectModel<typeof dexTvlAggregates>;

export type NewDarklakeTransaction = InferInsertModel<
  typeof darklakeTransactions
>;
export type NewPairVolumeAggregate = InferInsertModel<
  typeof pairVolumeAggregates
>;
export type NewTokenVolumeAggregate = InferInsertModel<
  typeof tokenVolumeAggregates
>;
export type NewPairTvlAggregate = InferInsertModel<typeof pairTvlAggregates>;
export type NewTokenTvlAggregate = InferInsertModel<typeof tokenTvlAggregates>;
export type NewDexVolumeAggregate = InferInsertModel<
  typeof dexVolumeAggregates
>;
export type NewDexTvlAggregate = InferInsertModel<typeof dexTvlAggregates>;
