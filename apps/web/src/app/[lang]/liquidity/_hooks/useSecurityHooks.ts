"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWalletPublicKey } from '../../../../hooks/useWalletCache';
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
  SECURITY_CONSTANTS,
  type SecurityValidationResult,
} from '../_utils/securityValidation';

// Hook for secure input handling with sanitization
export function useSecureInput(initialValue: string = '') {
  const [value, setValue] = useState(initialValue);
  const [sanitizedValue, setSanitizedValue] = useState(sanitizeTextInput(initialValue));
  const [isNumeric, setIsNumeric] = useState(false);

  const handleChange = useCallback((
    input: string,
    options: { numeric?: boolean; maxLength?: number } = {}
  ) => {
    const { numeric = false, maxLength } = options;

    let sanitized = numeric ? sanitizeNumericInput(input) : sanitizeTextInput(input);

    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    setValue(input);
    setSanitizedValue(sanitized);
    setIsNumeric(numeric);
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
    setSanitizedValue(sanitizeTextInput(initialValue));
  }, [initialValue]);

  const checkForXSS = useCallback(() => {
    return simulateCSPViolation(value);
  }, [value]);

  return {
    value,
    sanitizedValue,
    handleChange,
    reset,
    checkForXSS,
    isNumeric,
    isDirty: value !== initialValue,
    isSanitized: value === sanitizedValue,
  };
}

// Hook for transaction amount limits and validation
export function useTransactionLimits() {
  const validateAmount = useCallback((
    amount: string,
    decimals: number = 9,
    maxBalance?: string,
    minAmount?: string
  ): SecurityValidationResult => {
    const result = validateTokenAmount(amount, decimals, maxBalance);

    // Additional custom validation for minimum amounts
    if (result.isValid && minAmount) {
      try {
        const amountNum = parseFloat(amount);
        const minAmountNum = parseFloat(minAmount);

        if (amountNum < minAmountNum) {
          return {
            isValid: false,
            error: `Amount must be at least ${minAmount}`,
            severity: 'medium',
          };
        }
      } catch (error) {
        // If parsing fails, rely on the original validation
      }
    }

    return result;
  }, []);

  const getMaxSafeAmount = useCallback((
    balance: string,
    reservePercentage: number = 0.05 // Reserve 5% for fees
  ): string => {
    try {
      const balanceNum = parseFloat(balance);
      const maxSafe = balanceNum * (1 - reservePercentage);
      return Math.max(0, maxSafe).toString();
    } catch (error) {
      return '0';
    }
  }, []);

  const checkAmountSafety = useCallback((
    amount: string,
    balance: string,
    threshold: number = 0.9 // Warn if using more than 90% of balance
  ): { isWarning: boolean; message?: string } => {
    try {
      const amountNum = parseFloat(amount);
      const balanceNum = parseFloat(balance);

      if (amountNum / balanceNum > threshold) {
        return {
          isWarning: true,
          message: `You're using ${Math.round((amountNum / balanceNum) * 100)}% of your balance. Consider leaving some tokens for transaction fees.`,
        };
      }
    } catch (error) {
      // Ignore parsing errors
    }

    return { isWarning: false };
  }, []);

  return {
    validateAmount,
    getMaxSafeAmount,
    checkAmountSafety,
    limits: SECURITY_CONSTANTS,
  };
}

