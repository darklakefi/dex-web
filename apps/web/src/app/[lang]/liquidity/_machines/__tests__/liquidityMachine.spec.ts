import { beforeEach, describe, expect, it } from "vitest";
import { createActor } from "xstate";
import { liquidityMachine } from "../liquidityMachine";

describe("LiquidityMachine", () => {
  let actor: ReturnType<typeof createActor<typeof liquidityMachine>>;

  beforeEach(() => {
    actor = createActor(liquidityMachine);
    actor.start();
  });

  describe("Initial State", () => {
    it("should start in idle state", () => {
      expect(actor.getSnapshot().value).toEqual({ ready: "idle" });
    });

    it("should have default context values", () => {
      const context = actor.getSnapshot().context;
      expect(context.error).toBeNull();
      expect(context.transactionSignature).toBeNull();
      expect(context.liquidityStep).toBe(0);
      expect(context.isCalculating).toBe(false);
    });

    it("should not store server data in context", () => {
      const context = actor.getSnapshot().context;
      expect(context).not.toHaveProperty("poolDetails");
      expect(context).not.toHaveProperty("buyTokenAccount");
      expect(context).not.toHaveProperty("sellTokenAccount");
      expect(context).not.toHaveProperty("tokenAccounts");
      expect(context).not.toHaveProperty("userLiquidity");
      expect(Object.keys(context)).toEqual(
        expect.arrayContaining([
          "error",
          "transactionSignature",
          "liquidityStep",
          "isCalculating",
        ]),
      );
    });
  });

  describe("State Transitions", () => {
    it("should transition from idle to calculating on START_CALCULATION", () => {
      actor.send({ type: "START_CALCULATION" });
      expect(actor.getSnapshot().value).toEqual({ ready: "calculating" });
      expect(actor.getSnapshot().context.isCalculating).toBe(true);
    });

    it("should transition from calculating to idle on FINISH_CALCULATION", () => {
      actor.send({ type: "START_CALCULATION" });
      actor.send({ type: "FINISH_CALCULATION" });
      expect(actor.getSnapshot().value).toEqual({ ready: "idle" });
      expect(actor.getSnapshot().context.isCalculating).toBe(false);
    });

    it("should transition from idle to submitting on SUBMIT", () => {
      const mockData = {
        slippage: "0.5",
        tokenAAmount: "100",
        tokenBAmount: "50",
      };
      actor.send({ data: mockData, type: "SUBMIT" });
      expect(actor.getSnapshot().value).toBe("submitting");
      expect(actor.getSnapshot().context.liquidityStep).toBe(1);
      expect(actor.getSnapshot().context.error).toBeNull();
    });
  });

  describe("Error State Management", () => {
    it("should transition from error to submitting on RETRY", () => {
      const mockData = {
        slippage: "0.5",
        tokenAAmount: "100",
        tokenBAmount: "50",
      };
      actor.send({ data: mockData, type: "SUBMIT" });
      actor.send({ error: "Transaction failed", type: "ERROR" });
      actor.send({ type: "RETRY" });
      expect(actor.getSnapshot().value).toBe("submitting");
    });
  });

  describe("Edge Cases", () => {
    it("should transition from calculating to submitting on SUBMIT", () => {
      const mockData = {
        slippage: "0.5",
        tokenAAmount: "100",
        tokenBAmount: "50",
      };
      actor.send({ type: "START_CALCULATION" });
      actor.send({ data: mockData, type: "SUBMIT" });
      expect(actor.getSnapshot().value).toBe("submitting");
    });
  });
});
