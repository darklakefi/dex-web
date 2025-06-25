import { appRouter } from "@dex-web/orpc";
import type { GetTokenBalanceOutput } from "@dex-web/orpc/schemas/helius";
import type { GetSwapDetailsOutput } from "@dex-web/orpc/schemas/swaps";
import type { GetTokenDetailsOutput } from "@dex-web/orpc/schemas/tokens";
import { randBetweenDate } from "@ngneat/falso";
import { implement, unlazyRouter } from "@orpc/server";

const unlazyAppRouter = await unlazyRouter(appRouter);
const fakeGetSwapDetails = unlazyAppRouter.getSwapDetails;

export const getMockSwapDetails = (
	overrides: Partial<GetSwapDetailsOutput> = {},
): GetSwapDetailsOutput => ({
	buyAmount: Number(process.env.MOCK_OUT_AMOUNT || "1337"),
	buyBalance: 1000,
	buyToken: {
		address: "buy-token-address",
		symbol: "BUY",
		value: "buy-token-value",
	},
	estimatedFeesUsd: 0.05,
	exchangeRate: 1.337,
	mevProtectionEnabled: false,
	priceImpactPercentage: 0.1,
	sellAmount: 1,
	sellBalance: 1000,
	sellToken: {
		address: "sell-token-address",
		symbol: "SELL",
		value: "sell-token-value",
	},
	slippageTolerancePercentage: 0.5,
	swapProgressStep: 1,
	swapStatus: "pending",
	swapType: "swap",
	updatedAt: randBetweenDate({
		from: new Date("2025-01-01"),
		to: new Date("2025-06-25"),
	}).toISOString(),
	userAddress: "user-address",
	...overrides,
});

export const mockHandlers = {
	getSwapDetails: implement(fakeGetSwapDetails).handler(() => {
		return getMockSwapDetails();
	}),

	getTokenDetails: implement(unlazyAppRouter.getTokenDetails).handler(
		({ input }) => {
			return {
				address: input.address,
				imageUrl: "https://example.com/logo.png",
				name: "Mock Token",
				symbol: "MOCK",
				value: "mock-token-value",
			} satisfies GetTokenDetailsOutput;
		},
	),

	"helius.getTokenBalance": implement(
		unlazyAppRouter.helius.getTokenBalance,
	).handler(({ input }) => {
		return {
			assets: [],
			ownerAddress: input.ownerAddress,
			tokenAccounts: [],
			total: 0,
		} satisfies GetTokenBalanceOutput;
	}),
};

export const mockRouter = {
	...unlazyAppRouter,
	getSwapDetails: mockHandlers.getSwapDetails,
	getTokenDetails: mockHandlers.getTokenDetails,
	helius: {
		...unlazyAppRouter.helius,
		getTokenBalance: mockHandlers["helius.getTokenBalance"],
	},
};
