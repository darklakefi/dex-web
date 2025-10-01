"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const skeletonVariants = cva(
  [
    "relative overflow-hidden bg-green-600/30",
    "before:absolute before:inset-0",
    "before:-translate-x-full",
    "before:bg-gradient-to-r before:from-transparent before:via-green-300/20 before:to-transparent",
    "before:animate-shimmer",
  ],
  {
    defaultVariants: {
      pulse: false,
      variant: "default",
    },
    variants: {
      pulse: {
        false: "",
        true: "animate-pulse",
      },
      size: {
        lg: "h-6",
        md: "h-4",
        sm: "h-3",
        xl: "h-8",
      },
      variant: {
        balance: "h-4 w-28 rounded",
        button: "h-10 w-32 rounded",
        circle: "rounded-full",
        default: "h-4 w-20 rounded",
        form: "w-full max-w-xl",
        input: "h-12 w-40 rounded text-3xl leading-8.5",
        rectangle: "rounded-none",
        text: "h-4 w-24 rounded",
        tokenInput: "h-24 w-full rounded border border-green-400 bg-green-600",
        tokenInputBox:
          "w-full rounded border border-green-400 bg-green-600 pt-3 pb-3",
        wallet: "h-10 w-32 rounded",
      },
      width: {
        full: "w-full",
        lg: "w-32",
        md: "w-24",
        sm: "w-16",
        xl: "w-40",
        xs: "w-12",
      },
    },
  },
);

interface SkeletonLoaderProps
  extends Omit<VariantProps<typeof skeletonVariants>, "width"> {
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
  "aria-label"?: string;
  testId?: string;
  suppressHydrationWarning?: boolean;
}

export function SkeletonLoader({
  className,
  style,
  variant,
  size,
  pulse,
  height: customHeight,
  width: customWidth,
  "aria-label": ariaLabel,
  testId,
  suppressHydrationWarning = true,
  ...props
}: SkeletonLoaderProps) {
  const customStyle = {
    height: customHeight || undefined,
    width: customWidth || undefined,
    ...style,
  };

  return (
    <div
      aria-hidden="true"
      aria-label={ariaLabel || "Loading content"}
      className={twMerge(skeletonVariants({ pulse, size, variant }), className)}
      data-testid={testId}
      role="img"
      style={customStyle}
      suppressHydrationWarning={suppressHydrationWarning}
      {...props}
    />
  );
}
