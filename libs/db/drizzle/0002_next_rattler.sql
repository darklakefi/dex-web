ALTER TABLE "pinned_pools" ADD COLUMN "apr" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "pinned_pools" ADD COLUMN "chain" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "pinned_pools" ADD COLUMN "name" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "pinned_pools" ADD COLUMN "token_x_mint" varchar(44) NOT NULL;--> statement-breakpoint
ALTER TABLE "pinned_pools" ADD COLUMN "token_x_symbol" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "pinned_pools" ADD COLUMN "token_y_mint" varchar(44) NOT NULL;--> statement-breakpoint
ALTER TABLE "pinned_pools" ADD COLUMN "token_y_symbol" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "pinned_pools" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "pinned_pools" DROP COLUMN "pool_address";--> statement-breakpoint
ALTER TABLE "pinned_pools" DROP COLUMN "pool_name";--> statement-breakpoint
ALTER TABLE "pinned_pools" DROP COLUMN "token_a";--> statement-breakpoint
ALTER TABLE "pinned_pools" DROP COLUMN "token_b";--> statement-breakpoint
ALTER TABLE "pinned_pools" ADD CONSTRAINT "pinned_pools_token_pair_unique" UNIQUE("token_x_mint","token_y_mint");