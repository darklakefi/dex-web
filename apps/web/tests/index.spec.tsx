import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Page from "../src/app/(swap)/page";

describe("Page", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<Page searchParams={{}} />);
    expect(baseElement).toBeTruthy();
    expect(baseElement).toMatchSnapshot();
  });
});
