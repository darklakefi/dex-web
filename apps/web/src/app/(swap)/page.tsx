import { Hero, Text } from "@dex-web/ui";
import type { SearchParams } from "nuqs/server";
import { SwapForm } from "./_components/SwapForm";
import { selectedTokensCache } from "./_utils/searchParams";

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<SearchParams>;
}) {
	await selectedTokensCache.parse(await searchParams);

	return (
		<div className="flex flex-col items-center justify-center">
			<Hero
				className="gap-4"
				image="/images/waddles/pose4.png"
				imagePosition="end"
			>
				<div className="flex flex-col gap-3 uppercase">
					<Text.Heading>swap</Text.Heading>
					<div className="flex flex-col">
						<Text.Body2>ANTI-SANDWICH DEFENSE:</Text.Body2>
						<Text.Body2 className="text-green-300">
							Value preservation system active.
						</Text.Body2>
					</div>
				</div>
			</Hero>
			<SwapForm />
		</div>
	);
}
