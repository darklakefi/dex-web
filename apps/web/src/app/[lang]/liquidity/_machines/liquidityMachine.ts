import { assign, setup } from 'xstate';

interface PoolDetails {
  poolAddress?: string;
  tokenXMint?: string;
  tokenYMint?: string;
  price?: string;
}

interface TokenAccount {
  address?: string;
  amount?: number;
  decimals?: number;
  symbol?: string;
  tokenAccounts?: Array<{
    address: string;
    amount: number;
    decimals: number;
    symbol: string;
  }>;
}

export interface LiquidityInput {
  poolDetails?: PoolDetails | null;
  buyTokenAccount?: TokenAccount | null;
  sellTokenAccount?: TokenAccount | null;
}

export interface LiquidityContext {
  error: string | null;
  tokenAAmount: string;
  tokenBAmount: string;
  transactionSignature?: string;
  poolDetails: PoolDetails | null;
  tokenAccounts: {
    buy: TokenAccount | null;
    sell: TokenAccount | null;
  };
  isDataReady: boolean;
}

export type LiquidityEvent =
  | { type: 'DATA_LOADED'; poolDetails?: PoolDetails; tokenAccounts?: { buy: TokenAccount | null; sell: TokenAccount | null } }
  | { type: 'SUBMIT'; data: { tokenAAmount: string; tokenBAmount: string } }
  | { type: 'SUCCESS'; signature?: string }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' }
  | { type: 'RETRY' };

export const liquidityMachine = setup({
  types: {} as {
    input: LiquidityInput;
    context: LiquidityContext;
    events: LiquidityEvent;
  },
  actions: {
    setDataLoaded: assign({
      poolDetails: ({ event }) => (event.type === 'DATA_LOADED' ? event.poolDetails || null : null),
      tokenAccounts: ({ event }) => (event.type === 'DATA_LOADED' ? event.tokenAccounts || { buy: null, sell: null } : { buy: null, sell: null }),
      isDataReady: true,
    }),
    setFormData: assign({
      tokenAAmount: ({ event }) => (event.type === 'SUBMIT' ? event.data.tokenAAmount : '0'),
      tokenBAmount: ({ event }) => (event.type === 'SUBMIT' ? event.data.tokenBAmount : '0'),
      error: null,
    }),
    setTransactionSignature: assign({
      transactionSignature: ({ event }) => (event.type === 'SUCCESS' ? event.signature : undefined),
      error: null,
    }),
    setError: assign({
      error: ({ event }) => (event.type === 'ERROR' ? event.error : null),
    }),
    clearError: assign({
      error: null,
    }),
    clearContext: assign({
      error: null,
      tokenAAmount: '0',
      tokenBAmount: '0',
      transactionSignature: undefined,
    }),
  },
}).createMachine({
  id: 'liquidity',
  initial: 'initializing',
  context: ({ input }) => ({
    error: null,
    tokenAAmount: '0',
    tokenBAmount: '0',
    transactionSignature: undefined,
    poolDetails: input?.poolDetails || null,
    tokenAccounts: {
      buy: input?.buyTokenAccount || null,
      sell: input?.sellTokenAccount || null,
    },
    isDataReady: !!(input?.poolDetails && input?.buyTokenAccount && input?.sellTokenAccount),
  }),
  states: {
    initializing: {
      after: {
        1000: {
          target: 'editing',
          actions: assign({ isDataReady: true }),
        },
      },
      on: {
        DATA_LOADED: {
          target: 'editing',
          actions: 'setDataLoaded',
        },
      },
    },
    editing: {
      entry: 'clearError',
      on: {
        DATA_LOADED: {
          actions: 'setDataLoaded',
        },
        SUBMIT: {
          target: 'submitting',
          actions: 'setFormData',
        },
      },
    },
    submitting: {
      on: {
        SUCCESS: {
          target: 'success',
          actions: 'setTransactionSignature',
        },
        ERROR: {
          target: 'error',
          actions: 'setError',
        },
      },
    },
    success: {
      on: {
        RESET: {
          target: 'editing',
          actions: 'clearContext',
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: 'submitting',
          actions: 'clearError',
        },
        RESET: {
          target: 'editing',
          actions: 'clearContext',
        },
      },
    },
  },
});

export type LiquidityMachine = typeof liquidityMachine;

export type LiquidityState = 'initializing' | 'editing' | 'submitting' | 'success' | 'error';

export const isLiquidityState = (state: string): state is LiquidityState => {
  return ['initializing', 'editing', 'submitting', 'success', 'error'].includes(state);
};