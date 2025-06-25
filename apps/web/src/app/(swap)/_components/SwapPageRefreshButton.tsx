"use client";

import { Icon } from "@dex-web/ui";

interface SwapPageRefreshButtonProps {
	handleRefresh: () => void;
}

export function SwapPageRefreshButton({
	handleRefresh,
}: SwapPageRefreshButtonProps) {
	function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
		e.preventDefault();

		handleRefresh();
	}

	return (
		<button
			className="inline-flex items-center justify-center p-2  bg-green-800 text-green-300  hover:text-green-200  focus:text-green-200"
			onClick={handleClick}
			type="button"
		>
			<Icon className="size-5" name="refresh" />
		</button>
	);
}
