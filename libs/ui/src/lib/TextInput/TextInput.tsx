import { cva, type VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { Icon, type IconName } from "../Icon/Icon";

const textInputVariants = cva(
  "peer flex w-full py-2 pr-2 pl-8 placeholder-transparent caret-green-300 focus:outline-none focus:ring-2 focus:ring-blue-200",
  {
    defaultVariants: {},
    variants: {},
  },
);

type TextInputVariants = VariantProps<typeof textInputVariants>;

interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    TextInputVariants {
  label: React.ReactNode;
  leadingIcon?: IconName;
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
  placeholder,
  leadingIcon,
  className,
  ...props
}: TextInputProps) {
  const prefix = leadingIcon ? (
    <span className="flex h-6 items-center justify-center">
      <Icon className="size-4" name={leadingIcon} />
    </span>
  ) : (
    "> "
  );
  return (
    <label
      className={twMerge(
        "relative inline-flex items-center gap-2 border border-green-300 bg-green-600 font-sans text-green-300 text-lg/4xl",
        className,
      )}
    >
      <span className="absolute top-0 left-0 p-2">{prefix}</span>
      <input
        className={twMerge(
          textInputVariants(),
          !value ? "caret-transparent" : "",
        )}
        name={name}
        onChange={onChange}
        placeholder={
          placeholder
            ? placeholder
            : typeof label === "string"
              ? label
              : undefined
        }
        value={value}
        {...props}
      />
      <span className="invisible absolute top-0 left-8 inline-flex h-full items-center justify-start gap-2 text-green-300 uppercase peer-placeholder-shown:visible peer-focus:text-green-400 peer-active:text-green-400">
        {label}
      </span>
    </label>
  );
}
