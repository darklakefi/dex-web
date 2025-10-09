"use client";

import { logger } from "../../utils/logger";

const REFERRAL_CODE_KEY = "darklake_referral_code";
const REFERRAL_EXPIRY_KEY = "darklake_referral_expiry";
const DEFAULT_EXPIRY_DAYS = 30;

interface ReferralData {
  incomingCode: string | null;
  timestamp: number;
  expiry: number;
  isAccepted: boolean;
}

const isClient = typeof window !== "undefined";

export function setIncomingReferralCode(
  code: string,
  expiryDays: number = DEFAULT_EXPIRY_DAYS,
): "accepted" | "already_used" {
  if (!isClient || !code) return "already_used";

  const existingCode = getIncomingReferralCode();
  if (existingCode) {
    return "already_used";
  }

  const timestamp = Date.now();
  const expiry = timestamp + expiryDays * 24 * 60 * 60 * 1000;
  const data: ReferralData = {
    expiry,
    incomingCode: code,
    isAccepted: true,
    timestamp,
  };

  try {
    localStorage.setItem(REFERRAL_CODE_KEY, JSON.stringify(data));
    sessionStorage.setItem(REFERRAL_CODE_KEY, JSON.stringify(data));
    return "accepted";
  } catch (error) {
    logger.warn("Failed to store referral code:", error);
    return "already_used";
  }
}

export function getIncomingReferralCode(): string | null {
  if (!isClient) return null;

  const sources = [
    () => sessionStorage.getItem(REFERRAL_CODE_KEY),
    () => localStorage.getItem(REFERRAL_CODE_KEY),
  ];

  for (const getSource of sources) {
    try {
      const stored = getSource();
      if (!stored) continue;

      const data: ReferralData = JSON.parse(stored);

      if (isExpired(data)) {
        clearReferralCode();
        continue;
      }

      return data.incomingCode;
    } catch (error) {
      logger.warn("Failed to parse referral data:", error);
    }
  }

  return null;
}

export function clearReferralCode(): void {
  if (!isClient) return;

  try {
    localStorage.removeItem(REFERRAL_CODE_KEY);
    sessionStorage.removeItem(REFERRAL_CODE_KEY);
    localStorage.removeItem(REFERRAL_EXPIRY_KEY);
  } catch (error) {
    logger.warn("Failed to clear referral code:", error);
  }
}

export function updateExpiry(expiryDays: number = DEFAULT_EXPIRY_DAYS): void {
  const code = getIncomingReferralCode();
  if (code) {
    setIncomingReferralCode(code, expiryDays);
  }
}

export function isExpired(data: ReferralData): boolean {
  return Date.now() > data.expiry;
}

export function getReferralMetadata(): {
  code: string;
  daysRemaining: number;
} | null {
  if (!isClient) return null;

  try {
    const stored =
      localStorage.getItem(REFERRAL_CODE_KEY) ||
      sessionStorage.getItem(REFERRAL_CODE_KEY);

    if (!stored) return null;

    const data: ReferralData = JSON.parse(stored);

    if (isExpired(data)) {
      clearReferralCode();
      return null;
    }

    const daysRemaining = Math.ceil(
      (data.expiry - Date.now()) / (24 * 60 * 60 * 1000),
    );

    return {
      code: data.incomingCode || "",
      daysRemaining,
    };
  } catch (error) {
    logger.warn("Failed to get referral metadata:", error);
    return null;
  }
}

export function isSelfReferral(
  incomingCode: string,
  userReferralCode: string | null,
): boolean {
  if (!userReferralCode) return false;
  return incomingCode === userReferralCode;
}

export const ReferralStorage = {
  clearReferralCode,
  getIncomingReferralCode,
  getReferralMetadata,
  isExpired,
  isSelfReferral,
  setIncomingReferralCode,
  updateExpiry,
};
