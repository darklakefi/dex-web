type GroupedTransaction<T> = {
  data: Record<string, T[]>;
  keys: string[];
};

export const groupTransactionByDate = <T extends { createdAt: number }>(
  sortedItems: T[],
): GroupedTransaction<T> => {
  if (sortedItems.length === 0) {
    return {
      data: {},
      keys: [],
    };
  }

  const keys = new Set<string>();
  const grouped = sortedItems.reduce(
    (groups: GroupedTransaction<T>["data"], item) => {
      const dateString = new Date(item.createdAt).toISOString().split("T")[0];
      if (!dateString) {
        return groups;
      }
      groups[dateString] = groups[dateString] || [];
      groups[dateString].push(item);
      keys.add(dateString);
      return groups;
    },
    {},
  );

  return {
    data: grouped,
    keys: Array.from(keys).reverse(),
  };
};
