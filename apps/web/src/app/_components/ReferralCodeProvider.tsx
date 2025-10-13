"use client";

import { tanstackClient } from "@dex-web/orpc";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useWalletPublicKey } from "../../hooks/useWalletCache";
import { ReferralStorage } from "../_utils/referralStorage";
import { toast } from "../_utils/toast";

interface ReferralCodeContextType {
  incomingReferralCode: string | null;
  userReferralCode: string | null;
  setIncomingReferralCode: (code: string) => void;
  setUserReferralCode: (code: string) => void;
  clearReferralCode: () => void;
  isLoading: boolean;
  metadata: { code: string; daysRemaining: number } | null;
  processUrlReferral: (code: string) => void;
}

const ReferralCodeContext = createContext<ReferralCodeContextType | undefined>(
  undefined,
);

interface ReferralCodeProviderProps {
  children: React.ReactNode;
}

export function ReferralCodeProvider({ children }: ReferralCodeProviderProps) {
  const searchParams = useSearchParams();
  const urlReferralCode = searchParams.get("ref");
  const { data: publicKey } = useWalletPublicKey();

  const hasProcessedUrlRef = useRef(false);
  const processedUrlRef = useRef<string | null>(null);

  const { data: userReferralData, isLoading: isUserReferralLoading } = useQuery(
    {
      ...tanstackClient.integrations.createTorqueReferral.queryOptions({
        context: { cache: "force-cache" as RequestCache },
        input: {
          userId: publicKey?.toBase58?.() ?? "",
        },
      }),
      enabled: !!publicKey,
    },
  );

  const userReferralCode = userReferralData?.referralCode ?? null;

  const storedReferralCode = useMemo(() => {
    if (urlReferralCode) return null;
    return ReferralStorage.getIncomingReferralCode();
  }, [urlReferralCode]);

  const metadata = ReferralStorage.getReferralMetadata();

  const isLoading = isUserReferralLoading;

  const incomingReferralCode = storedReferralCode;

  const setIncomingReferralCode = useCallback((code: string) => {
    if (!code) return;
    ReferralStorage.setIncomingReferralCode(code);
  }, []);

  const setUserReferralCode = useCallback((_code: string) => {}, []);

  const clearReferralCode = useCallback(() => {
    ReferralStorage.clearReferralCode();
  }, []);

  const processUrlReferral = useCallback(
    (code: string) => {
      if (ReferralStorage.isSelfReferral(code, userReferralCode)) {
        toast({
          description: "YOU CANNOT REFER YOURSELF",
          title: "REFERRAL INVALID",
          variant: "error",
        });
        return;
      }

      const result = ReferralStorage.setIncomingReferralCode(code);

      if (result === "accepted") {
        toast({
          description: `YOU GOT REFERRED BY ${code}`,
          title: "REFERRAL ACCEPTED",
          variant: "success",
        });
      }
    },
    [userReferralCode],
  );

  useEffect(() => {
    if (
      !urlReferralCode ||
      hasProcessedUrlRef.current ||
      processedUrlRef.current === urlReferralCode ||
      !publicKey ||
      userReferralCode === null
    ) {
      return;
    }

    hasProcessedUrlRef.current = true;
    processedUrlRef.current = urlReferralCode;

    processUrlReferral(urlReferralCode);
  }, [urlReferralCode, publicKey, userReferralCode, processUrlReferral]);

  const value = useMemo(
    (): ReferralCodeContextType => ({
      clearReferralCode,
      incomingReferralCode,
      isLoading,
      metadata,
      processUrlReferral,
      setIncomingReferralCode,
      setUserReferralCode,
      userReferralCode,
    }),
    [
      incomingReferralCode,
      userReferralCode,
      setIncomingReferralCode,
      setUserReferralCode,
      clearReferralCode,
      isLoading,
      metadata,
      processUrlReferral,
    ],
  );

  return (
    <ReferralCodeContext.Provider value={value}>
      {children}
    </ReferralCodeContext.Provider>
  );
}

export function useReferralCode(): ReferralCodeContextType {
  const context = useContext(ReferralCodeContext);

  if (context === undefined) {
    throw new Error(
      "useReferralCode must be used within a ReferralCodeProvider",
    );
  }

  return context;
}
