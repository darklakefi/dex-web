CREATE TABLE "pinned_pools" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"pool_address" varchar(44) NOT NULL,
	"pool_name" varchar,
	"token_a" varchar(44) NOT NULL,
	"token_b" varchar(44) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"chain" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"label" varchar NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"wallet_address" varchar(44) NOT NULL
);
