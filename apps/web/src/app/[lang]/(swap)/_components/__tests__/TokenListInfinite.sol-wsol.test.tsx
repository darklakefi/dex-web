/**
 * SOL/WSOL specific tests for TokenListInfinite component
 * Tests the display and selection of SOL vs WSOL tokens
 */

import type { Token } from "@dex-web/orpc/schemas/index";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { TokenListInfinite } from "../TokenListInfinite";

// Mock @tanstack/react-virtual
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: () => ({
    getTotalSize: () => 204,
    getVirtualItems: () => [
      { index: 0, key: "0", size: 68, start: 0 },
      { index: 1, key: "1", size: 68, start: 68 },
      { index: 2, key: "2", size: 68, start: 136 },
    ],
    measure: vi.fn(),
  }),
}));

// Test constants
const SOL_ADDRESS = "So11111111111111111111111111111111111111111";
const WSOL_ADDRESS = "So11111111111111111111111111111111111111112";
const USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Mock tokens
const mockTokens: Token[] = [
  {
    address: SOL_ADDRESS,
    decimals: 9,
    imageUrl: "",
    name: "Solana",
    symbol: "SOL",
  },
  {
    address: WSOL_ADDRESS,
    decimals: 9,
    imageUrl: "",
    name: "Wrapped SOL",
    symbol: "WSOL",
  },
  {
    address: USDC_ADDRESS,
    decimals: 6,
    imageUrl: "",
    name: "USD Coin",
    symbol: "USDC",
  },
];

describe("TokenListInfinite SOL/WSOL Display Tests", () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Token Display - Acceptance Criteria", () => {
    it("should display SOL with correct symbol and name", async () => {
      render(
        <TokenListInfinite
          onSelect={mockOnSelect} // SOL token
          title="Test Tokens"
          tokens={[mockTokens[0]]}
        />,
      );

      // Should display "SOL" as symbol
      await waitFor(() => {
        expect(screen.getByText("SOL")).toBeInTheDocument();
      });
      // Should display "Solana" as name
      expect(screen.getByText("Solana")).toBeInTheDocument();
    });

    it("should display WSOL with correct symbol and name", async () => {
      render(
        <TokenListInfinite
          onSelect={mockOnSelect} // WSOL token
          title="Test Tokens"
          tokens={[mockTokens[1]]}
        />,
      );

      // Should display "WSOL" as symbol
      await waitFor(() => {
        expect(screen.getByText("WSOL")).toBeInTheDocument();
      });
      // Should display "Wrapped Solana" as name
      expect(screen.getByText("Wrapped Solana")).toBeInTheDocument();
    });

    it("should display both SOL and WSOL as separate entries", async () => {
      render(
        <TokenListInfinite
          onSelect={mockOnSelect}
          title="Test Tokens"
          tokens={mockTokens}
        />,
      );

      // Both should be visible as separate entries
      await waitFor(() => {
        expect(screen.getByText("SOL")).toBeInTheDocument();
        expect(screen.getByText("WSOL")).toBeInTheDocument();
        expect(screen.getByText("Solana")).toBeInTheDocument();
        expect(screen.getByText("Wrapped Solana")).toBeInTheDocument();

        // Should also show USDC
        expect(screen.getByText("USDC")).toBeInTheDocument();
        expect(screen.getByText("USD Coin")).toBeInTheDocument();
      });
    });

    it("should display correct addresses for SOL and WSOL", async () => {
      render(
        <TokenListInfinite
          onSelect={mockOnSelect} // SOL and WSOL
          title="Test Tokens"
          tokens={[mockTokens[0], mockTokens[1]]}
        />,
      );

      // Check that addresses are displayed (truncated)
      await waitFor(() => {
        expect(screen.getByText("So11...1111")).toBeInTheDocument(); // SOL address truncated
        expect(screen.getByText("So11...1112")).toBeInTheDocument(); // WSOL address truncated
      });
    });
  });

  describe("Token Selection Behavior", () => {
    it("should call onSelect with SOL token when SOL is clicked", async () => {
      render(
        <TokenListInfinite
          onSelect={mockOnSelect} // SOL token
          title="Test Tokens"
          tokens={[mockTokens[0]]}
        />,
      );

      const solButton = await waitFor(() => screen.getByRole("button"));
      fireEvent.click(solButton);

      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          address: SOL_ADDRESS,
          symbol: "SOL",
        }),
        expect.any(Object), // MouseEvent
      );
    });

    it("should call onSelect with WSOL token when WSOL is clicked", async () => {
      render(
        <TokenListInfinite
          onSelect={mockOnSelect} // WSOL token
          title="Test Tokens"
          tokens={[mockTokens[1]]}
        />,
      );

      const wsolButton = await waitFor(() => screen.getByRole("button"));
      fireEvent.click(wsolButton);

      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          address: WSOL_ADDRESS,
          symbol: "WSOL",
        }),
        expect.any(Object), // MouseEvent
      );
    });

    it("should handle selection of both SOL and WSOL correctly", async () => {
      render(
        <TokenListInfinite
          onSelect={mockOnSelect} // SOL and WSOL
          title="Test Tokens"
          tokens={[mockTokens[0], mockTokens[1]]}
        />,
      );

      const buttons = await waitFor(() => screen.getAllByRole("button"));

      // Click SOL (first button)
      fireEvent.click(buttons[0]);
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({ address: SOL_ADDRESS }),
        expect.any(Object),
      );

      // Click WSOL (second button)
      fireEvent.click(buttons[1]);
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({ address: WSOL_ADDRESS }),
        expect.any(Object),
      );

      expect(mockOnSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe("Token Display Consistency", () => {
    it("should display other tokens normally", async () => {
      render(
        <TokenListInfinite
          onSelect={mockOnSelect} // USDC token
          title="Test Tokens"
          tokens={[mockTokens[2]]}
        />,
      );

      // Should display original symbol and name for non-SOL tokens
      await waitFor(() => {
        expect(screen.getByText("USDC")).toBeInTheDocument();
        expect(screen.getByText("USD Coin")).toBeInTheDocument();
      });
    });

    it("should maintain consistent layout for all token types", async () => {
      render(
        <TokenListInfinite
          onSelect={mockOnSelect}
          title="Test Tokens"
          tokens={mockTokens}
        />,
      );

      const buttons = await waitFor(() => screen.getAllByRole("button"));

      // All tokens should be rendered as buttons
      expect(buttons).toHaveLength(3);

      // Each should have the expected structure
      buttons.forEach((button) => {
        expect(button).toHaveClass("flex", "w-full", "cursor-pointer");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty token list", () => {
      render(
        <TokenListInfinite
          onSelect={mockOnSelect}
          title="Test Tokens"
          tokens={[]}
        />,
      );

      expect(screen.getByText("No tokens available")).toBeInTheDocument();
    });

    it("should handle tokens with missing metadata gracefully", async () => {
      const tokenWithMissingData: Token = {
        address: SOL_ADDRESS,
        decimals: 9,
        imageUrl: "",
        name: "",
        symbol: "",
      };

      render(
        <TokenListInfinite
          onSelect={mockOnSelect}
          title="Test Tokens"
          tokens={[tokenWithMissingData]}
        />,
      );

      // Should still display SOL correctly even with empty original metadata
      await waitFor(() => {
        expect(screen.getByText("SOL")).toBeInTheDocument();
        expect(screen.getByText("Solana")).toBeInTheDocument();
      });
    });
  });
});
