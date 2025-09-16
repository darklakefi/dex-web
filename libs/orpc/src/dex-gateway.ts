import {
  createSolanaGatewayClient,
} from "@dex-web/grpc-client";

let dexGatewayClientInstance: Awaited<ReturnType<typeof createSolanaGatewayClient>> | null = null;

export async function getDexGatewayClient(): Promise<Awaited<ReturnType<typeof createSolanaGatewayClient>>> {
  if (!dexGatewayClientInstance) {
    dexGatewayClientInstance = await createSolanaGatewayClient();
  }
  return dexGatewayClientInstance;
}

export function closeDexGatewayClient(): void {
  dexGatewayClientInstance = null;
}
