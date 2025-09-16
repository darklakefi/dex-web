// Export client creation functions (these use dynamic imports for universal compatibility)
export {
  createDarklakeIntegrationsClient,
  createSolanaGatewayClient,
} from "./client";

// Export types only (no service implementations to avoid bundling server dependencies)
export type {
  SolanaGatewayService,
  DarklakeIntegrationsService,
  CheckTradeStatusRequest,
  CheckTradeStatusResponse,
  CreateUnsignedTransactionRequest,
  CreateUnsignedTransactionResponse,
  GetTradesListByUserRequest,
  GetTradesListByUserResponse,
  GetTokenMetadataListRequest,
  GetTokenMetadataListResponse,
  SendSignedTransactionRequest,
  SendSignedTransactionResponse,
  TokenMetadata,
  Trade,
} from "./generated/api_pb";

export {
  CheckTradeStatusRequestSchema as CheckTradeStatusRequestPB,
  CheckTradeStatusResponseSchema as CheckTradeStatusResponsePB,
  CreateCustomTokenRequestSchema as CreateCustomTokenRequestPB,
  CreateCustomTokenResponseSchema as CreateCustomTokenResponsePB,
  CreateUnsignedTransactionRequestSchema as CreateUnsignedTransactionRequestPB,
  CreateUnsignedTransactionResponseSchema as CreateUnsignedTransactionResponsePB,
  DeleteCustomTokenRequestSchema as DeleteCustomTokenRequestPB,
  DeleteCustomTokenResponseSchema as DeleteCustomTokenResponsePB,
  EditCustomTokenRequestSchema as EditCustomTokenRequestPB,
  EditCustomTokenResponseSchema as EditCustomTokenResponsePB,
  GetCustomTokenRequestSchema as GetCustomTokenRequestPB,
  GetCustomTokenResponseSchema as GetCustomTokenResponsePB,
  GetCustomTokensRequestSchema as GetCustomTokensRequestPB,
  GetCustomTokensResponseSchema as GetCustomTokensResponsePB,
  GetTokenMetadataListRequestSchema as GetTokenMetadataListRequestPB,
  GetTokenMetadataListResponseSchema as GetTokenMetadataListResponsePB,
  GetTokenMetadataRequestSchema as GetTokenMetadataRequestPB,
  GetTokenMetadataResponseSchema as GetTokenMetadataResponsePB,
  GetTradesListByUserRequestSchema as GetTradesListByUserRequestPB,
  GetTradesListByUserResponseSchema as GetTradesListByUserResponsePB,
  Network,
  QuoteRequestSchema as QuoteRequestPB,
  QuoteResponseSchema as QuoteResponsePB,
  SendSignedTransactionRequestSchema as SendSignedTransactionRequestPB,
  SendSignedTransactionResponseSchema as SendSignedTransactionResponsePB,
  TokenMetadataSchema as TokenMetadataPB,
  TradeSchema as TradePB,
  TradeStatus,
} from "./generated/api_pb";
