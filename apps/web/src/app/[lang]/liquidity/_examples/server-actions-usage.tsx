/**
 * Example implementations showing how to integrate Server Actions with the existing oRPC setup.
 *
 * This file demonstrates practical usage patterns and migration strategies.
 */

"use client";

import React, { useActionState, useOptimistic, startTransition } from "react";
import { submitLiquidityAction, type LiquidityFormState } from "../_actions/submitLiquidityAction";
import { useLiquidityFormWithDebounced } from "../_components/LiquidityFormProvider";
import { useWalletPublicKey } from "../../../../hooks/useWalletCache";

/**
 * Example 1: Simple Server Action Integration
 *
 * This shows the minimal changes needed to add Server Action support
 * to an existing form while maintaining current functionality.
 */
export function SimpleServerActionExample() {
  const { form, slippage, tokenAAddress, tokenBAddress } = useLiquidityFormWithDebounced();
  const { data: publicKey } = useWalletPublicKey();

  // Server Action state
  const initialState: LiquidityFormState = { success: false };
  const [state, formAction] = useActionState(submitLiquidityAction, initialState);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    // Add form values to FormData for Server Action
    formData.set("tokenAAmount", form.state.values.tokenAAmount);
    formData.set("tokenBAmount", form.state.values.tokenBAmount);
    formData.set("tokenAAddress", tokenAAddress || "");
    formData.set("tokenBAddress", tokenBAddress || "");
    formData.set("slippage", slippage);
    formData.set("userAddress", publicKey?.toBase58() || "");

    // Call Server Action
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Existing form inputs */}
      <input
        type="number"
        value={form.state.values.tokenAAmount}
        onChange={(e) => form.setFieldValue("tokenAAmount", e.target.value)}
        placeholder="Token A Amount"
      />

      <input
        type="number"
        value={form.state.values.tokenBAmount}
        onChange={(e) => form.setFieldValue("tokenBAmount", e.target.value)}
        placeholder="Token B Amount"
      />

      {/* Server Action error display */}
      {state.error && (
        <div className="error">
          {state.error}
        </div>
      )}

      {/* Success state */}
      {state.success && state.transaction && (
        <div className="success">
          Transaction created! Signature: {state.transaction.slice(0, 8)}...
        </div>
      )}

      <button type="submit">
        Add Liquidity (Server Action)
      </button>
    </form>
  );
}

/**
 * Example 2: Enhanced Form with Optimistic Updates
 *
 * This shows how to add optimistic updates for better UX
 * while maintaining the Server Action integration.
 */
