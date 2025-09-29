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
    variants: {
      variant: {
        default: "h-4 w-20 rounded",
        text: "h-4 w-24 rounded",
        input: "h-12 w-40 rounded text-3xl leading-8.5",
        button: "h-10 w-32 rounded",
        wallet: "h-10 w-32 rounded",
        tokenInput: "h-24 w-full rounded border border-green-400 bg-green-600",
        tokenInputBox:
          "w-full rounded border border-green-400 bg-green-600 pt-3 pb-3",
        balance: "h-4 w-28 rounded",
        circle: "rounded-full",
        rectangle: "rounded-none",
        form: "w-full max-w-xl",
      },
      size: {
        sm: "h-3",
        md: "h-4",
        lg: "h-6",
        xl: "h-8",
      },
      width: {
        xs: "w-12",
        sm: "w-16",
        md: "w-24",
        lg: "w-32",
        xl: "w-40",
        full: "w-full",
      },
      pulse: {
        true: "animate-pulse",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      pulse: false,
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
    width: customWidth || undefined,
    height: customHeight || undefined,
    ...style,
  };

  return (
    <div
      className={twMerge(skeletonVariants({ variant, size, pulse }), className)}
      style={customStyle}
      aria-hidden="true"
      aria-label={ariaLabel || "Loading content"}
      role="img"
      data-testid={testId}
      suppressHydrationWarning={suppressHydrationWarning}
      {...props}
    />
  );
}
