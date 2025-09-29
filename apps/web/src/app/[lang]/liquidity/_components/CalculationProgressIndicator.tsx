"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@dex-web/ui";

interface CalculationProgressIndicatorProps {
  isCalculating: boolean;
  hasApproximateResult: boolean;
  isWorkerReady: boolean;
  workerError?: string | null;
  className?: string;
}

interface ProgressState {
  stage: "idle" | "approximate" | "exact" | "complete" | "error";
  progress: number;
  message: string;
}

export function CalculationProgressIndicator({
  isCalculating,
  hasApproximateResult,
  isWorkerReady,
  workerError,
  className = "",
}: CalculationProgressIndicatorProps) {
  const [progressState, setProgressState] = useState<ProgressState>({
    stage: "idle",
    progress: 0,
    message: "",
  });

  // Update progress state based on calculation status
  useEffect(() => {
    if (workerError) {
      setProgressState({
        stage: "error",
        progress: 0,
        message: "Calculation failed - using fallback",
      });
      return;
    }

    if (!isCalculating) {
      setProgressState({
        stage: "idle",
        progress: 0,
        message: "",
      });
      return;
    }

    if (hasApproximateResult) {
      setProgressState({
        stage: "exact",
        progress: 75,
        message: "Getting exact amounts...",
      });
    } else {
      setProgressState({
        stage: "approximate",
        progress: 25,
        message: isWorkerReady ? "Calculating..." : "Loading...",
      });
    }
  }, [isCalculating, hasApproximateResult, isWorkerReady, workerError]);

  // Animate progress for better UX
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (progressState.progress === 0) {
      setAnimatedProgress(0);
      return;
    }

    const startProgress = animatedProgress;
    const targetProgress = progressState.progress;
    const duration = 300; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentProgress = startProgress + (targetProgress - startProgress) * easeOut;

      setAnimatedProgress(currentProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [progressState.progress, animatedProgress]);

  // Auto-hide after completion
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isCalculating) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isCalculating]);

  const getStageIcon = useCallback(() => {
    switch (progressState.stage) {
      case "approximate":
        return "clock";
      case "exact":
        return "refresh-cw";
      case "complete":
        return "check";
      case "error":
        return "alert-triangle";
      default:
        return "clock";
    }
  }, [progressState.stage]);

  const getStageColor = useCallback(() => {
    switch (progressState.stage) {
      case "approximate":
        return "text-yellow-500";
      case "exact":
        return "text-blue-500";
      case "complete":
        return "text-green-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-400";
    }
  }, [progressState.stage]);

  if (!isVisible || progressState.stage === "idle") {
    return null;
  }

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2
        bg-gray-800/50 rounded-lg border border-gray-700/50
        transition-all duration-300 ease-out
        ${className}
      `}
    >
      {/* Progress bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon
            name={getStageIcon()}
            className={`size-3 ${getStageColor()} ${
              progressState.stage === "approximate" || progressState.stage === "exact"
                ? "animate-spin"
                : ""
            }`}
          />
          <span className="text-xs text-gray-300 truncate">
            {progressState.message}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-1">
          <div
            className={`
              h-1 rounded-full transition-all duration-300 ease-out
              ${progressState.stage === "error"
                ? "bg-red-500"
                : progressState.stage === "complete"
                ? "bg-green-500"
                : "bg-blue-500"
              }
            `}
            style={{
              width: `${animatedProgress}%`,
            }}
          />
        </div>
      </div>

      {/* Worker status indicator */}
      {!isWorkerReady && !workerError && (
        <div className="flex items-center gap-1">
          <div className="size-2 animate-pulse rounded-full bg-yellow-500" />
          <span className="text-gray-400 text-xs">Worker loading</span>
        </div>
      )}

      {/* Approximate result indicator */}
      {hasApproximateResult && (
        <div className="flex items-center gap-1">
          <div className="size-2 rounded-full bg-orange-500" />
          <span className="text-orange-400 text-xs">~</span>
        </div>
      )}
    </div>
  );
}

// Simplified version for inline use
export function MiniCalculationIndicator({
  isCalculating,
  hasApproximateResult,
  className = "",
}: Pick<CalculationProgressIndicatorProps, "isCalculating" | "hasApproximateResult" | "className">) {
  if (!isCalculating && !hasApproximateResult) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {isCalculating && (
        <Icon
          name="refresh-cw"
          className="size-3 animate-spin text-blue-500"
        />
      )}
      {hasApproximateResult && (
        <span className="text-xs text-orange-400 font-medium">~</span>
      )}
    </div>
  );
}