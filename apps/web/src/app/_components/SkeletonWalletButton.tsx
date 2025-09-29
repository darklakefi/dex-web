"use client";

import { SkeletonLoader } from "./SkeletonLoader";

interface SkeletonWalletButtonProps {
  testId?: string;
  "aria-label"?: string;
  className?: string;
  suppressHydrationWarning?: boolean;
}

export function SkeletonWalletButton({
  testId = "skeleton-wallet-button",
  "aria-label": ariaLabel = "Loading wallet button",
  className,
  suppressHydrationWarning = true
}: SkeletonWalletButtonProps = {}) {
  return (
    <button 
      type="button"
      className={className}
      disabled
      aria-label={ariaLabel}
      data-testid={testId}
      suppressHydrationWarning={suppressHydrationWarning}
    >
      <SkeletonLoader 
        variant="wallet" 
        className="h-full w-full rounded-md"
        testId={testId}
        aria-label={ariaLabel}
        suppressHydrationWarning={suppressHydrationWarning}
      />
    </button>
  );
}