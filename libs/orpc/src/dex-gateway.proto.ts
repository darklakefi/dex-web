// Define the proto definition directly in code instead of loading from a file, because some problems with loading from a file in nextjs (just for fast development)
export const PROTO_DEFINITION = `
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

message Trade {
    string trade_id          = 1;
    string order_id          = 2;
    string user_address      = 3;
    string token_mint_x      = 4;
    string token_mint_y      = 5;
    int64 amount_in          = 6;
    int64 minimal_amount_out = 7;
    TradeStatus status       = 8;
    string signature         = 9;
    int64 created_at         = 10;
    int64 updated_at         = 11;
}

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
}

message SendSignedTransactionRequest {
    string signed_transaction = 1;
    string tracking_id        = 2;
    string trade_id           = 3;
}

message SendSignedTransactionResponse {
    bool success               = 1;
    string trade_id            = 2;
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

message GetTradesListByUserRequest {
    string user_address = 1;
    int32 page_size     = 2;
    int32 page_number   = 3;
}

message GetTradesListByUserResponse {
    repeated Trade trades = 1;
    int32 total_pages     = 2;
    int32 current_page    = 3;
}

// --------------------------------- SERVICES

service SolanaGatewayService {
    rpc CreateUnsignedTransaction(CreateUnsignedTransactionRequest)
        returns (CreateUnsignedTransactionResponse);

    rpc SendSignedTransaction(SendSignedTransactionRequest)
        returns (SendSignedTransactionResponse);

    rpc CheckTradeStatus(CheckTradeStatusRequest)
        returns (CheckTradeStatusResponse);

    rpc GetTradesListByUser(GetTradesListByUserRequest)
        returns (GetTradesListByUserResponse);
}
`;
