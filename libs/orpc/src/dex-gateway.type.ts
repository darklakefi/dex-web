export enum Network {
  DEVNET = 2,
  MAINNET = 0,
  TESTNET = 1,
}

export enum TradeStatus {
  UNSIGNED = "UNSIGNED",
  SIGNED = "SIGNED",
  CONFIRMED = "CONFIRMED",
  SETTLED = "SETTLED",
  SLASHED = "SLASHED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
}

export interface WalletEmulatorConfig {
  privateKeyBytes: string;
  gatewayHost: string;
  gatewayPort: number;
  tokenX: string;
  tokenY: string;
  inputAmount: number;
  minOut: number;
  network: Network;
  trackingId: string;
}

// gRPC client types
export interface GrpcClient {
  swap: (request: SwapRequest) => Promise<SwapResponse>;
  submitSignedTransaction: (
    request: SignedTransactionRequest,
  ) => Promise<SignedTransactionResponse>;
  checkTradeStatus: (
    request: CheckTradeStatusRequest,
  ) => Promise<CheckTradeStatusResponse>;
}

export interface SwapRequest {
  user_address: string;
  token_mint_x: string;
  token_mint_y: string;
  amount_in: number;
  min_out: number;
  is_swap_x_to_y: boolean;
  network: Network;
  tracking_id: string;
}

export interface SwapResponse {
  unsigned_transaction: string; // Base64 encoded transaction
  trade_id: string;
}

export interface SignedTransactionRequest {
  signed_transaction: string; // Base64 encoded signed transaction
  trade_id: string;
  tracking_id: string;
}

export interface SignedTransactionResponse {
  trade_id: string;
  success: boolean;
  error_logs: string;
}

export interface CheckTradeStatusRequest {
  tracking_id: string;
  trade_id: string;
}

export interface CheckTradeStatusResponse {
  trade_id: string;
  status: TradeStatus;
}
