/**  biome-ignore lint/suspicious/noExplicitAny: will be removed **/

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type {
  CheckTradeStatusRequest,
  CheckTradeStatusResponse,
  GrpcClient,
  SignedTransactionRequest,
  SignedTransactionResponse,
  SwapRequest,
  SwapResponse,
} from "./dex-gateway.type";

const config = {
  gatewayHost:
    process.env.GATEWAY_SWAP_URL ||
    "dex-gateway-staging-srv01.dex.darklake.fi" ||
    "localhost",
  gatewayPort: parseInt(process.env.GATEWAY_PORT || "50051"),
};

// Define the proto definition directly in code instead of loading from a file
const PROTO_DEFINITION = `
syntax = "proto3";

package gateway_solana;

// --------------------------------- ENUMS

enum Network {
    MAINNET_BETA = 0;
    TESTNET      = 1;
    DEVNET       = 2;
}

enum TradeStatus {
    UNSIGNED  = 0;
    SIGNED    = 1;
    CONFIRMED = 2;
    SETTLED   = 3;
    SLASHED   = 4;
    CANCELLED = 5;
    FAILED    = 6;
}

// --------------------------------- MESSAGES

message CreateUnsignedTransactionRequest {
    string user_address = 1;
    string token_mint_x = 2;
    string token_mint_y = 3;
    uint64 amount_in    = 4;
    uint64 min_out      = 5;
    string tracking_id  = 6;
    bool is_swap_x_to_y = 7;
}

message CreateUnsignedTransactionResponse {
    // Base64 encoded transaction
    string unsigned_transaction = 1;
    string order_id             = 2;
    string trade_id             = 3;
    // TODO: DAR-488 discuss necessary return values
}

message SendSignedTransactionRequest {
    string signed_transaction = 1;
    string tracking_id        = 2;
    string trade_id           = 3;
}

message SendSignedTransactionResponse {
    bool success    = 1;
    string trade_id = 2;
    repeated string error_logs = 3;
}

message CheckTradeStatusRequest {
    string tracking_id = 1;
    string trade_id    = 2;
}

message CheckTradeStatusResponse {
    string trade_id    = 1;
    TradeStatus status = 2;
}

// --------------------------------- SERVICES

service SolanaGatewayService {
    rpc CreateUnsignedTransaction(CreateUnsignedTransactionRequest)
        returns (CreateUnsignedTransactionResponse);

    rpc SendSignedTransaction(SendSignedTransactionRequest)
        returns (SendSignedTransactionResponse);

    rpc CheckTradeStatus(CheckTradeStatusRequest)
        returns (CheckTradeStatusResponse);
}
`;

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
