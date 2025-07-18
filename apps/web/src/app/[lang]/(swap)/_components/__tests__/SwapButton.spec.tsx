import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { SwapButton } from "../SwapButton";

const onUrlUpdate = vi.fn();

describe("SwapButton", () => {
  it("swaps tokens", async () => {
    const user = userEvent.setup();

    render(<SwapButton />, {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate,
        searchParams: "?buyTokenAddress=abc&sellTokenAddress=def",
      }),
    });
    const button = screen.getByRole("button");
    await user.click(button);

    expect(onUrlUpdate).toHaveBeenCalledWith({
      options: {
        history: "replace",
        scroll: false,
        shallow: true,
      },
      queryString: "?buyTokenAddress=def&sellTokenAddress=abc",
      searchParams: new URLSearchParams({
        buyTokenAddress: "def",
        sellTokenAddress: "abc",
      }),
    });
  });
});
