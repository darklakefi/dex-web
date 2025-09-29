"use client";
import { Box, Button, Icon } from "@dex-web/ui";
import { truncate } from "@dex-web/utils";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletAdapter, useWalletAddress } from "../../hooks/useWalletCache";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { SkeletonLoader } from "./SkeletonLoader";

interface WalletButtonProps extends React.ComponentProps<typeof Button> {}

export function WalletButton({ ...props }: WalletButtonProps) {
	const router = useRouter();
	const { disconnect } = useWallet();
	const { data: adapter, isLoading: adapterLoading } = useWalletAdapter();
	const { data: address, isLoading: addressLoading } = useWalletAddress();
	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() => {
		setHasMounted(true);
	}, []);

	function handleClick() {
		router.push("/select-wallet");
	}

	if (!hasMounted || adapterLoading || addressLoading) {
		return (
			<div className={twMerge("h-10 w-32", props.className)}>
				<SkeletonLoader variant="wallet" className="h-full w-full" />
			</div>
		);
	}

	if (!adapter) {
		return (
			<Button
				className={twMerge(props.className, "cursor-pointer leading-6")}
				onClick={handleClick}
				variant="primary"
			>
				Connect Wallet
			</Button>
		);
	}

	const currentWalletAdapter = adapter.adapter;

	return (
		<Popover className="">
			{({ open }) => (
				<>
					<PopoverButton
						className={twMerge(
							"cursor-pointer normal-case leading-6",
							open ? "opacity-70" : "opacity-100",
						)}
					>
						<Button
							as="span"
							className="cursor-pointer normal-case leading-6"
							variant="secondary"
						>
							<Image
								alt={currentWalletAdapter.name}
								height={18}
								src={currentWalletAdapter.icon}
								width={18}
							/>
							{truncate(address ?? "")}
						</Button>
					</PopoverButton>
					<PopoverPanel anchor="bottom end" className="z-30 mt-4">
						{({ close }) => (
							<Box className="bg-green-600" padding="sm" shadow="sm">
								<Link
									href="/referrals"
									className="inline-flex min-w-48 cursor-pointer items-center gap-2 px-1 uppercase"
								>
									<Icon name="share" className="size-4" />
									Referrals
								</Link>
								<hr className="border-green-500 px-1" />
								<button
									className="inline-flex min-w-48 cursor-pointer items-center gap-2 px-1 uppercase"
									onClick={() => {
										close();
										disconnect();
									}}
									type="button"
								>
									<Icon name="logout" className="size-4" />
									Disconnect
								</button>
							</Box>
						)}
					</PopoverPanel>
				</>
			)}
		</Popover>
	);
}
