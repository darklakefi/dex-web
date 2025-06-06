import { type VariantProps, cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const boxVariants = cva(
  "mb-2 flex items-start justify-start gap-3 text-green-200",
  {
    variants: {
      padding: {
        none: "p-0",
        sm: "p-2",
        md: "p-5",
        lg: "p-6",
      },
      background: {
        base: "bg-green-700",
        highlight: "border border-green-400 bg-green-600",
      },
      shadow: {
        none: "shadow-none",
        sm: "shadow-green-900 shadow-sm",
        xl: "shadow-green-900 shadow-xl",
      },
    },
    defaultVariants: {
      padding: "md",
      background: "base",
      shadow: "none",
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
        boxVariants({ padding, background, shadow }),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
