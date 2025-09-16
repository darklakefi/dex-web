import { createClient } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import {
  DarklakeIntegrationsService,
  SolanaGatewayService,
} from "./generated/api_connect";

const grpcClientUrl = `http://${process.env.GATEWAY_HOST}:${process.env.GATEWAY_PORT || 50051}`;

export function createSolanaGatewayClient(baseUrl: string = grpcClientUrl) {
  const transport = createGrpcTransport({
    baseUrl,
    httpVersion: "1.1",
  });

  return createClient(SolanaGatewayService, transport);
}

export function createDarklakeIntegrationsClient(
  baseUrl: string = process.env.GRPC_ENDPOINT!,
) {
  const transport = createGrpcTransport({
    baseUrl,
    httpVersion: "1.1",
  });

  return createClient(DarklakeIntegrationsService, transport);
}
