"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

const skeletonVariants = cva(
  [
    "relative overflow-hidden bg-green-500/20",
    "before:absolute before:inset-0",
    "before:-translate-x-full before:animate-pulse",
    "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
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
        circle: "rounded-full",
        rectangle: "rounded-none",
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
  }
);

interface SkeletonLoaderProps extends Omit<VariantProps<typeof skeletonVariants>, 'width'> {
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
  "aria-label"?: string;
  testId?: string;
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
  ...props
}: SkeletonLoaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-4 w-20" aria-hidden="true" />;
  }

  const customStyle = {
    width: customWidth || undefined,
    height: customHeight || undefined,
    background: `linear-gradient(90deg, rgba(34, 197, 94, 0.1) 25%, rgba(34, 197, 94, 0.2) 50%, rgba(34, 197, 94, 0.1) 75%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 2s infinite ease-in-out',
    ...style,
  };

  return (
    <div
      className={twMerge(
        skeletonVariants({ variant, size, pulse }),
        "bg-green-500/10",
        className
      )}
      style={customStyle}
      aria-hidden="true"
      aria-label={ariaLabel || "Loading content"}
      role="img"
      data-testid={testId}
      {...props}
    />
  );
}