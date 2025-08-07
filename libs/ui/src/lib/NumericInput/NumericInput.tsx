import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";
import { twMerge } from "tailwind-merge";

const numericInputVariants = cva(
  "inline-flex w-full bg-green-600 text-end font-sans text-3xl text-green-100 uppercase leading-8.5 fieldset:placeholder-transparent caret-green-300 focus:outline-none",
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
  className,
  ...props
}: NumericInputProps) {
  const size = props.value?.toString().length ?? placeholder?.length ?? 1;
  return (
    <input
      aria-label={name}
      className={twMerge(numericInputVariants(), className)}
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
