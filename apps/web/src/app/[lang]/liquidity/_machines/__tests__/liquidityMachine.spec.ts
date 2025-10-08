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
      // Ensure no server data is stored in machine context
      expect(context).not.toHaveProperty("poolDetails");
      expect(context).not.toHaveProperty("buyTokenAccount");
      expect(context).not.toHaveProperty("sellTokenAccount");
      expect(context).not.toHaveProperty("tokenAccounts");
      expect(context).not.toHaveProperty("userLiquidity");
      // Only workflow state should be present
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

    it.skip("should transition from submitting to signing on SIGN_TRANSACTION", () => {
      const mockData = {
        slippage: "0.5",
        tokenAAmount: "100",
        tokenBAmount: "50",
      };
      actor.send({ data: mockData, type: "SUBMIT" });
      actor.send({ signature: "test-signature", type: "SIGN_TRANSACTION" });
      expect(actor.getSnapshot().value).toBe("signing");
      expect(actor.getSnapshot().context.transactionSignature).toBe(
        "test-signature",
      );
      expect(actor.getSnapshot().context.liquidityStep).toBe(3);
    });

    it.skip("should transition from signing to success on SUCCESS", () => {
      const mockData = {
        slippage: "0.5",
        tokenAAmount: "100",
        tokenBAmount: "50",
      };
      actor.send({ data: mockData, type: "SUBMIT" });
      actor.send({ signature: "test-signature", type: "SIGN_TRANSACTION" });
      actor.send({ type: "SUCCESS" });
      expect(actor.getSnapshot().value).toBe("success");
      expect(actor.getSnapshot().context.liquidityStep).toBe(0);
      expect(actor.getSnapshot().context.error).toBeNull();
    });

    it.skip("should transition from submitting to error on ERROR", () => {
      const mockData = {
        slippage: "0.5",
        tokenAAmount: "100",
        tokenBAmount: "50",
      };
      actor.send({ data: mockData, type: "SUBMIT" });
      actor.send({ error: "Transaction failed", type: "ERROR" });
      expect(actor.getSnapshot().value).toBe("error");
      expect(actor.getSnapshot().context.error).toBe("Transaction failed");
      expect(actor.getSnapshot().context.liquidityStep).toBe(0);
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

    it.skip("should transition from error to idle on RESET", () => {
      const mockData = {
        slippage: "0.5",
        tokenAAmount: "100",
        tokenBAmount: "50",
      };
      actor.send({ data: mockData, type: "SUBMIT" });
      actor.send({ error: "Transaction failed", type: "ERROR" });
      actor.send({ type: "RESET" });
      expect(actor.getSnapshot().value).toBe("idle");
      expect(actor.getSnapshot().context.error).toBeNull();
      expect(actor.getSnapshot().context.transactionSignature).toBeNull();
      expect(actor.getSnapshot().context.liquidityStep).toBe(0);
    });
  });

  describe("Success State Management", () => {
    it.skip("should transition from success to idle on RESET", () => {
      const mockData = {
        slippage: "0.5",
        tokenAAmount: "100",
        tokenBAmount: "50",
      };
      actor.send({ data: mockData, type: "SUBMIT" });
      actor.send({ signature: "test-signature", type: "SIGN_TRANSACTION" });
      actor.send({ type: "SUCCESS" });
      actor.send({ type: "RESET" });
      expect(actor.getSnapshot().value).toBe("idle");
      expect(actor.getSnapshot().context.error).toBeNull();
      expect(actor.getSnapshot().context.transactionSignature).toBeNull();
      expect(actor.getSnapshot().context.liquidityStep).toBe(0);
    });
  });

  describe("Data Management", () => {
    it.skip("should update pool details on UPDATE_POOL_DETAILS", () => {
      const poolDetails = {
        poolAddress: "test-pool-123",
        tokenXMint: "tokenX",
        tokenYMint: "tokenY",
      };
      actor.send({ data: poolDetails, type: "UPDATE_POOL_DETAILS" });
      expect(actor.getSnapshot().context.poolDetails).toEqual(poolDetails);
    });

    it.skip("should update token accounts on UPDATE_TOKEN_ACCOUNTS", () => {
      const buyAccount = { amount: 1000, decimals: 9, symbol: "SOL" };
      const sellAccount = { amount: 500, decimals: 6, symbol: "USDC" };

      actor.send({
        buyAccount,
        sellAccount,
        type: "UPDATE_TOKEN_ACCOUNTS",
      });

      expect(actor.getSnapshot().context.buyTokenAccount).toEqual(buyAccount);
      expect(actor.getSnapshot().context.sellTokenAccount).toEqual(sellAccount);
    });

    it.skip("should handle null pool details", () => {
      actor.send({ data: null, type: "UPDATE_POOL_DETAILS" });
      expect(actor.getSnapshot().context.poolDetails).toBeNull();
    });

    it.skip("should handle null token accounts", () => {
      actor.send({
        buyAccount: null,
        sellAccount: null,
        type: "UPDATE_TOKEN_ACCOUNTS",
      });

      expect(actor.getSnapshot().context.buyTokenAccount).toBeNull();
      expect(actor.getSnapshot().context.sellTokenAccount).toBeNull();
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

    it.skip("should handle signing to error transition", () => {
      const mockData = {
        slippage: "0.5",
        tokenAAmount: "100",
        tokenBAmount: "50",
      };
      actor.send({ data: mockData, type: "SUBMIT" });
      actor.send({ signature: "test-signature", type: "SIGN_TRANSACTION" });
      actor.send({ error: "Signing failed", type: "ERROR" });
      expect(actor.getSnapshot().value).toBe("error");
      expect(actor.getSnapshot().context.error).toBe("Signing failed");
      expect(actor.getSnapshot().context.liquidityStep).toBe(0);
    });
  });
});
