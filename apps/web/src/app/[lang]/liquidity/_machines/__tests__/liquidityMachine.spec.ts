import { createActor } from "xstate";
import { describe, expect, it, beforeEach } from "vitest";
import { liquidityMachine, } from "../liquidityMachine";
describe("LiquidityMachine", () => {
  let actor: ReturnType<typeof createActor<typeof liquidityMachine>>;
  beforeEach(() => {
    actor = createActor(liquidityMachine);
    actor.start();
  });
  describe("Initial State", () => {
    it("should start in initializing state", () => {
      expect(actor.getSnapshot().value).toBe("initializing");
    });
    it("should have default context values", () => {
      const context = actor.getSnapshot().context;
      expect(context.error).toBeNull();
      expect(context.tokenAAmount).toBe("0");
      expect(context.tokenBAmount).toBe("0");
      expect(context.transactionSignature).toBeUndefined();
      expect(context.poolDetails).toBeNull();
      expect(context.tokenAccounts.buy).toBeNull();
      expect(context.tokenAccounts.sell).toBeNull();
      expect(context.isDataReady).toBe(false);
    });
  });
  describe("State Transitions", () => {
    it("should transition from initializing to editing on DATA_LOADED", () => {
      actor.send({
        type: "DATA_LOADED",
        poolDetails: { poolAddress: "test-pool" },
        tokenAccounts: { buy: null, sell: null },
      });
      expect(actor.getSnapshot().value).toBe("editing");
      expect(actor.getSnapshot().context.isDataReady).toBe(true);
    });
    it("should transition from initializing to editing after timeout", (done) => {
      setTimeout(() => {
        expect(actor.getSnapshot().value).toBe("editing");
        expect(actor.getSnapshot().context.isDataReady).toBe(true);
        done();
      }, 1100);
    }, 2000);
    it("should transition from editing to submitting on SUBMIT", () => {
      actor.send({ type: "DATA_LOADED" });
      actor.send({
        type: "SUBMIT",
        data: { tokenAAmount: "100", tokenBAmount: "50" },
      });
      expect(actor.getSnapshot().value).toBe("submitting");
      expect(actor.getSnapshot().context.tokenAAmount).toBe("100");
      expect(actor.getSnapshot().context.tokenBAmount).toBe("50");
    });
    it("should transition from submitting to success on SUCCESS", () => {
      actor.send({ type: "DATA_LOADED" });
      actor.send({
        type: "SUBMIT",
        data: { tokenAAmount: "100", tokenBAmount: "50" },
      });
      actor.send({ type: "SUCCESS", signature: "test-signature" });
      expect(actor.getSnapshot().value).toBe("success");
      expect(actor.getSnapshot().context.transactionSignature).toBe("test-signature");
      expect(actor.getSnapshot().context.error).toBeNull();
    });
    it("should transition from submitting to error on ERROR", () => {
      actor.send({ type: "DATA_LOADED" });
      actor.send({
        type: "SUBMIT",
        data: { tokenAAmount: "100", tokenBAmount: "50" },
      });
      actor.send({ type: "ERROR", error: "Transaction failed" });
      expect(actor.getSnapshot().value).toBe("error");
      expect(actor.getSnapshot().context.error).toBe("Transaction failed");
    });
  });
  describe("Error State Management", () => {
    it("should transition from error to submitting on RETRY", () => {
      actor.send({ type: "DATA_LOADED" });
      actor.send({
        type: "SUBMIT",
        data: { tokenAAmount: "100", tokenBAmount: "50" },
      });
      actor.send({ type: "ERROR", error: "Transaction failed" });
      actor.send({ type: "RETRY" });
      expect(actor.getSnapshot().value).toBe("submitting");
      expect(actor.getSnapshot().context.error).toBeNull();
    });
    it("should transition from error to editing on RESET", () => {
      actor.send({ type: "DATA_LOADED" });
      actor.send({
        type: "SUBMIT",
        data: { tokenAAmount: "100", tokenBAmount: "50" },
      });
      actor.send({ type: "ERROR", error: "Transaction failed" });
      actor.send({ type: "RESET" });
      expect(actor.getSnapshot().value).toBe("editing");
      expect(actor.getSnapshot().context.error).toBeNull();
      expect(actor.getSnapshot().context.tokenAAmount).toBe("0");
      expect(actor.getSnapshot().context.tokenBAmount).toBe("0");
      expect(actor.getSnapshot().context.transactionSignature).toBeUndefined();
    });
  });
  describe("Success State Management", () => {
    it("should transition from success to editing on RESET", () => {
      actor.send({ type: "DATA_LOADED" });
      actor.send({
        type: "SUBMIT",
        data: { tokenAAmount: "100", tokenBAmount: "50" },
      });
      actor.send({ type: "SUCCESS", signature: "test-signature" });
      actor.send({ type: "RESET" });
      expect(actor.getSnapshot().value).toBe("editing");
      expect(actor.getSnapshot().context.error).toBeNull();
      expect(actor.getSnapshot().context.tokenAAmount).toBe("0");
      expect(actor.getSnapshot().context.tokenBAmount).toBe("0");
      expect(actor.getSnapshot().context.transactionSignature).toBeUndefined();
    });
  });
  describe("Data Loading", () => {
    it("should update pool details and token accounts on DATA_LOADED", () => {
      const poolDetails = {
        poolAddress: "test-pool-123",
        tokenXMint: "tokenX",
        tokenYMint: "tokenY",
        price: "1.5",
      };
      const tokenAccounts = {
        buy: { amount: 1000, decimals: 9, symbol: "SOL" },
        sell: { amount: 500, decimals: 6, symbol: "USDC" },
      };
      actor.send({
        type: "DATA_LOADED",
        poolDetails,
        tokenAccounts,
      });
      const context = actor.getSnapshot().context;
      expect(context.poolDetails).toEqual(poolDetails);
      expect(context.tokenAccounts).toEqual(tokenAccounts);
      expect(context.isDataReady).toBe(true);
    });
    it("should update data while in editing state", () => {
      actor.send({ type: "DATA_LOADED" });
      const newPoolDetails = {
        poolAddress: "new-pool-456",
        tokenXMint: "newTokenX",
        tokenYMint: "newTokenY",
      };
      actor.send({
        type: "DATA_LOADED",
        poolDetails: newPoolDetails,
      });
      expect(actor.getSnapshot().context.poolDetails).toEqual(newPoolDetails);
    });
  });
  describe("Context Preservation", () => {
    it("should preserve form data during state transitions", () => {
      actor.send({ type: "DATA_LOADED" });
      actor.send({
        type: "SUBMIT",
        data: { tokenAAmount: "123.45", tokenBAmount: "67.89" },
      });
      expect(actor.getSnapshot().context.tokenAAmount).toBe("123.45");
      expect(actor.getSnapshot().context.tokenBAmount).toBe("67.89");
      actor.send({ type: "ERROR", error: "Test error" });
      expect(actor.getSnapshot().context.tokenAAmount).toBe("123.45");
      expect(actor.getSnapshot().context.tokenBAmount).toBe("67.89");
    });
    it("should clear error when transitioning to editing", () => {
      actor.send({ type: "DATA_LOADED" });
      actor.send({
        type: "SUBMIT",
        data: { tokenAAmount: "100", tokenBAmount: "50" },
      });
      actor.send({ type: "ERROR", error: "Test error" });
      expect(actor.getSnapshot().context.error).toBe("Test error");
      actor.send({ type: "RESET" });
      expect(actor.getSnapshot().context.error).toBeNull();
    });
  });
  describe("Edge Cases", () => {
    it("should handle DATA_LOADED with partial data", () => {
      actor.send({
        type: "DATA_LOADED",
        poolDetails: undefined,
        tokenAccounts: undefined,
      });
      const context = actor.getSnapshot().context;
      expect(context.poolDetails).toBeNull();
      expect(context.tokenAccounts).toEqual({ buy: null, sell: null });
      expect(context.isDataReady).toBe(true);
    });
    it("should handle SUCCESS without signature", () => {
      actor.send({ type: "DATA_LOADED" });
      actor.send({
        type: "SUBMIT",
        data: { tokenAAmount: "100", tokenBAmount: "50" },
      });
      actor.send({ type: "SUCCESS" });
      expect(actor.getSnapshot().value).toBe("success");
      expect(actor.getSnapshot().context.transactionSignature).toBeUndefined();
    });
  });
});