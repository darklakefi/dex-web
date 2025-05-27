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
        base: "bg-green-70",
        highlight: "border border-green-400 bg-green-600",
      },
    },
    defaultVariants: {
      padding: "md",
      background: "base",
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
  className,
  ...props
}: BoxProps) {
  return (
    <div
      className={twMerge(boxVariants({ padding, background }), className)}
      {...props}
    >
      {children}
    </div>
  );
}
