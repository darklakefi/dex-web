import { Button, Icon, type IconName, Text } from "@dex-web/ui";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import type { Wallet } from "@solana/wallet-adapter-react";
import type { FC, MouseEventHandler } from "react";

export interface WalletListItemProps {
  handleClick: MouseEventHandler<HTMLButtonElement>;
  wallet: Wallet;
  connecting?: boolean;
}

export const WalletListItem: FC<WalletListItemProps> = ({
  handleClick,
  wallet,
  connecting = false,
}) => {
  return (
    <Button.Primary
      className="flex w-full cursor-pointer items-center justify-between gap-3 bg-green-800 p-3 hover:bg-green-600"
      onClick={handleClick}
      type="button"
    >
      <div className="flex items-center gap-3">
        <Icon
          className="size-8 text-green-200"
          name={wallet.adapter.name.toLowerCase() as IconName}
        />
        <Text.Body2>{wallet.adapter.name}</Text.Body2>
      </div>
      {wallet.readyState === WalletReadyState.Installed && !connecting && (
        <Text.Body2 className="text-green-400">Detected</Text.Body2>
      )}
      {connecting && (
        <Icon
          className="size-4 animate-spin text-green-100"
          name="loading-stripe"
        />
      )}
    </Button.Primary>
  );
};