// Hook for slippage protection with warnings
export function useSlippageWarnings() {
  const [slippage, setSlippage] = useState<string>('0.5');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('low');

  const updateSlippage = useCallback((newSlippage: string) => {
    const validation = validateSlippage(newSlippage);

    setSlippage(newSlippage);
    setWarnings(validation.warnings || []);
    setSeverity(validation.severity || 'low');
  }, []);

  const getSlippageRecommendation = useCallback((
    tokenPair: string,
    liquidityLevel: 'low' | 'medium' | 'high' = 'medium'
  ): string => {
    // Provide recommendations based on token pair and liquidity
    const recommendations = {
      'stable-stable': { low: '0.1', medium: '0.1', high: '0.05' },
      'stable-volatile': { low: '1.0', medium: '0.5', high: '0.3' },
      'volatile-volatile': { low: '3.0', medium: '1.0', high: '0.5' },
      'unknown': { low: '2.0', medium: '1.0', high: '0.5' },
    };

    const pairType = tokenPair.toLowerCase() as keyof typeof recommendations;
    return recommendations[pairType]?.[liquidityLevel] || recommendations.unknown[liquidityLevel];
  }, []);

  const getImpactWarning = useCallback((
    amount: string,
    poolLiquidity: string
  ): { hasWarning: boolean; message?: string } => {
    try {
      const amountNum = parseFloat(amount);
      const liquidityNum = parseFloat(poolLiquidity);
      const impact = (amountNum / liquidityNum) * 100;

      if (impact > 10) {
        return {
          hasWarning: true,
          message: `High price impact: ~${impact.toFixed(1)}%. Consider reducing the amount or increasing slippage.`,
        };
      } else if (impact > 5) {
        return {
          hasWarning: true,
          message: `Moderate price impact: ~${impact.toFixed(1)}%. Transaction may require higher slippage.`,
        };
      }
    } catch (error) {
      // Ignore parsing errors
    }

    return { hasWarning: false };
  }, []);

  return {
    slippage,
    warnings,
    severity,
    updateSlippage,
    getSlippageRecommendation,
    getImpactWarning,
    isValid: warnings.length === 0,
  };
}

// Hook for comprehensive security monitoring
export function useSecurityMonitoring() {
  const { data: publicKey } = useWalletPublicKey();
  const [securityAlerts, setSecurityAlerts] = useState<string[]>([]);
  const [threatLevel, setThreatLevel] = useState<'low' | 'medium' | 'high'>('low');
  const submissionCountRef = useRef(0);
  const lastSubmissionTimeRef = useRef(0);

  const userId = useMemo(() => {
    return publicKey?.toBase58() || 'anonymous';
  }, [publicKey]);

  const recordSubmission = useCallback((data: {
    tokenAAmount: string;
    tokenBAmount: string;
    tokenAAddress: string;
    tokenBAddress: string;
  }) => {
    const now = Date.now();
    submissionCountRef.current += 1;
    lastSubmissionTimeRef.current = now;

    // Check for suspicious activity
    const suspiciousResult = detectSuspiciousActivity(
      userId,
      data.tokenAAmount,
      data.tokenAAddress
    );

    if (!suspiciousResult.isValid) {
      setSecurityAlerts(prev => [...prev, suspiciousResult.error!]);
      setThreatLevel('high');
    } else if (suspiciousResult.warnings) {
      setSecurityAlerts(prev => [...prev, ...suspiciousResult.warnings!]);
      setThreatLevel('medium');
    }
  }, [userId]);

  const checkRateLimits = useCallback((): SecurityValidationResult => {
    return checkRateLimit(userId);
  }, [userId]);

  const validateTransaction = useCallback((data: {
    tokenAAddress: string;
    tokenBAddress: string;
    tokenAAmount: string;
    tokenBAmount: string;
    slippage: string;
    tokenADecimals?: number;
    tokenBDecimals?: number;
    maxBalanceA?: string;
    maxBalanceB?: string;
  }): SecurityValidationResult => {
    return validateLiquidityTransaction({
      ...data,
      userId,
    });
  }, [userId]);

  const clearAlerts = useCallback(() => {
    setSecurityAlerts([]);
    setThreatLevel('low');
  }, []);

  const getSecurityStatus = useCallback(() => {
    const now = Date.now();
    const timeSinceLastSubmission = now - lastSubmissionTimeRef.current;

    return {
      alertCount: securityAlerts.length,
      threatLevel,
      submissionCount: submissionCountRef.current,
      timeSinceLastSubmission,
      isActive: timeSinceLastSubmission < 300000, // 5 minutes
    };
  }, [securityAlerts.length, threatLevel]);

  return {
    securityAlerts,
    threatLevel,
    recordSubmission,
    checkRateLimits,
    validateTransaction,
    clearAlerts,
    getSecurityStatus,
    userId,
  };
}

