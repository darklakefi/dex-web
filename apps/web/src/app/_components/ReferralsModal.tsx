"use client";

import { tanstackClient } from "@dex-web/orpc";
import { Box, Button, Icon, Modal, Text } from "@dex-web/ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import { selectedTokensParsers } from "../_utils/searchParams";
import { toast } from "../_utils/toast";
import { useReferralCode } from "./ReferralCodeProvider";

export function ReferralsModal() {
	const router = useRouter();
	const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
		selectedTokensParsers,
	);
	const {
		incomingReferralCode,
		userReferralCode,
		setUserReferralCode,
		processUrlReferral,
	} = useReferralCode();

	const { data: referrerData } = useSuspenseQuery(
		tanstackClient.integrations.resolveTorqueReferral.queryOptions({
			input: {
				referralCode: incomingReferralCode || "",
			},
		}),
	);

	const handleClose = () => {
		const params = new URLSearchParams();
		params.set("tokenAAddress", tokenAAddress);
		params.set("tokenBAddress", tokenBAddress);
		if (incomingReferralCode) {
			params.set("ref", incomingReferralCode);
		}
		router.push(`/?${params.toString()}`);
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(
			`${process.env.NEXT_PUBLIC_APP_URL}/referral/${currentUserReferralCode}`,
		);
		toast({
			title: "Referral link copied to clipboard",
			variant: "success",
			description: `${process.env.NEXT_PUBLIC_APP_URL}/referral/${currentUserReferralCode}`,
		});
	};

	const { publicKey } = useWallet();

	const { data } = useSuspenseQuery(
		tanstackClient.integrations.createTorqueReferral.queryOptions({
			input: {
				userId: publicKey?.toBase58() ?? "",
			},
		}),
	);

	const currentUserReferralCode = userReferralCode || data?.referralCode;
	return (
		<Modal onClose={handleClose}>
			<Box className="fixed right-0 flex h-full max-h-full w-full max-w-md drop-shadow-xl">
				<div className="w-full">
					<div className="mb-3 flex justify-between border-green-600 border-b pb-3">
						<Text className="font-bold text-2xl" variant="heading">
							Referrals
						</Text>
						<button
							className="cursor-pointer"
							onClick={handleClose}
							type="button"
						>
							<Icon className="size-6" name="times" />
						</button>
					</div>
					<div className="space-y-4">
						<Box background="highlight">
							<Text.Body2 className="text-green-300">
								Share your referral link:
							</Text.Body2>
							<Text.Body2 className="flex items-center justify-between gap-2">
								{`${process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "")}/referral/${currentUserReferralCode || ""}`}
								<Button
									variant="secondary"
									onClick={handleCopy}
									disabled={!currentUserReferralCode}
								>
									Copy
								</Button>
							</Text.Body2>
						</Box>

						{incomingReferralCode && (
							<Text.Body2 className="flex items-center justify-between gap-2 text-green-300">
								Referred by:
								<span className="text-green-200">{incomingReferralCode}</span>
							</Text.Body2>
						)}
					</div>
				</div>
			</Box>
		</Modal>
	);
}
