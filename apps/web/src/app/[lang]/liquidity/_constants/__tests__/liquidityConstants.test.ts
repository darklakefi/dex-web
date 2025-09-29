import { describe, it, expect } from 'vitest';
import {
  LIQUIDITY_CONSTANTS,
  FORM_FIELD_NAMES,
  TRANSACTION_STATES,
  STATE_MACHINE_EVENTS,
} from '../liquidityConstants';
describe('liquidityConstants', () => {
  describe('LIQUIDITY_CONSTANTS', () => {
    it('should have correct default values', () => {
      expect(LIQUIDITY_CONSTANTS.DEFAULT_SLIPPAGE).toBe('0.5');
      expect(LIQUIDITY_CONSTANTS.DEFAULT_INITIAL_PRICE).toBe('1');
      expect(LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT).toBe('0');
    });
    it('should have reasonable timing constants', () => {
      expect(LIQUIDITY_CONSTANTS.MAX_DECIMAL_PLACES).toBe(5);
      expect(LIQUIDITY_CONSTANTS.DEBOUNCE_DELAY_MS).toBe(500);
      expect(LIQUIDITY_CONSTANTS.POLLING_INTERVAL_MS).toBe(3000);
      expect(LIQUIDITY_CONSTANTS.TRANSACTION_RETRY_DELAY_MS).toBe(2000);
      expect(LIQUIDITY_CONSTANTS.MAX_TRANSACTION_ATTEMPTS).toBe(15);
    });
    it('should be readonly', () => {
      expect(typeof LIQUIDITY_CONSTANTS).toBe('object');
      expect(Object.isFrozen(LIQUIDITY_CONSTANTS)).toBe(true);
    });
  });
  describe('FORM_FIELD_NAMES', () => {
    it('should have correct field names', () => {
      expect(FORM_FIELD_NAMES.TOKEN_A_AMOUNT).toBe('tokenAAmount');
      expect(FORM_FIELD_NAMES.TOKEN_B_AMOUNT).toBe('tokenBAmount');
      expect(FORM_FIELD_NAMES.INITIAL_PRICE).toBe('initialPrice');
    });
    it('should be readonly', () => {
      expect(Object.isFrozen(FORM_FIELD_NAMES)).toBe(true);
    });
  });
  describe('TRANSACTION_STATES', () => {
    it('should have correct state names', () => {
      expect(TRANSACTION_STATES.EDITING).toBe('editing');
      expect(TRANSACTION_STATES.SUBMITTING).toBe('submitting');
      expect(TRANSACTION_STATES.SUCCESS).toBe('success');
      expect(TRANSACTION_STATES.ERROR).toBe('error');
    });
    it('should be readonly', () => {
      expect(Object.isFrozen(TRANSACTION_STATES)).toBe(true);
    });
  });
  describe('STATE_MACHINE_EVENTS', () => {
    it('should have correct event names', () => {
      expect(STATE_MACHINE_EVENTS.SUBMIT).toBe('SUBMIT');
      expect(STATE_MACHINE_EVENTS.TRANSACTION_SUCCESS).toBe('TRANSACTION_SUCCESS');
      expect(STATE_MACHINE_EVENTS.TRANSACTION_ERROR).toBe('TRANSACTION_ERROR');
      expect(STATE_MACHINE_EVENTS.RESET).toBe('RESET');
      expect(STATE_MACHINE_EVENTS.RETRY).toBe('RETRY');
    });
    it('should be readonly', () => {
      expect(Object.isFrozen(STATE_MACHINE_EVENTS)).toBe(true);
    });
  });
  describe('Constants integration', () => {
    it('should not have naming conflicts between different constant groups', () => {
      const formKeys = Object.keys(FORM_FIELD_NAMES);
      const stateKeys = Object.keys(TRANSACTION_STATES);
      const eventKeys = Object.keys(STATE_MACHINE_EVENTS);
      const hasConflicts = [
        formKeys.some(key => stateKeys.includes(key)),
        formKeys.some(key => eventKeys.includes(key)),
        stateKeys.some(key => eventKeys.includes(key)),
      ].some(Boolean);
      expect(hasConflicts).toBe(false);
    });
    it('should have consistent naming patterns', () => {
      Object.values(FORM_FIELD_NAMES).forEach(name => {
        expect(name).toMatch(/^[a-z][a-zA-Z]*$/);
      });
      Object.values(TRANSACTION_STATES).forEach(state => {
        expect(state).toMatch(/^[a-z]+$/);
      });
      Object.values(STATE_MACHINE_EVENTS).forEach(event => {
        expect(event).toMatch(/^[A-Z_]+$/);
      });
    });
  });
});