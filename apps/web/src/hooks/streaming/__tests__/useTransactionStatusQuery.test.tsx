import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTransactionStatusQuery } from "../useTransactionStatusQuery";

// Mock the orpc client
vi.mock("@dex-web/orpc", () => ({
  tanstackClient: {
    dexGateway: {
      getTransactionStatus: {
        queryOptions: vi.fn().mockImplementation(() => ({
          queryFn: () => Promise.resolve({ status: "success" }),
          queryKey: [
            "dexGateway",
            "getTransactionStatus",
            { trackingId: "test-id" },
          ],
        })),
      },
    },
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe("useTransactionStatusQuery", () => {
  it("returns query result with trackingId", async () => {
    const { result } = renderHook(
      () => useTransactionStatusQuery({ trackingId: "test-id" }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ status: "success" });
  });

  it("query is disabled when trackingId is null", () => {
    const { result } = renderHook(
      () => useTransactionStatusQuery({ trackingId: null }),
      { wrapper },
    );

    expect(result.current.isFetching).toBe(false);
  });
});
