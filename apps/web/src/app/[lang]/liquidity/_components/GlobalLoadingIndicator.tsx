"use client";

import { useIsFetching } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function GlobalLoadingIndicator() {
  const isFetching = useIsFetching();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return isFetching ? (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center gap-2 rounded-lg bg-green-800 px-3 py-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
        <span className="text-green-200 text-sm">Updating data...</span>
      </div>
    </div>
  ) : null;
}
