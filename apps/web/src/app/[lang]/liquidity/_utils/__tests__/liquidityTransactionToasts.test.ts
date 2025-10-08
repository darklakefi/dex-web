import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  showErrorToast,
  showInfoToast,
  showStepToast,
} from "../liquidityTransactionToasts";

// Mock the toast function
vi.mock("../../../../_utils/toast", () => ({
  toast: vi.fn(),
}));

import { toast } from "../../../../_utils/toast";

describe("liquidityTransactionToasts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("showErrorToast", () => {
    it("calls toast with error variant", () => {
      showErrorToast({ message: "Test error" });

      expect(toast).toHaveBeenCalledWith({
        description: "Test error",
        title: "Transaction Error",
        variant: "error",
      });
    });

    it("passes context parameter", () => {
      const context = { trackingId: "123" };
      showErrorToast({ context, message: "Test error" });

      expect(toast).toHaveBeenCalledWith({
        description: "Test error",
        title: "Transaction Error",
        variant: "error",
      });
    });
  });

  describe("showInfoToast", () => {
    it("calls toast with info variant", () => {
      showInfoToast({ message: "Test info" });

      expect(toast).toHaveBeenCalledWith({
        description: "Test info",
        title: "Transaction Info",
        variant: "info",
      });
    });
  });

  describe("showStepToast", () => {
    it("calls toast with step title and description from constants", () => {
      showStepToast(2);

      expect(toast).toHaveBeenCalledWith({
        description: "Please confirm the liquidity transaction in your wallet.",
        title: "Confirm liquidity transaction [2/3]",
        variant: "loading",
      });
    });

    it("handles invalid step gracefully", () => {
      showStepToast(99);

      expect(toast).not.toHaveBeenCalled();
    });
  });
});
