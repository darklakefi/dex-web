import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useSecureInput,
  useTransactionLimits,
  useSlippageWarnings,
  useSecurityMonitoring,
  useMultiSigValidation,
  useLiquiditySecurity,
} from '../useSecurityHooks';

// Mock wallet hooks
vi.mock('../../../../hooks/useWalletCache', () => ({
  useWalletPublicKey: () => ({
    data: {
      toBase58: () => 'test-wallet-address',
    },
  }),
}));

// Mock security validation
vi.mock('../_utils/securityValidation', () => ({
  sanitizeTextInput: vi.fn((input) => input.replace(/<script>/g, '')),
  sanitizeNumericInput: vi.fn((input) => input.replace(/[^0-9.]/g, '')),
  validateTokenAmount: vi.fn(() => ({ isValid: true })),
  validateSlippage: vi.fn(() => ({ isValid: true, warnings: [], severity: 'low' })),
  validateLiquidityTransaction: vi.fn(() => ({ isValid: true })),
  checkRateLimit: vi.fn(() => ({ isValid: true })),
  detectSuspiciousActivity: vi.fn(() => ({ isValid: true })),
  simulateCSPViolation: vi.fn(() => false),
  SECURITY_CONSTANTS: {
    MIN_TOKEN_AMOUNT: 0.000000001,
    MAX_TOKEN_AMOUNT: 1000000000000000000,
  },
}));

