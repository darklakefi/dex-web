"use client";
import { client } from "@dex-web/orpc";
import { Box, Button, Icon } from "@dex-web/ui";
import { truncate } from "@dex-web/utils";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { getFirstConnectedWalletAddress } from "../_utils/getFirstConnectedWalletAddress";
import { ClientOnly } from "./ClientOnly";

export function ConnectedWalletButton() {
	return (
		<ClientOnly
			fallback={
				<Button
					as="div"
					className="cursor-pointer leading-6"
					loading={true}
					variant="secondary"
				>
					Loading...
				</Button>
			}
		>
			<ConnectedWalletContent />
		</ClientOnly>
	);
}

function ConnectedWalletContent() {
	const { wallet, disconnect } = useWallet();

	const createTorqueReferralMutation = useMutation({
		mutationFn: (input: { userId: string; referralCode: string }) => {
			return client.integrations.createTorqueReferral(input);
		},
		onSuccess: (data) => {
			if (data.success) {
				console.log("Torque referral created successfully:", {
					referralCode: data.referralCode,
					publicKey: data.publicKey,
					vanity: data.vanity,
				});
			} else {
				console.error("Torque API returned error:", data.error);
			}
		},
		onError: (error) => {
			console.error("Network/client error creating Torque referral:", error);
		},
	});

	if (!wallet || !wallet.adapter) {
		return (
			<Button
				as="div"
				className="cursor-pointer leading-6"
				loading={true}
				variant="secondary"
			>
				Loading...
			</Button>
		);
	}

	const currentWalletAdapter = wallet.adapter;
	const walletAddress = getFirstConnectedWalletAddress(currentWalletAdapter);

	const handleCreateTorqueReferral = () => {
		if (!walletAddress) {
			console.error("No wallet address found");
			return;
		}

		createTorqueReferralMutation.mutate({
			userId: walletAddress,
			referralCode: "default-referral",
		});
	};

	return (
		<Popover className="">
			{({ open }) => (
				<>
					<PopoverButton
						as="div"
						className={open ? "opacity-70" : "opacity-100"}
					>
						<Button
							as="div"
							className="cursor-pointer normal-case leading-6"
							variant="secondary"
						>
							<Image
								alt={currentWalletAdapter.name}
								height={18}
								src={currentWalletAdapter.icon}
								width={18}
							/>
							{truncate(
								getFirstConnectedWalletAddress(currentWalletAdapter) ?? "",
							)}
						</Button>
					</PopoverButton>
					<PopoverPanel anchor="bottom end" className="z-30 mt-4">
						{({ close }) => (
							<Box className="bg-green-600" padding="sm" shadow="sm">
								<Link
									href="/referrals"
									className="cursor-pointer uppercase min-w-48 inline-flex items-center gap-2 px-1"
								>
									<Icon name="share" className="size-4" />
									Referrals
								</Link>
								<hr className="border-green-500 px-1" />
								<a
									className="cursor-pointer uppercase min-w-48 inline-flex items-center gap-2 px-1"
									onClick={() => {
										close();
										disconnect();
									}}
								>
									<Icon name="logout" className="size-4" />
									Disconnect
								</a>
							</Box>
						)}
					</PopoverPanel>
				</>
			)}
		</Popover>
	);
}