// Hook for multi-signature wallet validation
export function useMultiSigValidation() {
  const { data: publicKey } = useWalletPublicKey();
  const [isMultiSig, setIsMultiSig] = useState(false);
  const [signaturesRequired, setSignaturesRequired] = useState(1);
  const [currentSignatures, setCurrentSignatures] = useState(0);

  // Check if connected wallet is a multi-sig wallet
  useEffect(() => {
    if (publicKey) {
      // In a real implementation, you would check if the wallet address
      // corresponds to a known multi-sig program
      // For now, we'll use a simple heuristic or mock check
      const addressStr = publicKey.toBase58();

      // Mock multi-sig detection - in practice, you'd query the blockchain
      // or maintain a registry of known multi-sig addresses
      const isKnownMultiSig = addressStr.startsWith('Squad') || // Squads protocol
                             addressStr.startsWith('Multi'); // Generic multi-sig

      setIsMultiSig(isKnownMultiSig);

      if (isKnownMultiSig) {
        // Mock values - in practice, you'd fetch from the multi-sig program
        setSignaturesRequired(2);
        setCurrentSignatures(0);
      }
    }
  }, [publicKey]);

  const validateMultiSigTransaction = useCallback((
    transactionData: any
  ): SecurityValidationResult => {
    if (!isMultiSig) {
      return { isValid: true };
    }

    if (currentSignatures < signaturesRequired) {
      return {
        isValid: false,
        error: `Multi-signature transaction requires ${signaturesRequired} signatures (${currentSignatures}/${signaturesRequired} collected)`,
        severity: 'medium',
      };
    }

    return { isValid: true };
  }, [isMultiSig, currentSignatures, signaturesRequired]);

  const getMultiSigStatus = useCallback(() => {
    return {
      isMultiSig,
      signaturesRequired,
      currentSignatures,
      isReadyToSubmit: !isMultiSig || currentSignatures >= signaturesRequired,
      progressPercentage: isMultiSig ? (currentSignatures / signaturesRequired) * 100 : 100,
    };
  }, [isMultiSig, signaturesRequired, currentSignatures]);

  return {
    isMultiSig,
    signaturesRequired,
    currentSignatures,
    validateMultiSigTransaction,
    getMultiSigStatus,
    setCurrentSignatures, // For testing/mocking purposes
  };
}

// Combined security hook for easy integration
export function useLiquiditySecurity() {
  const secureInput = useSecureInput();
  const transactionLimits = useTransactionLimits();
  const slippageWarnings = useSlippageWarnings();
  const securityMonitoring = useSecurityMonitoring();
  const multiSigValidation = useMultiSigValidation();

  const validateForm = useCallback((formData: {
    tokenAAddress: string;
    tokenBAddress: string;
    tokenAAmount: string;
    tokenBAmount: string;
    slippage: string;
    tokenADecimals?: number;
    tokenBDecimals?: number;
    maxBalanceA?: string;
    maxBalanceB?: string;
  }): SecurityValidationResult => {
    // Combine all validations
    const transactionValidation = securityMonitoring.validateTransaction(formData);
    const multiSigValidation_ = multiSigValidation.validateMultiSigTransaction(formData);
    const rateLimitValidation = securityMonitoring.checkRateLimits();

    const errors: string[] = [];
    const warnings: string[] = [];
    let maxSeverity: 'low' | 'medium' | 'high' = 'low';

    if (!transactionValidation.isValid) {
      errors.push(transactionValidation.error!);
      if (transactionValidation.severity === 'high') maxSeverity = 'high';
    }
    if (transactionValidation.warnings) {
      warnings.push(...transactionValidation.warnings);
    }

    if (!multiSigValidation_.isValid) {
      errors.push(multiSigValidation_.error!);
      if (multiSigValidation_.severity === 'high') maxSeverity = 'high';
    }

    if (!rateLimitValidation.isValid) {
      errors.push(rateLimitValidation.error!);
      maxSeverity = 'high';
    }

    return {
      isValid: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      severity: maxSeverity,
    };
  }, [securityMonitoring, multiSigValidation]);

  return {
    secureInput,
    transactionLimits,
    slippageWarnings,
    securityMonitoring,
    multiSigValidation,
    validateForm,
  };
}