import { type VariantProps, cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const textInputVariants = cva("peer p-2 placeholder-transparent", {
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
    <label className="relative border border-green-30 bg-green-60 p-2 font-sans text-green-30">
      <input
        onChange={onChange}
        value={value}
        name={name}
        placeholder={label}
        className={twMerge(
          textInputVariants(),
          !value ? "caret-transparent" : "",
        )}
        {...props}
      />
      <span className="absolute top-2 left-2 hidden text-green-30 peer-placeholder-shown:block">
        {label}
      </span>
    </label>
  );
}
