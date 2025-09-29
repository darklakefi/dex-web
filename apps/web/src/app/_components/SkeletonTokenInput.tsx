"use client";

import { SkeletonLoader } from "./SkeletonLoader";

interface SkeletonTokenInputProps {
  testId?: string;
  "aria-label"?: string;
}

export function SkeletonTokenInput({
  testId = "skeleton-token-input",
  "aria-label": ariaLabel = "Loading token input"
}: SkeletonTokenInputProps = {}) {
  return (
    <SkeletonLoader
      variant="tokenInput"
      className="min-h-24"
      testId={testId}
      aria-label={ariaLabel}
    />
  );
}