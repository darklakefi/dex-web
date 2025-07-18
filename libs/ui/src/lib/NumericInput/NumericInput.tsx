import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";

const numericInputVariants = cva(
  "inline-flex w-full bg-green-600 text-end font-sans text-3xl text-green-100 uppercase fieldset:placeholder-transparent caret-green-300 focus:outline-none",
  {
    defaultVariants: {},
    variants: {},
  },
);

type NumericInputVariants = VariantProps<typeof numericInputVariants>;

export interface NumericInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    ComponentPropsWithRef<"input">,
    NumericInputVariants {}

/**
 * The NumericInput component is a numeric input field used for inputting numbers i.e. financial values.
 */
export function NumericInput({
  children,
  name,
  placeholder,
  ...props
}: NumericInputProps) {
  const size = props.value?.toString().length ?? placeholder?.length ?? 1;
  return (
    <input
      aria-label={name}
      className={numericInputVariants()}
      inputMode="numeric"
      min={0}
      name={name}
      placeholder={placeholder}
      size={size}
      type="number"
      {...props}
    />
  );
}
