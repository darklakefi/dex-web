import { vi } from "vitest";

export const createMockMutation = (mockData: unknown) => ({
  data: mockData,
  error: null,
  isError: false,
  isPending: false,
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue(mockData),
});

export const createMockMutationWithError = (error: Error) => ({
  data: undefined,
  error,
  isError: true,
  isPending: false,
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockRejectedValue(error),
});

export const createMockMutationPending = () => ({
  data: undefined,
  error: null,
  isError: false,
  isPending: true,
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
});
