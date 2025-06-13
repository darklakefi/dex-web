CREATE TYPE "public"."BlockQueueStatus" AS ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "block_queue" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"slot" bigint PRIMARY KEY NOT NULL,
	"status" "BlockQueueStatus" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "block_queue_slot_unique" UNIQUE("slot")
);
--> statement-breakpoint
CREATE TABLE "config" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"key" varchar PRIMARY KEY NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"value" varchar NOT NULL,
	CONSTRAINT "config_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "sandwich_events" (
	"added_at" timestamp DEFAULT now() NOT NULL,
	"attacker_address" varchar NOT NULL,
	"dex_name" varchar NOT NULL,
	"lp_address" varchar NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"slot" bigint NOT NULL,
	"sol_amount_drained" bigint NOT NULL,
	"sol_amount_swap" bigint NOT NULL,
	"token_address" varchar NOT NULL,
	"tx_hash_attacker_buy" varchar NOT NULL,
	"tx_hash_attacker_sell" varchar NOT NULL,
	"tx_hash_victim_swap" varchar NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"victim_address" varchar NOT NULL,
	CONSTRAINT "sandwich_events_tx_hash_victim_swap_token_address_attacker_address_victim_address_pk" PRIMARY KEY("tx_hash_victim_swap","token_address","attacker_address","victim_address")
);
--> statement-breakpoint
CREATE TABLE "token_metadata" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"decimals" integer NOT NULL,
	"name" varchar NOT NULL,
	"symbol" varchar NOT NULL,
	"token_address" varchar PRIMARY KEY NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"uri" varchar
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"image_url" varchar NOT NULL,
	"name" varchar NOT NULL,
	"symbol" varchar NOT NULL,
	"token_address" varchar PRIMARY KEY NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "occurred_at_idx" ON "sandwich_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "token_address_idx" ON "sandwich_events" USING btree ("token_address");--> statement-breakpoint
CREATE INDEX "victim_address_idx" ON "sandwich_events" USING btree ("victim_address");--> statement-breakpoint
CREATE INDEX "victim_address_occurred_at_idx" ON "sandwich_events" USING btree ("victim_address","occurred_at");