describe('Security Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSecureInput', () => {
    it('should initialize with provided initial value', () => {
      const { result } = renderHook(() => useSecureInput('initial'));

      expect(result.current.value).toBe('initial');
      expect(result.current.sanitizedValue).toBe('initial');
    });

    it('should handle text input changes', () => {
      const { result } = renderHook(() => useSecureInput());

      act(() => {
        result.current.handleChange('hello<script>alert("xss")</script>world');
      });

      expect(result.current.value).toBe('hello<script>alert("xss")</script>world');
      expect(result.current.sanitizedValue).toBe('helloworld');
    });

    it('should handle numeric input changes', () => {
      const { result } = renderHook(() => useSecureInput());

      act(() => {
        result.current.handleChange('abc123.456def', { numeric: true });
      });

      expect(result.current.value).toBe('abc123.456def');
      expect(result.current.sanitizedValue).toBe('123.456');
      expect(result.current.isNumeric).toBe(true);
    });

    it('should enforce max length', () => {
      const { result } = renderHook(() => useSecureInput());

      act(() => {
        result.current.handleChange('very long input', { maxLength: 5 });
      });

      expect(result.current.sanitizedValue).toBe('very ');
    });

    it('should reset to initial value', () => {
      const { result } = renderHook(() => useSecureInput('initial'));

      act(() => {
        result.current.handleChange('changed');
      });

      expect(result.current.value).toBe('changed');

      act(() => {
        result.current.reset();
      });

      expect(result.current.value).toBe('initial');
    });

    it('should check for XSS', () => {
      const { result } = renderHook(() => useSecureInput());

      act(() => {
        result.current.handleChange('safe content');
      });

      expect(result.current.checkForXSS()).toBe(false);
    });

    it('should track dirty state', () => {
      const { result } = renderHook(() => useSecureInput('initial'));

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.handleChange('changed');
      });

      expect(result.current.isDirty).toBe(true);
    });

    it('should track sanitized state', () => {
      const { result } = renderHook(() => useSecureInput());

      act(() => {
        result.current.handleChange('clean input');
      });

      expect(result.current.isSanitized).toBe(true);

      act(() => {
        result.current.handleChange('dirty<script>input');
      });

      expect(result.current.isSanitized).toBe(false);
    });
  });

  describe('useTransactionLimits', () => {
    it('should validate amounts', () => {
      const { result } = renderHook(() => useTransactionLimits());

      const validation = result.current.validateAmount('100', 9, '1000');
      expect(validation.isValid).toBe(true);
    });

    it('should calculate max safe amount', () => {
      const { result } = renderHook(() => useTransactionLimits());

      const maxSafe = result.current.getMaxSafeAmount('1000', 0.05);
      expect(maxSafe).toBe('950');
    });

    it('should check amount safety with warnings', () => {
      const { result } = renderHook(() => useTransactionLimits());

      const safety = result.current.checkAmountSafety('950', '1000', 0.9);
      expect(safety.isWarning).toBe(true);
      expect(safety.message).toContain('95%');
    });

    it('should handle invalid amounts gracefully', () => {
      const { result } = renderHook(() => useTransactionLimits());

      const maxSafe = result.current.getMaxSafeAmount('invalid', 0.05);
      expect(maxSafe).toBe('0');

      const safety = result.current.checkAmountSafety('invalid', '1000');
      expect(safety.isWarning).toBe(false);
    });
  });

  describe('useSlippageWarnings', () => {
    it('should initialize with default slippage', () => {
      const { result } = renderHook(() => useSlippageWarnings());

      expect(result.current.slippage).toBe('0.5');
      expect(result.current.warnings).toEqual([]);
      expect(result.current.severity).toBe('low');
    });

    it('should update slippage and warnings', () => {
      const { result } = renderHook(() => useSlippageWarnings());

      act(() => {
        result.current.updateSlippage('5.0');
      });

      expect(result.current.slippage).toBe('5.0');
    });

    it('should provide slippage recommendations', () => {
      const { result } = renderHook(() => useSlippageWarnings());

      const recommendation = result.current.getSlippageRecommendation('stable-stable', 'high');
      expect(recommendation).toBe('0.05');
    });

    it('should calculate price impact warnings', () => {
      const { result } = renderHook(() => useSlippageWarnings());

      const impact = result.current.getImpactWarning('1000', '5000');
      expect(impact.hasWarning).toBe(true);
      expect(impact.message).toContain('High price impact');
    });

    it('should handle invalid price impact calculation', () => {
      const { result } = renderHook(() => useSlippageWarnings());

      const impact = result.current.getImpactWarning('invalid', '5000');
      expect(impact.hasWarning).toBe(false);
    });
  });

  describe('useSecurityMonitoring', () => {
    it('should record submissions', () => {
      const { result } = renderHook(() => useSecurityMonitoring());

      act(() => {
        result.current.recordSubmission({
          tokenAAmount: '100',
          tokenBAmount: '200',
          tokenAAddress: 'token-a',
          tokenBAddress: 'token-b',
        });
      });

      const status = result.current.getSecurityStatus();
      expect(status.submissionCount).toBe(1);
    });

    it('should check rate limits', () => {
      const { result } = renderHook(() => useSecurityMonitoring());

      const rateLimitResult = result.current.checkRateLimits();
      expect(rateLimitResult.isValid).toBe(true);
    });

    it('should validate transactions', () => {
      const { result } = renderHook(() => useSecurityMonitoring());

      const validation = result.current.validateTransaction({
        tokenAAddress: 'token-a',
        tokenBAddress: 'token-b',
        tokenAAmount: '100',
        tokenBAmount: '200',
        slippage: '0.5',
      });

      expect(validation.isValid).toBe(true);
    });

    it('should clear alerts', () => {
      const { result } = renderHook(() => useSecurityMonitoring());

      act(() => {
        result.current.clearAlerts();
      });

      expect(result.current.securityAlerts).toEqual([]);
      expect(result.current.threatLevel).toBe('low');
    });

    it('should provide security status', () => {
      const { result } = renderHook(() => useSecurityMonitoring());

      const status = result.current.getSecurityStatus();
      expect(status).toHaveProperty('alertCount');
      expect(status).toHaveProperty('threatLevel');
      expect(status).toHaveProperty('submissionCount');
      expect(status).toHaveProperty('isActive');
    });
  });

  describe('useMultiSigValidation', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useMultiSigValidation());

      expect(result.current.isMultiSig).toBe(false);
      expect(result.current.signaturesRequired).toBe(1);
      expect(result.current.currentSignatures).toBe(0);
    });

    it('should validate multi-sig transactions', () => {
      const { result } = renderHook(() => useMultiSigValidation());

      const validation = result.current.validateMultiSigTransaction({});
      expect(validation.isValid).toBe(true);
    });

    it('should provide multi-sig status', () => {
      const { result } = renderHook(() => useMultiSigValidation());

      const status = result.current.getMultiSigStatus();
      expect(status).toHaveProperty('isMultiSig');
      expect(status).toHaveProperty('signaturesRequired');
      expect(status).toHaveProperty('currentSignatures');
      expect(status).toHaveProperty('isReadyToSubmit');
      expect(status).toHaveProperty('progressPercentage');
    });

    it('should handle multi-sig signature updates', () => {
      const { result } = renderHook(() => useMultiSigValidation());

      act(() => {
        result.current.setCurrentSignatures(2);
      });

      expect(result.current.currentSignatures).toBe(2);
    });
  });

  describe('useLiquiditySecurity', () => {
    it('should provide all security hooks', () => {
      const { result } = renderHook(() => useLiquiditySecurity());

      expect(result.current).toHaveProperty('secureInput');
      expect(result.current).toHaveProperty('transactionLimits');
      expect(result.current).toHaveProperty('slippageWarnings');
      expect(result.current).toHaveProperty('securityMonitoring');
      expect(result.current).toHaveProperty('multiSigValidation');
      expect(result.current).toHaveProperty('validateForm');
    });

    it('should validate form with all security checks', () => {
      const { result } = renderHook(() => useLiquiditySecurity());

      const validation = result.current.validateForm({
        tokenAAddress: 'token-a',
        tokenBAddress: 'token-b',
        tokenAAmount: '100',
        tokenBAmount: '200',
        slippage: '0.5',
      });

      expect(validation.isValid).toBe(true);
    });
  });
});