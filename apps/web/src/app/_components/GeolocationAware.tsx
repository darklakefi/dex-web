import { headers } from "next/headers";
import { DisclaimerModalProvider } from "./DisclaimerModalProvider";

/**
 * Server component that reads geolocation headers and passes
 * country information to the client-side disclaimer modal
 */
export async function GeolocationAwareDisclaimerProvider() {
  const headersList = await headers();
  const country = headersList.get("x-vercel-ip-country") || null;

  return <DisclaimerModalProvider country={country} />;
}
