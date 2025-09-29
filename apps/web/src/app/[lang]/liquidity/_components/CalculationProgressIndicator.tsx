"use client";

import { Icon } from "@dex-web/ui";
import { useEffect, useMemo, useState } from "react";

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
  const progressState = useMemo((): ProgressState => {
    if (workerError) {
      return {
        message: "Calculation failed - using fallback",
        progress: 0,
        stage: "error",
      };
    }

    if (!isCalculating) {
      return {
        message: "",
        progress: 0,
        stage: "idle",
      };
    }

    if (hasApproximateResult) {
      return {
        message: "Getting exact amounts...",
        progress: 75,
        stage: "exact",
      };
    }

    return {
      message: isWorkerReady ? "Calculating..." : "Loading...",
      progress: 25,
      stage: "approximate",
    };
  }, [isCalculating, hasApproximateResult, isWorkerReady, workerError]);

  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (progressState.progress === 0) {
      setAnimatedProgress(0);
      return;
    }

    const startProgress = animatedProgress;
    const targetProgress = progressState.progress;
    const duration = 300;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - (1 - progress) ** 3;
      const currentProgress =
        startProgress + (targetProgress - startProgress) * easeOut;

      setAnimatedProgress(currentProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [progressState.progress, animatedProgress]);

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

  const getStageIcon = () => {
    switch (progressState.stage) {
      case "approximate":
        return "refresh";
      case "exact":
        return "refresh";
      case "complete":
        return "check-filled";
      case "error":
        return "exclamation";
      default:
        return "refresh";
    }
  };

  const getStageColor = () => {
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
  };

  if (!isVisible || progressState.stage === "idle") {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-gray-700/50 bg-gray-800/50 px-3 py-2 transition-all duration-300 ease-out ${className}`}
    >
      {}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <Icon
            className={`size-3 ${getStageColor()} ${
              progressState.stage === "approximate" ||
              progressState.stage === "exact"
                ? "animate-spin"
                : ""
            }`}
            name={getStageIcon()}
          />
          <span className="truncate text-gray-300 text-xs">
            {progressState.message}
          </span>
        </div>

        {}
        <div className="h-1 w-full rounded-full bg-gray-700">
          <div
            className={`h-1 rounded-full transition-all duration-300 ease-out ${
              progressState.stage === "error"
                ? "bg-red-500"
                : progressState.stage === "complete"
                  ? "bg-green-500"
                  : "bg-blue-500"
            }`}
            style={{
              width: `${animatedProgress}%`,
            }}
          />
        </div>
      </div>

      {}
      {!isWorkerReady && !workerError && (
        <div className="flex items-center gap-1">
          <div className="size-2 animate-pulse rounded-full bg-yellow-500" />
          <span className="text-gray-400 text-xs">Worker loading</span>
        </div>
      )}

      {}
      {hasApproximateResult && (
        <div className="flex items-center gap-1">
          <div className="size-2 rounded-full bg-orange-500" />
          <span className="text-orange-400 text-xs">~</span>
        </div>
      )}
    </div>
  );
}

export function MiniCalculationIndicator({
  isCalculating,
  hasApproximateResult,
  className = "",
}: Pick<
  CalculationProgressIndicatorProps,
  "isCalculating" | "hasApproximateResult" | "className"
>) {
  if (!isCalculating && !hasApproximateResult) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {isCalculating && (
        <Icon className="size-3 animate-spin text-blue-500" name="refresh" />
      )}
      {hasApproximateResult && (
        <span className="font-medium text-orange-400 text-xs">~</span>
      )}
    </div>
  );
}
