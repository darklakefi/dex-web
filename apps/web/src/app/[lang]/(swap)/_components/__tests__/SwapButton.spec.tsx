import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { TokenTransactionButton } from "../../../../_components/TokenTransactionButton";
const onUrlUpdate = vi.fn();
describe("SwapButton", () => {
  it("swaps tokens", async () => {
    const user = userEvent.setup();
    render(<TokenTransactionButton onClickTokenTransaction={() => {}} />, {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate,
        searchParams: "?tokenAAddress=abc&tokenBAddress=def",
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
      queryString: "?tokenAAddress=def&tokenBAddress=abc",
      searchParams: new URLSearchParams({
        tokenAAddress: "def",
        tokenBAddress: "abc",
      }),
    });
  });
});