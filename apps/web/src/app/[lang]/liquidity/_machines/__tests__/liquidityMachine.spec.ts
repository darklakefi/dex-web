import { createActor } from "xstate";
import { describe, expect, it, beforeEach } from "vitest";
import { liquidityMachine } from "../liquidityMachine";

describe("LiquidityMachine", () => {
  let actor: ReturnType<typeof createActor<typeof liquidityMachine>>;

  beforeEach(() => {
    actor = createActor(liquidityMachine);
    actor.start();
  });

  describe("Initial State", () => {
    it("should start in idle state", () => {
      expect(actor.getSnapshot().value).toBe("idle");
    });

    it("should have default context values", () => {
      const context = actor.getSnapshot().context;
      expect(context.error).toBeNull();
      expect(context.transactionSignature).toBeNull();
      expect(context.poolDetails).toBeNull();
      expect(context.buyTokenAccount).toBeNull();
      expect(context.sellTokenAccount).toBeNull();
      expect(context.liquidityStep).toBe(0);
      expect(context.isCalculating).toBe(false);
    });
  });

  describe("State Transitions", () => {
    it("should transition from idle to calculating on START_CALCULATION", () => {
      actor.send({ type: "START_CALCULATION" });
      expect(actor.getSnapshot().value).toBe("calculating");
      expect(actor.getSnapshot().context.isCalculating).toBe(true);
    });

    it("should transition from calculating to idle on FINISH_CALCULATION", () => {
      actor.send({ type: "START_CALCULATION" });
      actor.send({ type: "FINISH_CALCULATION" });
      expect(actor.getSnapshot().value).toBe("idle");
      expect(actor.getSnapshot().context.isCalculating).toBe(false);
    });

    it("should transition from idle to submitting on SUBMIT", () => {
      const mockData = {
        tokenAAmount: "100",
        tokenBAmount: "50",
        slippage: "0.5"
      };
      actor.send({ type: "SUBMIT", data: mockData });
      expect(actor.getSnapshot().value).toBe("submitting");
      expect(actor.getSnapshot().context.liquidityStep).toBe(1);
      expect(actor.getSnapshot().context.error).toBeNull();
    });

    it("should transition from submitting to signing on SIGN_TRANSACTION", () => {
      const mockData = {
        tokenAAmount: "100",
        tokenBAmount: "50",
        slippage: "0.5"
      };
      actor.send({ type: "SUBMIT", data: mockData });
      actor.send({ type: "SIGN_TRANSACTION", signature: "test-signature" });
      expect(actor.getSnapshot().value).toBe("signing");
      expect(actor.getSnapshot().context.transactionSignature).toBe("test-signature");
      expect(actor.getSnapshot().context.liquidityStep).toBe(3);
    });

    it("should transition from signing to success on SUCCESS", () => {
      const mockData = {
        tokenAAmount: "100",
        tokenBAmount: "50",
        slippage: "0.5"
      };
      actor.send({ type: "SUBMIT", data: mockData });
      actor.send({ type: "SIGN_TRANSACTION", signature: "test-signature" });
      actor.send({ type: "SUCCESS" });
      expect(actor.getSnapshot().value).toBe("success");
      expect(actor.getSnapshot().context.liquidityStep).toBe(0);
      expect(actor.getSnapshot().context.error).toBeNull();
    });

    it("should transition from submitting to error on ERROR", () => {
      const mockData = {
        tokenAAmount: "100",
        tokenBAmount: "50",
        slippage: "0.5"
      };
      actor.send({ type: "SUBMIT", data: mockData });
      actor.send({ type: "ERROR", error: "Transaction failed" });
      expect(actor.getSnapshot().value).toBe("error");
      expect(actor.getSnapshot().context.error).toBe("Transaction failed");
      expect(actor.getSnapshot().context.liquidityStep).toBe(0);
    });
  });

  describe("Error State Management", () => {
    it("should transition from error to submitting on RETRY", () => {
      const mockData = {
        tokenAAmount: "100",
        tokenBAmount: "50",
        slippage: "0.5"
      };
      actor.send({ type: "SUBMIT", data: mockData });
      actor.send({ type: "ERROR", error: "Transaction failed" });
      actor.send({ type: "RETRY" });
      expect(actor.getSnapshot().value).toBe("submitting");
    });

    it("should transition from error to idle on RESET", () => {
      const mockData = {
        tokenAAmount: "100",
        tokenBAmount: "50",
        slippage: "0.5"
      };
      actor.send({ type: "SUBMIT", data: mockData });
      actor.send({ type: "ERROR", error: "Transaction failed" });
      actor.send({ type: "RESET" });
      expect(actor.getSnapshot().value).toBe("idle");
      expect(actor.getSnapshot().context.error).toBeNull();
      expect(actor.getSnapshot().context.transactionSignature).toBeNull();
      expect(actor.getSnapshot().context.liquidityStep).toBe(0);
    });
  });

  describe("Success State Management", () => {
    it("should transition from success to idle on RESET", () => {
      const mockData = {
        tokenAAmount: "100",
        tokenBAmount: "50",
        slippage: "0.5"
      };
      actor.send({ type: "SUBMIT", data: mockData });
      actor.send({ type: "SIGN_TRANSACTION", signature: "test-signature" });
      actor.send({ type: "SUCCESS" });
      actor.send({ type: "RESET" });
      expect(actor.getSnapshot().value).toBe("idle");
      expect(actor.getSnapshot().context.error).toBeNull();
      expect(actor.getSnapshot().context.transactionSignature).toBeNull();
      expect(actor.getSnapshot().context.liquidityStep).toBe(0);
    });
  });

  describe("Data Management", () => {
    it("should update pool details on UPDATE_POOL_DETAILS", () => {
      const poolDetails = {
        poolAddress: "test-pool-123",
        tokenXMint: "tokenX",
        tokenYMint: "tokenY",
      };
      actor.send({ type: "UPDATE_POOL_DETAILS", data: poolDetails });
      expect(actor.getSnapshot().context.poolDetails).toEqual(poolDetails);
    });

    it("should update token accounts on UPDATE_TOKEN_ACCOUNTS", () => {
      const buyAccount = { amount: 1000, decimals: 9, symbol: "SOL" };
      const sellAccount = { amount: 500, decimals: 6, symbol: "USDC" };

      actor.send({
        type: "UPDATE_TOKEN_ACCOUNTS",
        buyAccount,
        sellAccount
      });

      expect(actor.getSnapshot().context.buyTokenAccount).toEqual(buyAccount);
      expect(actor.getSnapshot().context.sellTokenAccount).toEqual(sellAccount);
    });

    it("should handle null pool details", () => {
      actor.send({ type: "UPDATE_POOL_DETAILS", data: null });
      expect(actor.getSnapshot().context.poolDetails).toBeNull();
    });

    it("should handle null token accounts", () => {
      actor.send({
        type: "UPDATE_TOKEN_ACCOUNTS",
        buyAccount: null,
        sellAccount: null
      });

      expect(actor.getSnapshot().context.buyTokenAccount).toBeNull();
      expect(actor.getSnapshot().context.sellTokenAccount).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should transition from calculating to submitting on SUBMIT", () => {
      const mockData = {
        tokenAAmount: "100",
        tokenBAmount: "50",
        slippage: "0.5"
      };
      actor.send({ type: "START_CALCULATION" });
      actor.send({ type: "SUBMIT", data: mockData });
      expect(actor.getSnapshot().value).toBe("submitting");
    });

    it("should handle signing to error transition", () => {
      const mockData = {
        tokenAAmount: "100",
        tokenBAmount: "50",
        slippage: "0.5"
      };
      actor.send({ type: "SUBMIT", data: mockData });
      actor.send({ type: "SIGN_TRANSACTION", signature: "test-signature" });
      actor.send({ type: "ERROR", error: "Signing failed" });
      expect(actor.getSnapshot().value).toBe("error");
      expect(actor.getSnapshot().context.error).toBe("Signing failed");
      expect(actor.getSnapshot().context.liquidityStep).toBe(0);
    });
  });
});