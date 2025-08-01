import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SwapPageSettingButton } from "../SwapPageSettingButton";

describe.skip("SwapPageSettingButton", () => {
  it("renders the settings button correctly", () => {
    render(<SwapPageSettingButton />);
    expect(
      screen.getByRole("button", { name: "settings" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("settings")).toBeInTheDocument();
  });

  it("opens the settings panel when button is clicked", async () => {
    const user = userEvent.setup();
    render(<SwapPageSettingButton />);

    const settingsButton = screen.getByRole("button", { name: "settings" });
    await user.click(settingsButton);

    expect(screen.getByText("set maximum slippage")).toBeInTheDocument();
    expect(screen.getByLabelText("close")).toBeInTheDocument();
  });

  it("selects default slippage options correctly", async () => {
    const user = userEvent.setup();
    render(<SwapPageSettingButton />);

    // Open the settings panel
    await user.click(screen.getByRole("button", { name: "settings" }));

    // Check default options are rendered
    expect(screen.getByLabelText("0.5%")).toBeInTheDocument();
    expect(screen.getByLabelText("1%")).toBeInTheDocument();
    expect(screen.getByLabelText("2%")).toBeInTheDocument();
    expect(screen.getByLabelText("custom-slippage")).toBeInTheDocument();

    // Default option 0.5% should be selected initially
    expect(screen.getByLabelText("0.5%").textContent).toContain("[x]");

    // Select 1% option
    await user.click(screen.getByLabelText("1%"));
    expect(screen.getByLabelText("1%").textContent).toContain("[x]");
    expect(screen.getByLabelText("0.5%").textContent).toContain("[ ]");
  });

  it("handles custom slippage input correctly", async () => {
    const user = userEvent.setup();
    render(<SwapPageSettingButton />);

    // Open the settings panel
    await user.click(screen.getByRole("button", { name: "settings" }));

    // Click custom slippage option
    await user.click(screen.getByLabelText("custom-slippage"));
    expect(screen.getByLabelText("custom-slippage").textContent).toContain(
      "[x]",
    );

    // Input custom value
    const input = screen.getByLabelText("slippage");
    await user.type(input, "3.5");
    expect(input).toHaveValue("3.5");
  });

  it("closes the panel when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<SwapPageSettingButton />);

    // Open the settings panel
    await user.click(screen.getByRole("button", { name: "settings" }));
    expect(screen.getByText("set maximum slippage")).toBeInTheDocument();

    // Close the panel
    await user.click(screen.getByLabelText("close"));

    // Panel should be closed
    expect(screen.queryByText("set maximum slippage")).not.toBeInTheDocument();
  });
});
