import { PublicKey } from '@solana/web3.js';
import { parseAmountBigNumber } from '@dex-web/utils';
import BigNumber from 'bignumber.js';

// Security constants
export const SECURITY_CONSTANTS = {
  // Maximum decimal places allowed for token amounts
  MAX_DECIMAL_PLACES: 18,

  // Maximum token amount to prevent overflow attacks
  MAX_TOKEN_AMOUNT: new BigNumber('1e18'),

  // Minimum token amount to prevent dust attacks
  MIN_TOKEN_AMOUNT: new BigNumber('1e-9'),

  // Maximum slippage percentage (100%)
  MAX_SLIPPAGE: 100,

  // Minimum slippage percentage (0.01%)
  MIN_SLIPPAGE: 0.01,

  // Maximum rate limit for form submissions (per minute)
  MAX_SUBMISSIONS_PER_MINUTE: 10,

  // Suspicious transaction patterns
  SUSPICIOUS_PATTERNS: {
    // Maximum number of rapid submissions
    MAX_RAPID_SUBMISSIONS: 5,
    // Time window for rapid submission detection (ms)
    RAPID_SUBMISSION_WINDOW: 10000, // 10 seconds
    // Maximum amount change that triggers suspicion
    MAX_AMOUNT_CHANGE_RATIO: 10, // 1000% change
  },

  // Address validation patterns
  ADDRESS_PATTERNS: {
    // Solana address length
    SOLANA_ADDRESS_LENGTH: 44,
    // Base58 character set
    BASE58_CHARS: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
  },
} as const;

// XSS protection patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*>/gi,
  /<link\b[^<]*>/gi,
  /<meta\b[^<]*>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi,
  /expression\s*\(/gi,
];

export interface SecurityValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  severity?: 'low' | 'medium' | 'high';
}

export interface SuspiciousActivityData {
  userId?: string;
  submissions: Array<{
    timestamp: number;
    amount: string;
    tokenAddress: string;
  }>;
  warnings: string[];
}

// Input sanitization functions
export function sanitizeTextInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potential XSS patterns
  let sanitized = input;
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length to prevent DoS
  const MAX_INPUT_LENGTH = 1000;
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
  }

  return sanitized;
}

export function sanitizeNumericInput(input: string): string {
  if (typeof input !== 'string') {
    return '0';
  }

  // Remove any non-numeric characters except decimal point
  let sanitized = input.replace(/[^0-9.]/g, '');

  // Ensure only one decimal point
  const decimalParts = sanitized.split('.');
  if (decimalParts.length > 2) {
    sanitized = `${decimalParts[0]}.${decimalParts.slice(1).join('')}`;
  }

  // Remove leading zeros (except for decimal numbers like 0.123)
  if (sanitized.includes('.')) {
    const [integerPart, decimalPart] = sanitized.split('.');
    const cleanInteger = integerPart?.replace(/^0+/, '') || '0';
    sanitized = `${cleanInteger}.${decimalPart}`;
  } else {
    sanitized = sanitized.replace(/^0+/, '') || '0';
  }

  return sanitized;
}

// Address validation
export function validateSolanaAddress(address: string): SecurityValidationResult {
  if (!address || typeof address !== 'string') {
    return {
      isValid: false,
      error: 'Address is required',
      severity: 'medium',
    };
  }

  const sanitizedAddress = sanitizeTextInput(address);

  // Check length
  if (sanitizedAddress.length !== SECURITY_CONSTANTS.ADDRESS_PATTERNS.SOLANA_ADDRESS_LENGTH) {
    return {
      isValid: false,
      error: 'Invalid address length',
      severity: 'high',
    };
  }

  // Check if it contains only valid Base58 characters
  const validCharsRegex = new RegExp(`^[${SECURITY_CONSTANTS.ADDRESS_PATTERNS.BASE58_CHARS}]+$`);
  if (!validCharsRegex.test(sanitizedAddress)) {
    return {
      isValid: false,
      error: 'Address contains invalid characters',
      severity: 'high',
    };
  }

  try {
    // Validate using Solana's PublicKey constructor
    new PublicKey(sanitizedAddress);
    return { isValid: true };
  } catch (_error) {
    return {
      isValid: false,
      error: 'Invalid Solana address format',
      severity: 'high',
    };
  }
}

