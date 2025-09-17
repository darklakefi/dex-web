import {
  createDarklakeIntegrationsClient as createDarklakeIntegrationsWebClient,
  createSolanaGatewayClient as createSolanaGatewayWebClient,
} from "./client-web";

function isServer() {
  return typeof window === "undefined";
}

export async function createSolanaGatewayClient(baseUrl?: string) {
  if (isServer()) {
    const { createSolanaGatewayClient } = await import("./client-server");
    return createSolanaGatewayClient(baseUrl);
  } else {
    return createSolanaGatewayWebClient(baseUrl);
  }
}

export async function createDarklakeIntegrationsClient(baseUrl?: string) {
  if (isServer()) {
    const { createDarklakeIntegrationsClient } = await import(
      "./client-server"
    );
    return createDarklakeIntegrationsClient(baseUrl);
  } else {
    return createDarklakeIntegrationsWebClient(baseUrl);
  }
}
