"use client";

import type { FC, ReactNode } from "react";
import { useState } from "react";
import type { WalletModalProps } from "./ConnectWalletModal";
import { WalletModal } from "./ConnectWalletModal";
import { WalletModalContext } from "./useWalletModal";

export interface WalletModalProviderProps extends WalletModalProps {
  children: ReactNode;
}

export const WalletModalProvider: FC<WalletModalProviderProps> = ({
  children,
  ...props
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <WalletModalContext.Provider
      value={{
        setVisible,
        visible,
      }}
    >
      {children}
      {visible && <WalletModal {...props} />}
    </WalletModalContext.Provider>
  );
};
