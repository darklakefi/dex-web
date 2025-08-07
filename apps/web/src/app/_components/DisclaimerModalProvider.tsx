"use client";

import { DisclaimerModal, useDisclaimerModal } from "./DisclaimerModal";

/**
 * Provider component that manages the disclaimer modal state
 * and renders the modal when needed
 */
export function DisclaimerModalProvider() {
  const { isModalOpen, handleAccept } = useDisclaimerModal();

  return <DisclaimerModal isOpen={isModalOpen} onAccept={handleAccept} />;
}
