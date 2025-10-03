import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export interface OptimisticUpdateConfig<TData = unknown> {
  queryKey: (string | number)[];
  updateFn: (oldData: TData | undefined) => TData;
  rollbackData?: TData;
}

export interface OptimisticUpdateResult<TData = unknown> {
  executeOptimisticUpdate: (
    config: OptimisticUpdateConfig<TData>,
  ) => Promise<TData | undefined>;
  rollbackUpdate: (queryKey: (string | number)[], rollbackData: TData) => void;
  cancelQueries: (queryKey: (string | number)[]) => Promise<void>;
}

export function useOptimisticUpdate(): OptimisticUpdateResult {
  const queryClient = useQueryClient();

  const executeOptimisticUpdate = useCallback(
    async <TData>(
      config: OptimisticUpdateConfig<TData>,
    ): Promise<TData | undefined> => {
      const { queryKey, updateFn } = config;

      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TData>(queryKey);
      const optimisticData = updateFn(previousData);

      queryClient.setQueryData(queryKey, optimisticData);

      return previousData;
    },
    [queryClient],
  );

  const rollbackUpdate = useCallback(
    <TData>(queryKey: (string | number)[], rollbackData: TData) => {
      queryClient.setQueryData(queryKey, rollbackData);
    },
    [queryClient],
  );

  const cancelQueries = useCallback(
    async (queryKey: (string | number)[]) => {
      await queryClient.cancelQueries({ queryKey });
    },
    [queryClient],
  );

  return {
    cancelQueries,
    executeOptimisticUpdate,
    rollbackUpdate,
  };
}