// Amount validation with bounds checking
export function validateTokenAmount(
  amount: string,
  decimals: number = 9,
  maxBalance?: string
): SecurityValidationResult {
  if (!amount || typeof amount !== 'string') {
    return {
      isValid: false,
      error: 'Amount is required',
      severity: 'medium',
    };
  }

  const sanitizedAmount = sanitizeNumericInput(amount);

  try {
    const amountBN = parseAmountBigNumber(sanitizedAmount);

    // Check if amount is zero or negative
    if (amountBN.lte(0)) {
      return {
        isValid: false,
        error: 'Amount must be greater than zero',
        severity: 'low',
      };
    }

    // Check minimum amount
    if (amountBN.lt(SECURITY_CONSTANTS.MIN_TOKEN_AMOUNT)) {
      return {
        isValid: false,
        error: 'Amount is too small',
        severity: 'medium',
        warnings: ['Very small amounts may result in failed transactions'],
      };
    }

    // Check maximum amount
    if (amountBN.gt(SECURITY_CONSTANTS.MAX_TOKEN_AMOUNT)) {
      return {
        isValid: false,
        error: 'Amount exceeds maximum allowed value',
        severity: 'high',
      };
    }

    // Check decimal places
    const decimalPlaces = (sanitizedAmount.split('.')[1] || '').length;
    if (decimalPlaces > Math.min(decimals, SECURITY_CONSTANTS.MAX_DECIMAL_PLACES)) {
      return {
        isValid: false,
        error: `Too many decimal places (max: ${Math.min(decimals, SECURITY_CONSTANTS.MAX_DECIMAL_PLACES)})`,
        severity: 'medium',
      };
    }

    // Check against max balance if provided
    if (maxBalance) {
      const maxBalanceBN = parseAmountBigNumber(maxBalance);
      if (amountBN.gt(maxBalanceBN)) {
        return {
          isValid: false,
          error: 'Insufficient balance',
          severity: 'high',
        };
      }
    }

    // Warning for very large amounts (potential fat finger)
    const warningThreshold = SECURITY_CONSTANTS.MAX_TOKEN_AMOUNT.div(100); // 1% of max
    const warnings: string[] = [];
    if (amountBN.gt(warningThreshold)) {
      warnings.push('Large transaction amount detected. Please verify the amount.');
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (_error) {
    return {
      isValid: false,
      error: 'Invalid amount format',
      severity: 'medium',
    };
  }
}

// Slippage validation with warnings
export function validateSlippage(slippage: string | number): SecurityValidationResult {
  let slippageNum: number;

  if (typeof slippage === 'string') {
    const sanitized = sanitizeNumericInput(slippage);
    slippageNum = parseFloat(sanitized);
  } else {
    slippageNum = slippage;
  }

  if (isNaN(slippageNum)) {
    return {
      isValid: false,
      error: 'Invalid slippage value',
      severity: 'medium',
    };
  }

  if (slippageNum < SECURITY_CONSTANTS.MIN_SLIPPAGE) {
    return {
      isValid: false,
      error: `Slippage must be at least ${SECURITY_CONSTANTS.MIN_SLIPPAGE}%`,
      severity: 'medium',
    };
  }

  if (slippageNum > SECURITY_CONSTANTS.MAX_SLIPPAGE) {
    return {
      isValid: false,
      error: `Slippage cannot exceed ${SECURITY_CONSTANTS.MAX_SLIPPAGE}%`,
      severity: 'high',
    };
  }

  const warnings: string[] = [];

  // Warning for very low slippage
  if (slippageNum < 0.1) {
    warnings.push('Very low slippage may cause transaction failures');
  }

  // Warning for high slippage
  if (slippageNum > 5) {
    warnings.push('High slippage increases risk of MEV attacks');
  }

  // Critical warning for very high slippage
  if (slippageNum > 20) {
    warnings.push('DANGER: Extremely high slippage detected! This may result in significant losses.');
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    severity: slippageNum > 20 ? 'high' : slippageNum > 5 ? 'medium' : 'low',
  };
}

// Rate limiting implementation
const submissionHistory = new Map<string, number[]>();

export function checkRateLimit(userId: string): SecurityValidationResult {
  const now = Date.now();
  const userHistory = submissionHistory.get(userId) || [];

  // Remove submissions older than 1 minute
  const recentSubmissions = userHistory.filter(
    timestamp => now - timestamp < 60000
  );

  if (recentSubmissions.length >= SECURITY_CONSTANTS.MAX_SUBMISSIONS_PER_MINUTE) {
    return {
      isValid: false,
      error: 'Rate limit exceeded. Please wait before submitting again.',
      severity: 'high',
    };
  }

  // Update history
  recentSubmissions.push(now);
  submissionHistory.set(userId, recentSubmissions);

  return { isValid: true };
}

// Suspicious activity detection
const suspiciousActivityData = new Map<string, SuspiciousActivityData>();

export function detectSuspiciousActivity(
  userId: string,
  amount: string,
  tokenAddress: string
): SecurityValidationResult {
  const now = Date.now();
  const userData = suspiciousActivityData.get(userId) || {
    submissions: [],
    warnings: [],
  };

  // Remove old submissions (older than 1 hour)
  userData.submissions = userData.submissions.filter(
    submission => now - submission.timestamp < 3600000
  );

  // Check for rapid submissions
  const recentSubmissions = userData.submissions.filter(
    submission => now - submission.timestamp < SECURITY_CONSTANTS.SUSPICIOUS_PATTERNS.RAPID_SUBMISSION_WINDOW
  );

  if (recentSubmissions.length >= SECURITY_CONSTANTS.SUSPICIOUS_PATTERNS.MAX_RAPID_SUBMISSIONS) {
    return {
      isValid: false,
      error: 'Suspicious activity detected: Too many rapid submissions',
      severity: 'high',
    };
  }

  // Check for dramatic amount changes
  if (userData.submissions.length > 0) {
    const lastSubmission = userData.submissions[userData.submissions.length - 1];

    try {
      const currentAmount = parseAmountBigNumber(amount);
      const lastAmount = parseAmountBigNumber(lastSubmission?.amount ?? '0');

      if (lastAmount.gt(0)) {
        const ratio = currentAmount.div(lastAmount);
        if (ratio.gt(SECURITY_CONSTANTS.SUSPICIOUS_PATTERNS.MAX_AMOUNT_CHANGE_RATIO) ||
            ratio.lt(1 / SECURITY_CONSTANTS.SUSPICIOUS_PATTERNS.MAX_AMOUNT_CHANGE_RATIO)) {
          userData.warnings.push(`Dramatic amount change detected: ${ratio.toFixed(2)}x`);
        }
      }
    } catch (_error) {
      // Ignore parsing errors for suspicious activity detection
    }
  }

  // Add current submission
  userData.submissions.push({
    timestamp: now,
    amount,
    tokenAddress,
  });

  suspiciousActivityData.set(userId, userData);

  return {
    isValid: true,
    warnings: userData.warnings.length > 0 ? userData.warnings : undefined,
  };
}

// Comprehensive validation function
export function validateLiquidityTransaction({
  tokenAAddress,
  tokenBAddress,
  tokenAAmount,
  tokenBAmount,
  slippage,
  userId,
  tokenADecimals = 9,
  tokenBDecimals = 9,
  maxBalanceA,
  maxBalanceB,
}: {
  tokenAAddress: string;
  tokenBAddress: string;
  tokenAAmount: string;
  tokenBAmount: string;
  slippage: string | number;
  userId: string;
  tokenADecimals?: number;
  tokenBDecimals?: number;
  maxBalanceA?: string;
  maxBalanceB?: string;
}): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let maxSeverity: 'low' | 'medium' | 'high' = 'low';

  // Validate addresses
  const addressAResult = validateSolanaAddress(tokenAAddress);
  if (!addressAResult.isValid) {
    errors.push(`Token A: ${addressAResult.error}`);
    if (addressAResult.severity && addressAResult.severity === 'high') {
      maxSeverity = 'high';
    }
  }

  const addressBResult = validateSolanaAddress(tokenBAddress);
  if (!addressBResult.isValid) {
    errors.push(`Token B: ${addressBResult.error}`);
    if (addressBResult.severity && addressBResult.severity === 'high') {
      maxSeverity = 'high';
    }
  }

  // Check for same token addresses
  if (tokenAAddress === tokenBAddress) {
    errors.push('Cannot provide liquidity for the same token');
    maxSeverity = 'high';
  }

  // Validate amounts
  const amountAResult = validateTokenAmount(tokenAAmount, tokenADecimals, maxBalanceA);
  if (!amountAResult.isValid) {
    errors.push(`Token A amount: ${amountAResult.error}`);
    if (amountAResult.severity && (amountAResult.severity === 'high' || maxSeverity !== 'high')) {
      maxSeverity = amountAResult.severity;
    }
  }
  if (amountAResult.warnings) {
    warnings.push(...amountAResult.warnings.map(w => `Token A: ${w}`));
  }

  const amountBResult = validateTokenAmount(tokenBAmount, tokenBDecimals, maxBalanceB);
  if (!amountBResult.isValid) {
    errors.push(`Token B amount: ${amountBResult.error}`);
    if (amountBResult.severity && (amountBResult.severity === 'high' || maxSeverity !== 'high')) {
      maxSeverity = amountBResult.severity;
    }
  }
  if (amountBResult.warnings) {
    warnings.push(...amountBResult.warnings.map(w => `Token B: ${w}`));
  }

  // Validate slippage
  const slippageResult = validateSlippage(slippage);
  if (!slippageResult.isValid) {
    errors.push(`Slippage: ${slippageResult.error}`);
    if (slippageResult.severity && (slippageResult.severity === 'high' || maxSeverity !== 'high')) {
      maxSeverity = slippageResult.severity;
    }
  }
  if (slippageResult.warnings) {
    warnings.push(...slippageResult.warnings);
  }

  // Check rate limit
  const rateLimitResult = checkRateLimit(userId);
  if (!rateLimitResult.isValid) {
    errors.push(rateLimitResult.error!);
    maxSeverity = 'high';
  }

  // Check suspicious activity
  const suspiciousResult = detectSuspiciousActivity(userId, tokenAAmount, tokenAAddress);
  if (!suspiciousResult.isValid) {
    errors.push(suspiciousResult.error!);
    maxSeverity = 'high';
  }
  if (suspiciousResult.warnings) {
    warnings.push(...suspiciousResult.warnings);
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    severity: maxSeverity,
  };
}

// Utility to clear user data (for privacy compliance)
export function clearUserSecurityData(userId: string): void {
  submissionHistory.delete(userId);
  suspiciousActivityData.delete(userId);
}

// CSP header simulation for testing
export function simulateCSPViolation(content: string): boolean {
  // Simulate Content Security Policy checks
  const unsafePatterns = [
    /javascript:/gi,
    /data:text\/html/gi,
    /<script/gi,
    /eval\(/gi,
    /setTimeout\(/gi,
    /setInterval\(/gi,
  ];

  return unsafePatterns.some(pattern => pattern.test(content));
}