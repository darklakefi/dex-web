"use client";

import { Box, Button, Modal, Text } from "@dex-web/ui";
import { useEffect, useState } from "react";
import { getCookie, setCookie } from "../_utils/cookies";

const DISCLAIMER_COOKIE_NAME = "disclaimer_accepted";
const DISCLAIMER_COOKIE_EXPIRY_DAYS = 365; // 1 year

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  country?: string | null;
}

function DisclaimerModalContent({
  onAccept,
  country,
}: {
  onAccept: () => void;
  country?: string | null;
}) {
  return (
    <Box className="mx-4 flex max-w-md gap-5" shadow="xl">
      <Text.Heading className="">Risk Disclaimer</Text.Heading>
      <div className="space-y-3">
        <Text.Body2 className="text-green-300">
          Trading digital assets involves significant risk and may not be
          suitable for all investors. The value of digital assets can be highly
          volatile and may result in substantial losses.
        </Text.Body2>
        <Text.Body2 className="text-green-300">
          Please carefully consider your investment experience, and risk
          tolerance before trading.
        </Text.Body2>
        {country === "GB" && (
          <Text.Body2 className="text-green-300">
            <strong>UK Users:</strong> This product is not intended to be used
            in the United Kingdom. By proceeding, you acknowledge that you are
            accessing this service from outside the UK or are aware of the
            regulatory restrictions in your jurisdiction.
          </Text.Body2>
        )}
        <Text.Body2 className="text-green-200">
          By clicking &quot;I Understand&quot;, you acknowledge that you have
          read and understood these risks.
        </Text.Body2>
      </div>
      <div className="flex w-full justify-end">
        <Button
          className="w-full cursor-pointer py-3 leading-6"
          onClick={onAccept}
          text="I Understand"
          variant="primary"
        />
      </div>
    </Box>
  );
}

export function DisclaimerModal({
  isOpen,
  onAccept,
  country,
}: DisclaimerModalProps) {
  if (!isOpen) return null;

  return (
    <Modal onClose={() => {}}>
      <DisclaimerModalContent country={country} onAccept={onAccept} />
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
