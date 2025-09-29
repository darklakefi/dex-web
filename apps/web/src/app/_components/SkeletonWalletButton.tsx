"use client";

import { SkeletonLoader } from "./SkeletonLoader";

interface SkeletonWalletButtonProps {
  testId?: string;
  "aria-label"?: string;
  className?: string;
}

export function SkeletonWalletButton({
  testId = "skeleton-wallet-button",
  "aria-label": ariaLabel = "Loading wallet button",
  className
}: SkeletonWalletButtonProps = {}) {
  return (
    <div className={className}>
      <SkeletonLoader 
        variant="wallet" 
        className="h-full w-full rounded-md"
        testId={testId}
        aria-label={ariaLabel}
      />
    </div>
  );
}