"use client";

import { Text } from "@dex-web/ui";

interface CalculationLoadingIndicatorProps {
  message?: string;
  className?: string;
}

export function CalculationLoadingIndicator({
  message = "Calculating optimal amounts...",
  className = "",
}: CalculationLoadingIndicatorProps) {
  return (
    <div className={`flex items-center justify-center gap-2 py-2 ${className}`}>
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-300 border-t-transparent" />
      <Text.Body2 className="text-green-300">{message}</Text.Body2>
    </div>
  );
}

interface InlineCalculationIndicatorProps {
  className?: string;
}

export function InlineCalculationIndicator({
  className = "",
}: InlineCalculationIndicatorProps) {
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div className="h-3 w-3 animate-spin rounded-full border border-green-300 border-t-transparent" />
      <span className="text-green-300 text-xs">Calculating...</span>
    </div>
  );
}
