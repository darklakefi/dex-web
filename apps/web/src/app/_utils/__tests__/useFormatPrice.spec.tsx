import { renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { useFormatPrice } from "../useFormatPrice";
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={{}}>
    {children}
  </NextIntlClientProvider>
);
describe("useFormatPrice", () => {
  it("should return the formatted price when the value is a number", () => {
    const testCases = [
      { amount: 100, currency: "USD", exchangeRate: 1, expected: "$100.00" },
      { amount: 50, currency: "USD", exchangeRate: 2, expected: "$100.00" },
      { amount: 200, currency: "USD", exchangeRate: 0.5, expected: "$100.00" },
      {
        amount: 123.456,
        currency: "USD",
        exchangeRate: 1,
        expected: "$123.46",
      },
      { amount: 0, currency: "USD", exchangeRate: 1, expected: "$0.00" },
      { amount: 1000, currency: "USD", exchangeRate: 0.001, expected: "$1.00" },
      { amount: 0.5, currency: "USD", exchangeRate: 10, expected: "$5.00" },
    ];
    testCases.forEach(({ amount, exchangeRate, currency, expected }) => {
      const { result } = renderHook(
        () => useFormatPrice(amount, exchangeRate, currency),
        {
          wrapper,
        },
      );
      expect(result.current).toBe(expected);
    });
  });
  it("should return the formatted price when the value is a string", () => {
    const testCases = [
      { amount: "100", currency: "USD", exchangeRate: 1, expected: "$100.00" },
      { amount: "50", currency: "USD", exchangeRate: 2, expected: "$100.00" },
      {
        amount: "200",
        currency: "USD",
        exchangeRate: 0.5,
        expected: "$100.00",
      },
      {
        amount: "123.456",
        currency: "USD",
        exchangeRate: 1,
        expected: "$123.46",
      },
      { amount: "0", currency: "USD", exchangeRate: 1, expected: "$0.00" },
      {
        amount: "1000",
        currency: "USD",
        exchangeRate: 0.001,
        expected: "$1.00",
      },
      { amount: "0.5", currency: "USD", exchangeRate: 10, expected: "$5.00" },
      { amount: "", currency: "USD", exchangeRate: 1, expected: "$0.00" },
    ];
    testCases.forEach(({ amount, exchangeRate, currency, expected }) => {
      const { result } = renderHook(
        () => useFormatPrice(amount, exchangeRate, currency),
        {
          wrapper,
        },
      );
      expect(result.current).toBe(expected);
    });
  });
  it("should return the formatted price when the value is a readonly string array", () => {
    const testCases = [
      {
        amount: ["100"],
        currency: "USD",
        exchangeRate: 1,
        expected: "$100.00",
      },
      { amount: ["50"], currency: "USD", exchangeRate: 2, expected: "$100.00" },
      {
        amount: ["200"],
        currency: "USD",
        exchangeRate: 0.5,
        expected: "$100.00",
      },
      {
        amount: ["123.456"],
        currency: "USD",
        exchangeRate: 1,
        expected: "$123.46",
      },
      { amount: ["0"], currency: "USD", exchangeRate: 1, expected: "$0.00" },
      {
        amount: ["1000"],
        currency: "USD",
        exchangeRate: 0.001,
        expected: "$1.00",
      },
      { amount: ["0.5"], currency: "USD", exchangeRate: 10, expected: "$5.00" },
      { amount: [""], currency: "USD", exchangeRate: 1, expected: "$0.00" },
      { amount: [], currency: "USD", exchangeRate: 1, expected: "$0.00" },
    ];
    testCases.forEach(({ amount, exchangeRate, currency, expected }) => {
      const { result } = renderHook(
        () => useFormatPrice(amount, exchangeRate, currency),
        {
          wrapper,
        },
      );
      expect(result.current).toBe(expected);
    });
  });
  it("should return the formatted price when the value is undefined", () => {
    const testCases = [
      {
        amount: undefined,
        currency: "USD",
        exchangeRate: 1,
        expected: "$0.00",
      },
      {
        amount: undefined,
        currency: "USD",
        exchangeRate: 2,
        expected: "$0.00",
      },
      {
        amount: undefined,
        currency: "USD",
        exchangeRate: 0.5,
        expected: "$0.00",
      },
      {
        amount: undefined,
        currency: "USD",
        exchangeRate: 100,
        expected: "$0.00",
      },
      {
        amount: undefined,
        currency: "USD",
        exchangeRate: 0.001,
        expected: "$0.00",
      },
    ];
    testCases.forEach(({ amount, exchangeRate, currency, expected }) => {
      const { result } = renderHook(
        () => useFormatPrice(amount, exchangeRate, currency),
        {
          wrapper,
        },
      );
      expect(result.current).toBe(expected);
    });
  });
});