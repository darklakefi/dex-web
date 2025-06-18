import { NumericInput, Text } from "@dex-web/ui";

interface SwapFormFieldsetProps {
  label: string;
  balance: number;
}

export function SwapFormFieldset({ label, balance }: SwapFormFieldsetProps) {
  return (
    <fieldset className="flex min-w-0 flex-1 flex-col items-end gap-3">
      <div className="mb-3 flex gap-3">
        <Text.Body2 as="label" className="text-green-300 uppercase">
          Balance
        </Text.Body2>
        <Text.Body2>{balance}</Text.Body2>
      </div>
      <NumericInput label={label} />
    </fieldset>
  );
}
