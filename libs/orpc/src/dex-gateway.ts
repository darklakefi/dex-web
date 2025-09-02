/**  biome-ignore lint/suspicious/noExplicitAny: will be removed **/

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { PROTO_DEFINITION } from "./dex-gateway.proto";
import type {
  CheckTradeStatusRequest,
  CheckTradeStatusResponse,
  CreateCustomTokenRequest,
  CreateCustomTokenResponse,
  DeleteCustomTokenRequest,
  DeleteCustomTokenResponse,
  EditCustomTokenRequest,
  EditCustomTokenResponse,
  GetCustomTokenRequest,
  GetCustomTokenResponse,
  GetCustomTokensRequest,
  GetCustomTokensResponse,
  GetTokenMetadataListRequest,
  GetTokenMetadataListResponse,
  GetTokenMetadataRequest,
  GetTokenMetadataResponse,
  GetTradesListByUserRequest,
  GetTradesListByUserResponse,
  GrpcClient,
  SignedTransactionRequest,
  SignedTransactionResponse,
  SwapRequest,
  SwapResponse,
} from "./dex-gateway.type";

const config = {
  gatewayHost: process.env.GATEWAY_HOST,
  gatewayPort: parseInt(process.env.GATEWAY_PORT || "50051"),
};

// Create a unique temporary file path
const tempDir = os.tmpdir();
const randomId = crypto.randomBytes(16).toString("hex");
const tempProtoPath = path.join(tempDir, `dex-gateway-${randomId}.proto`);

// Write the proto definition to the temporary file
fs.writeFileSync(tempProtoPath, PROTO_DEFINITION);

// Load the proto from the temporary file
const packageDefinition = protoLoader.loadSync(tempProtoPath, {
  defaults: true,
  enums: String,
  keepCase: true,
  longs: String,
  oneofs: true,
});

// Clean up the temporary file
try {
  fs.unlinkSync(tempProtoPath);
} catch (err) {
  // Ignore cleanup errors
  console.warn("Failed to clean up temporary proto file:", err);
}

const gatewayProto = grpc.loadPackageDefinition(packageDefinition) as any;

// Create gRPC client
function createGrpcClient(): GrpcClient {
  const { gateway_solana } = gatewayProto;

  const client = new gateway_solana.SolanaGatewayService(
    `${config.gatewayHost}:${config.gatewayPort}`,
    grpc.credentials.createInsecure(),
  );

  return {
    checkTradeStatus: (
      request: CheckTradeStatusRequest,
    ): Promise<CheckTradeStatusResponse> => {
      return new Promise((resolve, reject) => {
        client.CheckTradeStatus(
          request,
          (error: any, response: CheckTradeStatusResponse) => {
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          },
        );
      });
    },
    createCustomToken: (
      request: CreateCustomTokenRequest,
    ): Promise<CreateCustomTokenResponse> => {
      return new Promise((resolve, reject) => {
        client.CreateCustomToken(
          request,
          (error: unknown, response: CreateCustomTokenResponse) => {
            if (error) reject(error);
            else resolve(response);
          },
        );
      });
    },
    deleteCustomToken: (
      request: DeleteCustomTokenRequest,
    ): Promise<DeleteCustomTokenResponse> => {
      return new Promise((resolve, reject) => {
        client.DeleteCustomToken(
          request,
          (error: unknown, response: DeleteCustomTokenResponse) => {
            if (error) reject(error);
            else resolve(response);
          },
        );
      });
    },
    editCustomToken: (
      request: EditCustomTokenRequest,
    ): Promise<EditCustomTokenResponse> => {
      return new Promise((resolve, reject) => {
        client.EditCustomToken(
          request,
          (error: unknown, response: EditCustomTokenResponse) => {
            if (error) reject(error);
            else resolve(response);
          },
        );
      });
    },
    getCustomToken: (
      request: GetCustomTokenRequest,
    ): Promise<GetCustomTokenResponse> => {
      return new Promise((resolve, reject) => {
        client.GetCustomToken(
          request,
          (error: unknown, response: GetCustomTokenResponse) => {
            if (error) reject(error);
            else resolve(response);
          },
        );
      });
    },
    getCustomTokens: (
      request: GetCustomTokensRequest,
    ): Promise<GetCustomTokensResponse> => {
      return new Promise((resolve, reject) => {
        client.GetCustomTokens(
          request,
          (error: unknown, response: GetCustomTokensResponse) => {
            if (error) reject(error);
            else resolve(response);
          },
        );
      });
    },
    getTokenMetadata: (
      request: GetTokenMetadataRequest,
    ): Promise<GetTokenMetadataResponse> => {
      return new Promise((resolve, reject) => {
        client.GetTokenMetadata(
          request,
          (error: any, response: GetTokenMetadataResponse) => {
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          },
        );
      });
    },
    getTokenMetadataList: (
      request: GetTokenMetadataListRequest,
    ): Promise<GetTokenMetadataListResponse> => {
      return new Promise((resolve, reject) => {
        client.GetTokenMetadataList(
          request,
          (error: any, response: GetTokenMetadataListResponse) => {
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          },
        );
      });
    },
    getTradesListByUser: (
      request: GetTradesListByUserRequest,
    ): Promise<GetTradesListByUserResponse> => {
      return new Promise((resolve, reject) => {
        client.GetTradesListByUser(
          request,
          (error: any, response: GetTradesListByUserResponse) => {
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          },
        );
      });
    },
    submitSignedTransaction: (
      request: SignedTransactionRequest,
    ): Promise<SignedTransactionResponse> => {
      return new Promise((resolve, reject) => {
        client.SendSignedTransaction(
          request,
          (error: any, response: SignedTransactionResponse) => {
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          },
        );
      });
    },
    swap: (request: SwapRequest): Promise<SwapResponse> => {
      return new Promise((resolve, reject) => {
        client.CreateUnsignedTransaction(
          request,
          (error: any, response: SwapResponse) => {
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          },
        );
      });
    },
  };
}

// Singleton instance for the client
let dexGatewayClientInstance: GrpcClient | null = null;

// Get or create the client
export function getDexGatewayClient(): GrpcClient {
  if (!dexGatewayClientInstance) {
    dexGatewayClientInstance = createGrpcClient();
  }

  return dexGatewayClientInstance;
}

// Close the client connection
export function closeDexGatewayClient(): void {
  if (dexGatewayClientInstance) {
    // Use the proper type for closing a client
    grpc.closeClient(dexGatewayClientInstance as unknown as grpc.Client);
    dexGatewayClientInstance = null;
  }
}
