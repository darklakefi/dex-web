"use client";

import { Box, Text } from "@dex-web/ui";
import { SkeletonLoader } from "./SkeletonLoader";

interface SkeletonTokenInputProps {
  testId?: string;
  "aria-label"?: string;
  label?: string;
}

export function SkeletonTokenInput({
  testId: _testId = "skeleton-token-input",
  "aria-label": _ariaLabel = "Loading token input",
  label = "LOADING",
}: SkeletonTokenInputProps = {}) {
  return (
    <Box className="flex-row border border-green-400 bg-green-600 pt-3 pb-3">
      <div className="flex flex-col gap-3">
        <Text.Body2 as="label" className="mb-3 block text-green-300 uppercase">
          {label}
        </Text.Body2>
        <div className="flex items-center gap-2">
          <SkeletonLoader className="h-8 w-24" variant="text" />
          <SkeletonLoader className="h-4 w-16" variant="text" />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-end gap-3">
        <div className="mb-3 flex gap-3">
          <SkeletonLoader className="h-4 w-28" variant="balance" />
          <SkeletonLoader className="h-4 w-12" variant="text" />
          <SkeletonLoader className="h-4 w-12" variant="text" />
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <SkeletonLoader className="h-10 w-32" variant="input" />
          </div>
          <SkeletonLoader className="mt-1 h-4 w-20" variant="text" />
        </div>
      </div>
    </Box>
  );
}
