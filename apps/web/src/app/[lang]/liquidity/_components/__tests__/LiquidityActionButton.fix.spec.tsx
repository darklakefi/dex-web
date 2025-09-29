import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LiquidityActionButton } from '../LiquidityActionButton';
import { LiquidityFormStateProvider } from '../LiquidityContexts';

// Mock the dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@tanstack/react-form', () => ({
  useStore: vi.fn(() => ({
    values: {
      tokenAAmount: '0',
      tokenBAmount: '0',
      initialPrice: '1',
    },
  })),
}));

vi.mock('../_hooks/useLiquidityValidation', () => ({
  useLiquidityValidation: () => ({
    errors: {},
    hasInsufficientBalance: false,
    hasAmounts: false,
    canSubmit: false,
  }),
}));

vi.mock('../LiquidityContexts', () => ({
  useLiquidityFormState: () => ({
    state: {
      getSnapshot: () => ({
        context: {
          poolDetails: null,
          buyTokenAccount: null,
          sellTokenAccount: null,
          error: null,
          transactionSignature: null,
          liquidityStep: 0,
          isCalculating: false,
        },
      }),
    },
    isCalculating: false,
    form: {
      store: {},
    },
  }),
}));

describe('LiquidityActionButton Fix', () => {
  it('should render without getSnapshot error', () => {
    const mockProps = {
      publicKey: null,
      buyTokenAccount: undefined,
      sellTokenAccount: undefined,
      poolDetails: null,
      tokenAAddress: null,
      tokenBAddress: null,
      isPoolLoading: false,
      isTokenAccountsLoading: false,
      onSubmit: vi.fn(),
    };

    expect(() => {
      render(<LiquidityActionButton {...mockProps} />);
    }).not.toThrow();

    // Should render the connect wallet button when no public key
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });
});