"use client";

import { DisclaimerModal, useDisclaimerModal } from "./DisclaimerModal";

/**
 * Provider component that manages the disclaimer modal state
 * and renders the modal when needed
 */
interface DisclaimerModalProviderProps {
  country?: string | null;
}

export function DisclaimerModalProvider({
  country,
}: DisclaimerModalProviderProps) {
  const { isModalOpen, handleAccept } = useDisclaimerModal();

  return (
    <DisclaimerModal
      country={country}
      isOpen={isModalOpen}
      onAccept={handleAccept}
    />
  );
}
