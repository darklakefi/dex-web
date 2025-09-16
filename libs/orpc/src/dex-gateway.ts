import * as fs from "node:fs";
import * as os from "node:os";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import type {
	CheckTradeStatusRequest,
	CheckTradeStatusResponse,
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

const protoDefinition = `
syntax = "proto3";

package darklake.v1;

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

message TokenMetadata {
    string name     = 1;
    string symbol   = 2;
    uint32 decimals = 3;
    string logo_uri = 4;
    string address  = 5;
}

message Trade {
    string trade_id           = 1;
    string order_id           = 2;
    string user_address       = 3;
    TokenMetadata token_x     = 4;
    TokenMetadata token_y     = 5;
    uint64 amount_in          = 6;
    uint64 minimal_amount_out = 7;
    TradeStatus status        = 8;
    string signature          = 9;
    int64 created_at          = 10;
    int64 updated_at          = 11;
    bool is_swap_x_to_y       = 12;
}

message QuoteRequest {
    string token_mint_x = 1;
    string token_mint_y = 2;
    uint64 amount_in = 3;
    bool is_swap_x_to_y = 4;
}

message QuoteResponse {
    string token_mint_x = 1;
    string token_mint_y = 2;
    bool is_swap_x_to_y = 3;
    uint64 amount_in = 4;
    uint64 amount_out = 5;
    uint64 fee_amount = 6;
    double fee_pct = 7;
}

message CreateUnsignedTransactionRequest {
    string user_address = 1;
    string token_mint_x = 2;
    string token_mint_y = 3;
    uint64 amount_in   = 4;
    uint64 min_out     = 5;
    string tracking_id = 6;
    bool is_swap_x_to_y = 7;
    string ref_code = 8;
    string label = 9;
}

message CreateUnsignedTransactionResponse {
    string unsigned_transaction = 1;
    string order_id             = 2;
    string trade_id             = 3;
}

message SendSignedTransactionRequest {
    string signed_transaction = 1;
    string tracking_id = 2;
    string trade_id = 3;
}

message SendSignedTransactionResponse {
    bool success               = 1;
    string trade_id            = 2;
    repeated string error_logs = 3;
}

message CheckTradeStatusRequest {
    string tracking_id = 1;
    string trade_id = 2;
}

message CheckTradeStatusResponse {
    string trade_id    = 1;
    TradeStatus status = 2;
}

message GetTradesListByUserRequest {
    string user_address = 1;
    int32 page_size   = 2;
    int32 page_number = 3;
}

message GetTradesListByUserResponse {
    repeated Trade trades = 1;
    int32 total_pages     = 2;
    int32 current_page    = 3;
}

message GetTokenMetadataRequest {
    oneof search_by {
        string token_address = 1;
        string token_symbol = 2;
        string token_name = 3;
        string substring = 4;
    }
}

message GetTokenMetadataResponse {
    TokenMetadata token_metadata = 1;
}

message TokenAddressesList {
    repeated string token_addresses = 1;
}

message TokenSymbolsList {
    repeated string token_symbols = 1;
}

message TokenNamesList {
    repeated string token_names = 1;
}

message GetTokenMetadataListRequest {
    oneof filter_by {
        TokenAddressesList addresses_list = 1;
        TokenSymbolsList symbols_list     = 2;
        TokenNamesList names_list         = 3;
        string substring = 6;
    }
    int32 page_size   = 4;
    int32 page_number = 5;
}

message GetTokenMetadataListResponse {
    repeated TokenMetadata tokens = 1;
    int32 total_pages             = 2;
    int32 current_page            = 3;
}

service SolanaGatewayService {
    rpc CreateUnsignedTransaction(CreateUnsignedTransactionRequest)
        returns (CreateUnsignedTransactionResponse);

    rpc SendSignedTransaction(SendSignedTransactionRequest)
        returns (SendSignedTransactionResponse);

    rpc CheckTradeStatus(CheckTradeStatusRequest)
        returns (CheckTradeStatusResponse);

    rpc GetTradesListByUser(GetTradesListByUserRequest)
        returns (GetTradesListByUserResponse);

    rpc GetTokenMetadata(GetTokenMetadataRequest)
        returns (GetTokenMetadataResponse);

    rpc GetTokenMetadataList(GetTokenMetadataListRequest)
        returns (GetTokenMetadataListResponse);
}
`;

const config = {
	gatewayHost: process.env.GATEWAY_HOST,
	gatewayPort: parseInt(process.env.GATEWAY_PORT || "50051"),
};

const tempProtoPath = `${os.tmpdir()}/api_${Date.now()}.proto`;
fs.writeFileSync(tempProtoPath, protoDefinition);

const packageDefinition = protoLoader.loadSync(tempProtoPath, {
	defaults: true,
	enums: String,
	keepCase: true,
	longs: String,
	oneofs: true,
});

fs.unlinkSync(tempProtoPath);

const gatewayProto = grpc.loadPackageDefinition(packageDefinition);

function createGrpcClient(): GrpcClient {
	const { darklake } = gatewayProto as any;

	const client = new darklake.v1.SolanaGatewayService(
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
