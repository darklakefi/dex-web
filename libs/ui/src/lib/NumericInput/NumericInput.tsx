import { cva, type VariantProps } from "class-variance-authority";

const numericInputVariants = cva(
  "inline-flex w-full p-2 text-end font-sans text-3xl text-green-100 uppercase fieldset:placeholder-transparent caret-green-300 focus:outline-none",
  {
    defaultVariants: {},
    variants: {},
  },
);

type NumericInputVariants = VariantProps<typeof numericInputVariants>;

interface NumericInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    NumericInputVariants {
  label: string;
}

/**
 * The NumericInput component is a numeric input field with a label.
 */
export function NumericInput({
  children,
  name,
  label,
  ...props
}: NumericInputProps) {
  const size = props.value?.toString().length ?? label.length ?? 1;
  return (
    <input
      className={numericInputVariants()}
      inputMode="numeric"
      min={0}
      name={name}
      placeholder={label}
      size={size}
      type="number"
      {...props}
    />
  );
}
