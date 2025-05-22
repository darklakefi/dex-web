import { type VariantProps, cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { Box } from "./Box";

const textInputVariants = cva("size-full p-2", {
  variants: {},
  defaultVariants: {},
});

type TextInputVariants = VariantProps<typeof textInputVariants>;

interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    TextInputVariants {
  label: string;
}

/**
 * The TextInput component is a text input field with a label.
 */
export function TextInput({
  children,
  onChange,
  value,
  name,
  label,
  ...props
}: TextInputProps) {
  return (
    <Box padding="none" background="highlight" className="font-sans">
      <label
        htmlFor={name}
        className={twMerge(
          "size-full p-2 text-green-30",
          !value ? "" : "hidden",
        )}
      >
        {label}
      </label>
      <input
        onChange={onChange}
        value={value}
        name={name}
        className={textInputVariants()}
        {...props}
      />
    </Box>
  );
}
