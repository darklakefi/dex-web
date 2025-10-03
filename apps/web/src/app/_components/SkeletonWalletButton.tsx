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
  suppressHydrationWarning = true,
}: SkeletonWalletButtonProps = {}) {
  return (
    <button
      aria-label={ariaLabel}
      className={className}
      data-testid={testId}
      disabled
      suppressHydrationWarning={suppressHydrationWarning}
      type="button"
    >
      <SkeletonLoader
        aria-label={ariaLabel}
        className="h-full w-full rounded-md"
        suppressHydrationWarning={suppressHydrationWarning}
        testId={testId}
        variant="wallet"
      />
    </button>
  );
}
