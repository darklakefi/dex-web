import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "@storybook/test";
import { useId, useState } from "react";
import { NumericInput } from "./NumericInput";

const meta = {
  component: NumericInput,
  title: "NumericInput",
} satisfies Meta<typeof NumericInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  args: {
    name: "amount",
    placeholder: "0.00",
    value: "",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("inputMode", "numeric");
    expect(input).toHaveAttribute("type", "number");
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <div className="bg-gray-900 p-8">
        <NumericInput
          {...args}
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
      </div>
    );
  },
} satisfies Story;

export const Interactive = {
  args: {
    name: "swapAmount",
    placeholder: "Enter amount",
  },
  render: (args) => {
    const [value, setValue] = useState("");
    const [displayValue, setDisplayValue] = useState("0");
    const inputId = useId();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      setDisplayValue(newValue || "0");
    };

    return (
      <div className="space-y-6 bg-gray-900 p-8">
        <div className="text-center">
          <h3 className="mb-4 font-bold text-white text-xl">
            Interactive Swap Amount Input
          </h3>
          <p className="mb-6 text-gray-400">
            Try entering different amounts to see the input resize dynamically
          </p>
        </div>

        <div className="rounded-lg border border-green-600/30 bg-green-800/20 p-6">
          <label
            className="mb-2 block font-medium text-green-300 text-sm"
            htmlFor={inputId}
          >
            Amount to Swap
          </label>
          <NumericInput
            {...args}
            id={inputId}
            min="0"
            onChange={handleChange}
            step="0.01"
            value={value}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded bg-gray-800 p-4">
            <div className="text-gray-400">Current Value:</div>
            <div className="font-mono text-lg text-white">{displayValue}</div>
          </div>
          <div className="rounded bg-gray-800 p-4">
            <div className="text-gray-400">Input Size:</div>
            <div className="font-mono text-lg text-white">
              {value?.toString().length || args.placeholder?.length || 1} chars
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-gray-400 text-sm">Quick amounts:</div>
          <div className="flex flex-wrap gap-2">
            {["1", "10", "100", "1000", "10000", "0.1", "0.01"].map(
              (amount) => (
                <button
                  className="rounded bg-green-600 px-3 py-1 text-sm text-white transition-colors hover:bg-green-500"
                  key={amount}
                  onClick={() => {
                    setValue(amount);
                    setDisplayValue(amount);
                  }}
                  type="button"
                >
                  {amount}
                </button>
              ),
            )}
            <button
              className="rounded bg-red-600 px-3 py-1 text-sm text-white transition-colors hover:bg-red-500"
              onClick={() => {
                setValue("");
                setDisplayValue("0");
              }}
              type="button"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  },
} satisfies Story;
