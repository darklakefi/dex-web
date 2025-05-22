import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import Page from "../src/app/page";

describe("Page", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<Page />);
    expect(baseElement).toBeTruthy();
    expect(baseElement).toMatchSnapshot();
  });
});
