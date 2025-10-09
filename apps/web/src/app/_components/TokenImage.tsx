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
 * Known safe domains that are configured in next.config.ts remotePatterns.
 * Images from these domains will use Next.js built-in optimization.
 */
const KNOWN_SAFE_DOMAINS = [
  "raw.githubusercontent.com",
  "arweave.net",
  "ipfs.nftstorage.link",
  "ipfs.io",
  "shdw-drive.genesysgo.net",
  "helius-rpc.com",
  "cdn.helius-rpc.com",
  "amazonaws.com",
  "cloudfront.net",
];

/**
 * Check if a URL's hostname matches any of the known safe domains.
 */
function isKnownSafeDomain(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return KNOWN_SAFE_DOMAINS.some((safeDomain) => {
      return hostname === safeDomain || hostname.endsWith(`.${safeDomain}`);
    });
  } catch {
    return false;
  }
}

/**
 * Custom loader for unknown domains - proxies through our API route.
 */
function tokenImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const params = new URLSearchParams();
  params.set("url", src);
  params.set("w", width.toString());
  params.set("q", (quality || 75).toString());
  return `/api/image-proxy?${params.toString()}`;
}

/**
 * Optimized token image component with:
 * - Automatic Next.js image optimization (WebP/AVIF, responsive sizing)
 * - 30-day caching via next.config
 * - Graceful fallback to symbol initials
 * - Error boundary for failed loads
 * - Multiple size variants for different contexts
 * - Support for unknown image domains via proxy
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

  // For unknown domains, use custom loader that proxies through our API
  const useCustomLoader =
    !imageUrl.startsWith("/") && !isKnownSafeDomain(imageUrl);

  return (
    <Image
      alt={`${symbol} token icon`}
      className={`rounded-full object-cover ${className}`}
      height={size}
      loader={useCustomLoader ? tokenImageLoader : undefined}
      onError={() => setHasError(true)}
      priority={priority}
      src={imageUrl}
      unoptimized={useCustomLoader}
      width={size}
    />
  );
}
