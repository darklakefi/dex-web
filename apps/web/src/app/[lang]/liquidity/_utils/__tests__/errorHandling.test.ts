import { describe, it, expect, vi } from 'vitest';
import {
  LiquidityError,
  createTransactionError,
  handleAsyncError,
  validateRequired,
  validateWalletConnection,
} from '../errorHandling';
describe('errorHandling', () => {
  describe('LiquidityError', () => {
    it('should create error with message only', () => {
      const error = new LiquidityError('Test error message');
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('LiquidityError');
      expect(error.context).toBeUndefined();
      expect(error).toBeInstanceOf(Error);
    });
    it('should create error with message and context', () => {
      const context = { tokenA: 'SOL', tokenB: 'USDC', amount: 100 };
      const error = new LiquidityError('Insufficient balance', context);
      expect(error.message).toBe('Insufficient balance');
      expect(error.name).toBe('LiquidityError');
      expect(error.context).toEqual(context);
    });
  });
  describe('createTransactionError', () => {
    it('should create error from Error instance', () => {
      const originalError = new Error('Network timeout');
      const result = createTransactionError(originalError);
      expect(result).toEqual({
        message: 'Network timeout',
        context: undefined,
      });
    });
    it('should create error from string', () => {
      const result = createTransactionError('String error message');
      expect(result).toEqual({
        message: 'String error message',
        context: undefined,
      });
    });
    it('should create error with context', () => {
      const context = { retry: 3, endpoint: '/api/liquidity' };
      const result = createTransactionError('API failed', context);
      expect(result).toEqual({
        message: 'API failed',
        context,
      });
    });
    it('should handle unknown error types', () => {
      const result = createTransactionError({ code: 500, data: 'Server error' });
      expect(result.message).toBe('[object Object]');
      expect(result.context).toBeUndefined();
    });
  });
  describe('handleAsyncError', () => {
    it('should return successful operation result', async () => {
      const successfulOperation = vi.fn().mockResolvedValue('success result');
      const result = await handleAsyncError(
        successfulOperation,
        'Operation failed'
      );
      expect(result).toBe('success result');
      expect(successfulOperation).toHaveBeenCalledOnce();
    });
    it('should wrap Error in LiquidityError', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Network error'));
      await expect(
        handleAsyncError(failingOperation, 'Transaction failed')
      ).rejects.toThrow(LiquidityError);
      await expect(
        handleAsyncError(failingOperation, 'Transaction failed')
      ).rejects.toThrow('Transaction failed: Network error');
    });
    it('should handle string errors', async () => {
      const failingOperation = vi.fn().mockRejectedValue('String error');
      await expect(
        handleAsyncError(failingOperation, 'Operation failed')
      ).rejects.toThrow('Operation failed: String error');
    });
    it('should include context in thrown error', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Test error'));
      const context = { tokenPair: 'SOL/USDC', amount: 1000 };
      try {
        await handleAsyncError(failingOperation, 'Swap failed', context);
      } catch (error) {
        expect(error).toBeInstanceOf(LiquidityError);
        expect((error as LiquidityError).context).toEqual(context);
      }
    });
  });
  describe('validateRequired', () => {
    it('should pass for valid values', () => {
      expect(() => validateRequired('valid string', 'test field')).not.toThrow();
      expect(() => validateRequired(123, 'number field')).not.toThrow();
      expect(() => validateRequired([], 'array field')).not.toThrow();
      expect(() => validateRequired({}, 'object field')).not.toThrow();
    });
    it('should throw for null', () => {
      expect(() => validateRequired(null, 'null field'))
        .toThrow(LiquidityError);
      expect(() => validateRequired(null, 'null field'))
        .toThrow('null field is required');
    });
    it('should throw for undefined', () => {
      expect(() => validateRequired(undefined, 'undefined field'))
        .toThrow(LiquidityError);
      expect(() => validateRequired(undefined, 'undefined field'))
        .toThrow('undefined field is required');
    });
    it('should allow falsy but defined values', () => {
      expect(() => validateRequired('', 'empty string')).not.toThrow();
      expect(() => validateRequired(0, 'zero')).not.toThrow();
      expect(() => validateRequired(false, 'false boolean')).not.toThrow();
    });
  });
  describe('validateWalletConnection', () => {
    it('should pass for valid wallet connection', () => {
      const publicKey = { toBase58: () => 'valid-key' };
      const walletAdapter = { wallet: { name: 'Phantom' } };
      expect(() => validateWalletConnection(publicKey, walletAdapter))
        .not.toThrow();
    });
    it('should throw for missing public key', () => {
      const walletAdapter = { wallet: { name: 'Phantom' } };
      expect(() => validateWalletConnection(null, walletAdapter))
        .toThrow('Wallet public key is required');
    });
    it('should throw for missing wallet adapter', () => {
      const publicKey = { toBase58: () => 'valid-key' };
      expect(() => validateWalletConnection(publicKey, null))
        .toThrow('Wallet adapter is required');
    });
    it('should throw for wallet adapter without wallet', () => {
      const publicKey = { toBase58: () => 'valid-key' };
      const walletAdapter = { wallet: null };
      expect(() => validateWalletConnection(publicKey, walletAdapter))
        .toThrow('Wallet adapter is required');
    });
    it('should throw for undefined wallet adapter', () => {
      const publicKey = { toBase58: () => 'valid-key' };
      const walletAdapter = {};
      expect(() => validateWalletConnection(publicKey, walletAdapter))
        .toThrow('Wallet adapter is required');
    });
  });
});