import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sanitizeTextInput,
  sanitizeNumericInput,
  validateSolanaAddress,
  validateTokenAmount,
  validateSlippage,
  validateLiquidityTransaction,
  checkRateLimit,
  detectSuspiciousActivity,
  simulateCSPViolation,
  clearUserSecurityData,
  SECURITY_CONSTANTS,
} from '../securityValidation';

describe('Security Validation', () => {
  beforeEach(() => {
    // Clear any previous test data
    clearUserSecurityData('test-user');
  });

  describe('Input Sanitization', () => {
    describe('sanitizeTextInput', () => {
      it('should remove XSS script tags', () => {
        const maliciousInput = '<script>alert("xss")</script>Hello';
        const result = sanitizeTextInput(maliciousInput);
        expect(result).toBe('Hello');
      });

      it('should remove iframe tags', () => {
        const maliciousInput = '<iframe src="evil.com"></iframe>Safe text';
        const result = sanitizeTextInput(maliciousInput);
        expect(result).toBe('Safe text');
      });

      it('should remove javascript: URLs', () => {
        const maliciousInput = 'javascript:alert("xss") and some text';
        const result = sanitizeTextInput(maliciousInput);
        expect(result).toBe('and some text');
      });

      it('should remove event handlers', () => {
        const maliciousInput = 'onclick="alert()" normal text';
        const result = sanitizeTextInput(maliciousInput);
        expect(result).toBe('normal text');
      });

      it('should trim whitespace', () => {
        const input = '  hello world  ';
        const result = sanitizeTextInput(input);
        expect(result).toBe('hello world');
      });

      it('should limit input length', () => {
        const longInput = 'a'.repeat(2000);
        const result = sanitizeTextInput(longInput);
        expect(result.length).toBe(1000);
      });

      it('should handle non-string input', () => {
        const result = sanitizeTextInput(123 as any);
        expect(result).toBe('');
      });
    });

    describe('sanitizeNumericInput', () => {
      it('should keep only numeric characters and decimal point', () => {
        const input = 'abc123.456def';
        const result = sanitizeNumericInput(input);
        expect(result).toBe('123.456');
      });

      it('should handle multiple decimal points', () => {
        const input = '123.456.789';
        const result = sanitizeNumericInput(input);
        expect(result).toBe('123.456789');
      });

      it('should remove leading zeros correctly', () => {
        const input = '000123';
        const result = sanitizeNumericInput(input);
        expect(result).toBe('123');
      });

      it('should preserve decimal numbers with leading zeros', () => {
        const input = '0.123';
        const result = sanitizeNumericInput(input);
        expect(result).toBe('0.123');
      });

      it('should handle empty string', () => {
        const result = sanitizeNumericInput('');
        expect(result).toBe('0');
      });

      it('should handle non-string input', () => {
        const result = sanitizeNumericInput(null as any);
        expect(result).toBe('0');
      });
    });
  });

  describe('Address Validation', () => {
    describe('validateSolanaAddress', () => {
      it('should validate correct Solana address', () => {
        const validAddress = '11111111111111111111111111111111111111111111';
        const result = validateSolanaAddress(validAddress);
        expect(result.isValid).toBe(true);
      });

      it('should reject address with incorrect length', () => {
        const shortAddress = '1111111111111111111111111111111111111111111';
        const result = validateSolanaAddress(shortAddress);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Invalid address length');
        expect(result.severity).toBe('high');
      });

      it('should reject address with invalid characters', () => {
        const invalidAddress = '111111111111111111111111111111111111111111O0'; // O and 0 not allowed
        const result = validateSolanaAddress(invalidAddress);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters');
        expect(result.severity).toBe('high');
      });

      it('should handle empty address', () => {
        const result = validateSolanaAddress('');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Address is required');
      });

      it('should sanitize input before validation', () => {
        const addressWithScript = '<script>alert("xss")</script>11111111111111111111111111111111111111111111';
        const result = validateSolanaAddress(addressWithScript);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Amount Validation', () => {
    describe('validateTokenAmount', () => {
      it('should validate correct token amount', () => {
        const result = validateTokenAmount('100.5', 9);
        expect(result.isValid).toBe(true);
      });

      it('should reject zero amount', () => {
        const result = validateTokenAmount('0', 9);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('greater than zero');
      });

      it('should reject negative amount', () => {
        const result = validateTokenAmount('-10', 9);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('greater than zero');
      });

      it('should reject amount that is too small', () => {
        const result = validateTokenAmount('0.0000000001', 9);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('too small');
        expect(result.severity).toBe('medium');
      });

      it('should reject amount that is too large', () => {
        const largeAmount = '1000000000000000000000';
        const result = validateTokenAmount(largeAmount, 9);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('exceeds maximum');
        expect(result.severity).toBe('high');
      });

      it('should validate decimal places', () => {
        const result = validateTokenAmount('100.123456789012', 9);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Too many decimal places');
      });

      it('should check against max balance', () => {
        const result = validateTokenAmount('100', 9, '50');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Insufficient balance');
        expect(result.severity).toBe('high');
      });

      it('should warn for very large amounts', () => {
        const largeAmount = '1000000000000000000'; // Large but under max
        const result = validateTokenAmount(largeAmount, 9);
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Large transaction amount detected');
      });
    });
  });

  describe('Slippage Validation', () => {
    describe('validateSlippage', () => {
      it('should validate normal slippage', () => {
        const result = validateSlippage('0.5');
        expect(result.isValid).toBe(true);
      });

      it('should reject slippage that is too low', () => {
        const result = validateSlippage('0.001');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('must be at least');
      });

      it('should reject slippage that is too high', () => {
        const result = validateSlippage('150');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('cannot exceed');
      });

      it('should warn for very low slippage', () => {
        const result = validateSlippage('0.05');
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Very low slippage may cause transaction failures');
      });

      it('should warn for high slippage', () => {
        const result = validateSlippage('10');
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('High slippage increases risk of MEV attacks');
      });

      it('should show critical warning for very high slippage', () => {
        const result = validateSlippage('25');
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('DANGER: Extremely high slippage detected');
        expect(result.severity).toBe('high');
      });

      it('should handle numeric input', () => {
        const result = validateSlippage(0.5);
        expect(result.isValid).toBe(true);
      });

      it('should handle invalid input', () => {
        const result = validateSlippage('abc');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Invalid slippage value');
      });
    });
  });

  describe('Rate Limiting', () => {
    describe('checkRateLimit', () => {
      it('should allow submissions under rate limit', () => {
        const result = checkRateLimit('test-user');
        expect(result.isValid).toBe(true);
      });

      it('should block submissions over rate limit', () => {
        // Submit maximum allowed requests
        for (let i = 0; i < SECURITY_CONSTANTS.MAX_SUBMISSIONS_PER_MINUTE; i++) {
          checkRateLimit('test-user');
        }

        // Next submission should be blocked
        const result = checkRateLimit('test-user');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Rate limit exceeded');
        expect(result.severity).toBe('high');
      });

      it('should track different users separately', () => {
        // Submit maximum for user1
        for (let i = 0; i < SECURITY_CONSTANTS.MAX_SUBMISSIONS_PER_MINUTE; i++) {
          checkRateLimit('user1');
        }

        // user2 should still be allowed
        const result = checkRateLimit('user2');
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Suspicious Activity Detection', () => {
    describe('detectSuspiciousActivity', () => {
      it('should allow normal activity', () => {
        const result = detectSuspiciousActivity('test-user', '100', 'token1');
        expect(result.isValid).toBe(true);
      });

      it('should detect rapid submissions', () => {
        // Submit maximum rapid submissions
        for (let i = 0; i < SECURITY_CONSTANTS.SUSPICIOUS_PATTERNS.MAX_RAPID_SUBMISSIONS; i++) {
          detectSuspiciousActivity('test-user', '100', 'token1');
        }

        // Next submission should be flagged
        const result = detectSuspiciousActivity('test-user', '100', 'token1');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Suspicious activity detected');
        expect(result.severity).toBe('high');
      });

      it('should detect dramatic amount changes', () => {
        detectSuspiciousActivity('test-user', '100', 'token1');
        const result = detectSuspiciousActivity('test-user', '10000', 'token1');
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Dramatic amount change detected');
      });
    });
  });

  describe('Comprehensive Transaction Validation', () => {
    describe('validateLiquidityTransaction', () => {
      const validTransaction = {
        tokenAAddress: '11111111111111111111111111111111111111111111',
        tokenBAddress: '22222222222222222222222222222222222222222222',
        tokenAAmount: '100',
        tokenBAmount: '200',
        slippage: '0.5',
        userId: 'test-user',
      };

      it('should validate correct transaction', () => {
        const result = validateLiquidityTransaction(validTransaction);
        expect(result.isValid).toBe(true);
      });

      it('should reject transaction with same token addresses', () => {
        const transaction = {
          ...validTransaction,
          tokenBAddress: validTransaction.tokenAAddress,
        };
        const result = validateLiquidityTransaction(transaction);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Cannot provide liquidity for the same token');
        expect(result.severity).toBe('high');
      });

      it('should validate all components and aggregate errors', () => {
        const invalidTransaction = {
          tokenAAddress: 'invalid',
          tokenBAddress: 'invalid',
          tokenAAmount: '-100',
          tokenBAmount: '0',
          slippage: '200',
          userId: 'test-user',
        };
        const result = validateLiquidityTransaction(invalidTransaction);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Token A');
        expect(result.error).toContain('Token B');
        expect(result.error).toContain('Slippage');
      });

      it('should include warnings from all validations', () => {
        const transactionWithWarnings = {
          ...validTransaction,
          tokenAAmount: '1000000000000000000', // Large amount
          slippage: '10', // High slippage
        };
        const result = validateLiquidityTransaction(transactionWithWarnings);
        expect(result.isValid).toBe(true);
        expect(result.warnings).toBeDefined();
        expect(result.warnings!.some(w => w.includes('Large transaction'))).toBe(true);
        expect(result.warnings!.some(w => w.includes('High slippage'))).toBe(true);
      });
    });
  });

  describe('CSP Violation Simulation', () => {
    describe('simulateCSPViolation', () => {
      it('should detect javascript: URLs', () => {
        const result = simulateCSPViolation('javascript:alert("xss")');
        expect(result).toBe(true);
      });

      it('should detect script tags', () => {
        const result = simulateCSPViolation('<script>alert("xss")</script>');
        expect(result).toBe(true);
      });

      it('should detect eval calls', () => {
        const result = simulateCSPViolation('eval("malicious code")');
        expect(result).toBe(true);
      });

      it('should allow safe content', () => {
        const result = simulateCSPViolation('Hello, this is safe content!');
        expect(result).toBe(false);
      });
    });
  });

  describe('Data Privacy', () => {
    describe('clearUserSecurityData', () => {
      it('should clear user security data', () => {
        // Create some data
        checkRateLimit('test-user');
        detectSuspiciousActivity('test-user', '100', 'token1');

        // Clear data
        clearUserSecurityData('test-user');

        // Should be able to make full rate limit again
        for (let i = 0; i < SECURITY_CONSTANTS.MAX_SUBMISSIONS_PER_MINUTE; i++) {
          const result = checkRateLimit('test-user');
          expect(result.isValid).toBe(true);
        }
      });
    });
  });

  describe('Security Constants', () => {
    it('should have reasonable security limits', () => {
      expect(SECURITY_CONSTANTS.MAX_DECIMAL_PLACES).toBe(18);
      expect(SECURITY_CONSTANTS.MAX_SLIPPAGE).toBe(100);
      expect(SECURITY_CONSTANTS.MIN_SLIPPAGE).toBe(0.01);
      expect(SECURITY_CONSTANTS.MAX_SUBMISSIONS_PER_MINUTE).toBe(10);
    });

    it('should have valid address validation constants', () => {
      expect(SECURITY_CONSTANTS.ADDRESS_PATTERNS.SOLANA_ADDRESS_LENGTH).toBe(44);
      expect(SECURITY_CONSTANTS.ADDRESS_PATTERNS.BASE58_CHARS).toBeDefined();
    });
  });
});