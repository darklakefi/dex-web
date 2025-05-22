import { type VariantProps, cva } from "class-variance-authority";

const boxVariants = cva(
  "mb-2 flex items-start justify-start gap-3 text-green-20",
  {
    variants: {
      padding: {
        sm: "p-2",
        md: "p-5",
        lg: "p-6",
      },
      background: {
        base: "bg-green-70",
        highlight: "border-green-40 bg-green-60",
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
export function Box({ children, padding, background, ...props }: BoxProps) {
  return (
    <div className={boxVariants({ padding, background })} {...props}>
      {children}
    </div>
  );
}

export default Box;
