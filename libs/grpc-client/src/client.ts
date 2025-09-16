function isServer() {
  return typeof window === "undefined";
}

export async function createSolanaGatewayClient(baseUrl?: string) {
  if (isServer()) {
    const serverClient = await import("./client-server");
    return serverClient.createSolanaGatewayClient(baseUrl);
  } else {
    const webClient = await import("./client-web");
    return webClient.createSolanaGatewayClient(baseUrl);
  }
}

export async function createDarklakeIntegrationsClient(baseUrl?: string) {
  if (isServer()) {
    const serverClient = await import("./client-server");
    return serverClient.createDarklakeIntegrationsClient(baseUrl);
  } else {
    const webClient = await import("./client-web");
    return webClient.createDarklakeIntegrationsClient(baseUrl);
  }
}
