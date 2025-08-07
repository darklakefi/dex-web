"use client";

import { Button, Modal } from "@dex-web/ui";
import { useEffect, useState } from "react";
import { getCookie, setCookie } from "../_utils/cookies";

const DISCLAIMER_COOKIE_NAME = "disclaimer_accepted";
const DISCLAIMER_COOKIE_EXPIRY_DAYS = 365; // 1 year

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

function DisclaimerModalContent({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="mx-4 max-w-md rounded-lg border border-gray-700 bg-gray-900 p-6 text-white">
      <div className="mb-4">
        <h2 className="mb-2 font-bold text-green-100 text-xl">
          Risk Disclaimer
        </h2>
        <div className="space-y-3 text-gray-300 text-sm">
          <p>
            Trading digital assets involves significant risk and may not be
            suitable for all investors. The value of digital assets can be
            highly volatile and may result in substantial losses.
          </p>
          <p>
            Please carefully consider your investment experience, and risk
            tolerance before trading.
          </p>
          <p className="font-medium text-green-200">
            By clicking "I Understand", you acknowledge that you have read and
            understood these risks.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          className="px-6 py-2"
          onClick={onAccept}
          text="I Understand"
          variant="primary"
        />
      </div>
    </div>
  );
}

export function DisclaimerModal({ isOpen, onAccept }: DisclaimerModalProps) {
  if (!isOpen) return null;

  return (
    <Modal onClose={() => {}}>
      <DisclaimerModalContent onAccept={onAccept} />
    </Modal>
  );
}

export function useDisclaimerModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Check if disclaimer has been accepted
    const hasAccepted = getCookie(DISCLAIMER_COOKIE_NAME);
    if (!hasAccepted) {
      setIsModalOpen(true);
    }
  }, []);

  const handleAccept = () => {
    // Set cookie to remember acceptance
    setCookie(DISCLAIMER_COOKIE_NAME, "true", {
      expires: DISCLAIMER_COOKIE_EXPIRY_DAYS,
      path: "/",
      sameSite: "lax",
    });
    setIsModalOpen(false);
  };

  return {
    handleAccept,
    isModalOpen,
  };
}
