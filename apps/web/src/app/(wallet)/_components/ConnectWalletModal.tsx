"use client";

import { Box, Button, Modal, Text } from "@dex-web/ui";
import { usePathname, useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

export function ConnectWalletModal() {
  const router = useRouter();
  const pathname = usePathname();
  const backPath = pathname.endsWith("/connect-wallet")
    ? pathname.slice(0, -14)
    : pathname.includes("/connect-wallet/")
      ? pathname.replace("/connect-wallet/", "/")
      : "/";

  const handleClose = () => {
    router.push(backPath);
  };

  return (
    <Modal onClose={() => router.push(backPath)}>
      <Box
        className={twMerge(
          "my-10 max-w-md drop-shadow-sm",
          "z-10 max-h-full flex-col gap-4 shadow-green-600 transition-transform duration-150",
        )}
        shadow="md"
      >
        <div className="flex w-full justify-between border-green-600 border-b">
          <Text.Heading>connect wallet</Text.Heading>
          <Button icon="times" onClick={handleClose} />
        </div>
        <div>
          <Text.Body2>List of wallets</Text.Body2>
        </div>
      </Box>
    </Modal>
  );
}
