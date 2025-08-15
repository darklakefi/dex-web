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
  getTradesListByUser: (
    request: GetTradesListByUserRequest,
  ) => Promise<GetTradesListByUserResponse>;
  getTokenMetadata: (
    request: GetTokenMetadataRequest,
  ) => Promise<GetTokenMetadataResponse>;
  getTokenMetadataList: (
    request: GetTokenMetadataListRequest,
  ) => Promise<GetTokenMetadataListResponse>;
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

export interface AddLiquidityRequest {
  user_address: string;
  token_mint_x: string;
  token_mint_y: string;
  amount_in: number;
  min_out: number;
}

export interface AddLiquidityResponse {
  unsigned_transaction: string; // Base64 encoded transaction
  trade_id: string;
}

export interface SwapResponse {
  unsigned_transaction: string; // Base64 encoded transaction
  trade_id: string;
}

export interface SignedTransactionRequest {
  signed_transaction: string; // Base64 encoded signed transaction
  trade_id?: string;
  tracking_id: string;
}

export interface SignedTransactionResponse {
  trade_id?: string;
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

export interface GetTradesListByUserRequest {
  user_address: string;
  page_size: number;
  page_number: number;
}

export interface GetTradesListByUserResponse {
  trades: Trade[];
  total_pages: number;
  current_page: number;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  logo_uri: string;
  address: string;
}

export interface Trade {
  trade_id: string;
  order_id: string;
  user_address: string;
  token_x: TokenMetadata;
  token_y: TokenMetadata;
  amount_in: number;
  minimal_amount_out: number;
  status: TradeStatus;
  signature: string;
  created_at: number;
  updated_at: number;
  is_swap_x_to_y: boolean;
}

export interface GetTokenMetadataRequest {
  token_address?: string;
  token_symbol?: string;
  token_name?: string;
}

export interface GetTokenMetadataResponse {
  token_metadata: TokenMetadata;
}

export interface TokenAddressesList {
  token_addresses: string[];
}

export interface TokenSymbolsList {
  token_symbols: string[];
}

export interface TokenNamesList {
  token_names: string[];
}

export interface GetTokenMetadataListRequest {
  addresses_list?: TokenAddressesList;
  symbols_list?: TokenSymbolsList;
  names_list?: TokenNamesList;
  page_size: number;
  page_number: number;
}

export interface GetTokenMetadataListResponse {
  tokens: TokenMetadata[];
  total_pages: number;
  current_page: number;
}
