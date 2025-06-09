import "dotenv/config";
export function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/rpc`;
  }

  return `http://localhost:${process.env.PORT ?? 3000}/rpc`;
}
