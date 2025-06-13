import { cva, type VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const boxVariants = cva(
  "mb-2 flex flex-1 items-stretch justify-start gap-3 text-green-200",
  {
    defaultVariants: {
      background: "base",
      padding: "md",
      shadow: "none",
    },
    variants: {
      background: {
        base: "bg-green-700",
        highlight: "border border-green-400 bg-green-600",
      },
      padding: {
        lg: "p-6",
        md: "p-5",
        none: "p-0",
        sm: "p-2",
      },
      shadow: {
        none: "shadow-none",
        sm: "shadow-green-900 shadow-sm",
        xl: "shadow-green-900 shadow-xl",
      },
    },
  },
);

type BoxVariants = VariantProps<typeof boxVariants>;

interface BoxProps extends React.HTMLAttributes<HTMLDivElement>, BoxVariants {}

/**
 * The Box component is a generic container for grouping other components.
 */
export function Box({
  children,
  padding,
  background,
  shadow,
  className,
  ...props
}: BoxProps) {
  return (
    <div
      className={twMerge(
        boxVariants({ background, padding, shadow }),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
