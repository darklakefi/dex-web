"use client";

import Image from "next/image";
import { useState } from "react";

interface TokenImageProps {
  address: string;
  symbol: string;
  imageUrl?: string | null;
  size?: 16 | 24 | 32 | 48 | 64;
  priority?: boolean;
  className?: string;
}

/**
 * Optimized token image component with:
 * - Automatic Next.js image optimization (WebP/AVIF, responsive sizing)
 * - 30-day caching via next.config
 * - Graceful fallback to symbol initials
 * - Error boundary for failed loads
 * - Multiple size variants for different contexts
 *
 * @example
 * <TokenImage
 *   address="So11111111111111111111111111111111111111112"
 *   symbol="SOL"
 *   imageUrl="https://raw.githubusercontent.com/..."
 *   size={32}
 *   priority={true}
 * />
 */
export function TokenImage({
  symbol,
  imageUrl,
  size = 32,
  priority = false,
  className = "",
}: TokenImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden rounded-full bg-green-600 font-bold text-green-200 text-xs leading-none ${className}`}
        style={{ fontSize: size * 0.4, height: size, width: size }}
      >
        <span className="uppercase">{symbol.slice(0, 2)}</span>
      </div>
    );
  }

  return (
    <Image
      alt={`${symbol} token icon`}
      className={`rounded-full object-cover ${className}`}
      height={size}
      onError={() => setHasError(true)}
      priority={priority}
      src={imageUrl}
      width={size}
    />
  );
}
