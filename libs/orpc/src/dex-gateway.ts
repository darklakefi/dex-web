import type { Client } from "@connectrpc/connect";
import {
  createSolanaGatewayClient,
  type SolanaGatewayService,
} from "@dex-web/grpc-client/server";

let dexGatewayClientInstance: Client<typeof SolanaGatewayService> | null = null;

export function getDexGatewayClient(): Client<typeof SolanaGatewayService> {
  if (!dexGatewayClientInstance) {
    dexGatewayClientInstance = createSolanaGatewayClient();
  }
  return dexGatewayClientInstance;
}

export function closeDexGatewayClient(): void {
  dexGatewayClientInstance = null;
}
