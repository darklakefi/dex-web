import { redirect } from "next/navigation";
import type { SearchParams } from "nuqs/server";

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ lang: string; type: "buy" | "sell" }>;
}) {
  const resolvedSearchParams = await searchParams;
  const resolvedParams = await params;

  const queryString = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        for (const item of value) {
          queryString.append(key, String(item));
        }
      } else {
        queryString.set(key, String(value));
      }
    }
  }
  const queryStringText = queryString.toString();

  const redirectUrl = `/${resolvedParams.lang}${queryStringText ? `?${queryStringText}` : ""}`;

  redirect(redirectUrl as never);
}
