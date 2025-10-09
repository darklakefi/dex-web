import { type NextRequest, NextResponse } from "next/server";

/**
 * Maximum allowed image size (5MB).
 * Prevents abuse by limiting proxy to reasonable token image sizes.
 */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Allowed image MIME types for token images.
 */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

/**
 * Image proxy API route for handling token images from unknown domains.
 *
 * Security features:
 * - Validates image URL format
 * - Checks content type and size
 * - Adds appropriate cache headers
 * - Prevents abuse through size limits
 *
 * This endpoint is called by the custom image loader for URLs from domains
 * not in the next.config.ts remotePatterns allowlist.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get("url");
  const width = searchParams.get("w");
  const quality = searchParams.get("q") || "75";

  if (!imageUrl) {
    return NextResponse.json(
      { error: "Missing required parameter: url" },
      { status: 400 },
    );
  }

  let url: URL;
  try {
    url = new URL(imageUrl);
    if (url.protocol !== "https:") {
      return NextResponse.json(
        { error: "Only HTTPS URLs are allowed" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Darklake-DEX/1.0",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${imageResponse.statusText}` },
        { status: imageResponse.status },
      );
    }

    const contentType = imageResponse.headers.get("content-type");
    if (!contentType || !ALLOWED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid image content type" },
        { status: 400 },
      );
    }

    const contentLength = imageResponse.headers.get("content-length");
    if (contentLength && Number.parseInt(contentLength) > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "Image size exceeds maximum allowed size" },
        { status: 413 },
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    if (imageBuffer.byteLength > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "Image size exceeds maximum allowed size" },
        { status: 413 },
      );
    }

    return new NextResponse(imageBuffer, {
      headers: {
        "Cache-Control": "public, max-age=2592000, immutable",
        "Content-Type": contentType,
        "X-Image-Quality": quality,
        "X-Image-Width": width || "auto",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Image proxy error:", error);

    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Request timeout while fetching image" },
        { status: 504 },
      );
    }

    return NextResponse.json(
      { error: "Failed to proxy image" },
      { status: 500 },
    );
  }
}