export function OptimisticServerActionExample() {
  const { form, slippage, tokenAAddress, tokenBAddress } = useLiquidityFormWithDebounced();
  const { data: publicKey } = useWalletPublicKey();

  // Server Action state
  const initialState: LiquidityFormState = { success: false };
  const [state, formAction] = useActionState(submitLiquidityAction, initialState);

  // Optimistic state for immediate UI feedback
  const [optimisticState, addOptimistic] = useOptimistic(
    { isSubmitting: false, lastSubmission: null as Date | null },
    (currentState, newState: { isSubmitting: boolean; lastSubmission?: Date }) => ({
      ...currentState,
      ...newState,
    })
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Optimistic update
    startTransition(() => {
      addOptimistic({
        isSubmitting: true,
        lastSubmission: new Date(),
      });
    });

    const formData = new FormData(event.currentTarget);
    formData.set("tokenAAmount", form.state.values.tokenAAmount);
    formData.set("tokenBAmount", form.state.values.tokenBAmount);
    formData.set("tokenAAddress", tokenAAddress || "");
    formData.set("tokenBAddress", tokenBAddress || "");
    formData.set("slippage", slippage);
    formData.set("userAddress", publicKey?.toBase58() || "");

    // Call Server Action
    startTransition(() => {
      formAction(formData);
    });
  };

  // Reset optimistic state when server responds
  React.useEffect(() => {
    if (state.success !== undefined) {
      addOptimistic({ isSubmitting: false });
    }
  }, [state.success, addOptimistic]);

  const isSubmitting = optimisticState.isSubmitting;

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={form.state.values.tokenAAmount}
        onChange={(e) => form.setFieldValue("tokenAAmount", e.target.value)}
        placeholder="Token A Amount"
        disabled={isSubmitting}
      />

      <input
        type="number"
        value={form.state.values.tokenBAmount}
        onChange={(e) => form.setFieldValue("tokenBAmount", e.target.value)}
        placeholder="Token B Amount"
        disabled={isSubmitting}
      />

      {state.error && (
        <div className="error">
          {state.error}
        </div>
      )}

      {isSubmitting && (
        <div className="loading">
          Processing transaction...
        </div>
      )}

      {state.success && state.transaction && (
        <div className="success">
          Transaction ready for signing!
        </div>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Processing..." : "Add Liquidity"}
      </button>
    </form>
  );
}

/**
 * Example 3: Hybrid Approach
 *
 * This shows how to combine Server Actions with existing client-side logic
 * for a seamless integration that leverages both approaches.
 */
export function HybridServerActionExample() {
  const {
    form,
    slippage,
    tokenAAddress,
    tokenBAddress,
    handleAmountChange,
  } = useLiquidityFormWithDebounced();
  const { data: publicKey } = useWalletPublicKey();

  // Server Action state
  const [state, formAction] = useActionState(submitLiquidityAction, { success: false });

  // Track which approach is being used
  const [submissionMode, setSubmissionMode] = React.useState<'client' | 'server'>('client');

  const handleServerSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionMode('server');

    const formData = new FormData(event.currentTarget);
    formData.set("tokenAAmount", form.state.values.tokenAAmount);
    formData.set("tokenBAmount", form.state.values.tokenBAmount);
    formData.set("tokenAAddress", tokenAAddress || "");
    formData.set("tokenBAddress", tokenBAddress || "");
    formData.set("slippage", slippage);
    formData.set("userAddress", publicKey?.toBase58() || "");

    startTransition(() => {
      formAction(formData);
    });
  };

  const handleClientSubmit = () => {
    setSubmissionMode('client');
    // Use existing client-side submit logic
    form.handleSubmit();
  };

  // When Server Action succeeds, hand off to client-side wallet integration
  React.useEffect(() => {
    if (state.success && state.transaction && submissionMode === 'server') {
      // Here you would integrate with existing wallet signing logic
      console.log("Server Action succeeded, ready for client-side signing:", state.transaction);

      // You could trigger the existing client-side flow here
      // or set up the transaction for wallet signing
    }
  }, [state.success, state.transaction, submissionMode]);

  return (
    <div>
      <form onSubmit={handleServerSubmit}>
        <input
          type="number"
          value={form.state.values.tokenAAmount}
          onChange={(e) => handleAmountChange(e, 'buy')}
          placeholder="Token A Amount"
        />

        <input
          type="number"
          value={form.state.values.tokenBAmount}
          onChange={(e) => handleAmountChange(e, 'sell')}
          placeholder="Token B Amount"
        />

        <div className="button-group">
          <button type="submit">
            Submit via Server Action
          </button>

          <button type="button" onClick={handleClientSubmit}>
            Submit via Client
          </button>
        </div>
      </form>

      {/* Status display */}
      <div className="status">
        <p>Mode: {submissionMode}</p>

        {state.error && (
          <div className="error">Server Error: {state.error}</div>
        )}

        {state.success && submissionMode === 'server' && (
          <div className="success">
            Server Action completed! Transaction ready for signing.
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 4: Migration Helper Component
 *
 * This shows how to gradually migrate from client-only to hybrid approach
 * with feature flags or gradual rollout.
 */
export function MigrationHelperExample() {
  const [useServerActions, setUseServerActions] = React.useState(false);

  // This could be replaced with a feature flag system
  const shouldUseServerActions = useServerActions; // || featureFlags.serverActions

  if (shouldUseServerActions) {
    return (
      <div>
        <button onClick={() => setUseServerActions(false)}>
          Switch to Client Mode
        </button>
        <HybridServerActionExample />
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setUseServerActions(true)}>
        Switch to Server Action Mode
      </button>
      {/* Render existing component */}
      <div>Existing client-only implementation would go here</div>
    </div>
  );
}

/**
 * Example 5: Testing Utilities
 *
 * Utilities for testing Server Actions integration
 */
export const testUtils = {
  // Mock Server Action for testing
  createMockServerAction: (response: Partial<LiquidityFormState>) => {
    return async (prevState: LiquidityFormState, formData: FormData): Promise<LiquidityFormState> => {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        success: true,
        ...response,
      };
    };
  },

  // Extract form data for testing
  extractFormData: (formData: FormData) => {
    return {
      tokenAAmount: formData.get("tokenAAmount") as string,
      tokenBAmount: formData.get("tokenBAmount") as string,
      tokenAAddress: formData.get("tokenAAddress") as string,
      tokenBAddress: formData.get("tokenBAddress") as string,
      slippage: formData.get("slippage") as string,
      userAddress: formData.get("userAddress") as string,
    };
  },

  // Validate form data structure
  validateFormData: (formData: FormData): boolean => {
    const required = ["tokenAAmount", "tokenBAmount", "userAddress"];
    return required.every(field => formData.get(field) !== null);
  },
};