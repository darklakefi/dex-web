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

  const useCustomLoader =
    !imageUrl.startsWith("/") && !isKnownSafeDomain(imageUrl);

  return (
    <div
      className={`overflow-hidden rounded-full ${className}`}
      style={{ height: size, width: size }}
    >
      <Image
        alt={`${symbol} token icon`}
        height={size}
        loader={useCustomLoader ? tokenImageLoader : undefined}
        onError={() => setHasError(true)}
        priority={priority}
        src={imageUrl}
        style={{ height: "100%", objectFit: "cover", width: "100%" }}
        unoptimized={useCustomLoader}
        width={size}
      />
    </div>
  );
}
