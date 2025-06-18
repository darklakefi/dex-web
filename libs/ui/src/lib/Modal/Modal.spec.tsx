import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "../Button/Button";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("should render", () => {
    render(<Modal onClose={() => {}}>Hello</Modal>);
  });

  it("should close when the close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose}>
        Hello{" "}
        <Button onClick={onClose} text="Close" variant="primary">
          Close
        </Button>
      </Modal>,
    );
    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});
