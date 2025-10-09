"use client";

import { useState } from "react";
import { useTokenOrder } from "../_hooks/useTokenOrder";

/**
 * Debug panel for token order state (development only).
 *
 * Displays current token order context in a non-intrusive panel.
 * Only renders in development mode.
 *
 * Features:
 * - Collapsible panel (doesn't clutter UI)
 * - Shows UI order, Protocol order, and mapping
 * - Color-coded for readability
 * - Updates in real-time as tokens change
 *
 * @example
 * ```tsx
 * // Add to your layout or page
 * export function LiquidityPage() {
 *   return (
 *     <>
 *       <LiquidityForm />
 *       <TokenOrderDebugPanel />
 *     </>
 *   );
 * }
 * ```
 */
export function TokenOrderDebugPanel() {
  const orderContext = useTokenOrder();
  const [isExpanded, setIsExpanded] = useState(false);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 max-w-md">
      {}
      <button
        className="mb-2 w-full rounded-t border border-green-600 bg-green-900 px-3 py-2 text-left font-mono text-green-300 text-xs hover:bg-green-800"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        {isExpanded ? "▼" : "▶"} Token Order Debug
        {!orderContext && (
          <span className="ml-2 text-yellow-400">(No context)</span>
        )}
      </button>

      {}
      {isExpanded && (
        <div className="rounded-b border border-green-600 border-t-0 bg-green-950 p-3 font-mono text-xs shadow-xl">
          {!orderContext ? (
            <div className="text-yellow-400">
              ⚠️ Token order context not available
              <br />
              <span className="text-green-400">
                Select tokens in URL params to see context
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {}
              <div>
                <div className="mb-1 font-bold text-blue-400">
                  UI Order (User Selection)
                </div>
                <div className="space-y-1 pl-2">
                  <div className="text-green-300">
                    <span className="text-green-500">tokenA:</span>{" "}
                    {orderContext.ui.tokenA.slice(0, 8)}...
                  </div>
                  <div className="text-green-300">
                    <span className="text-green-500">tokenB:</span>{" "}
                    {orderContext.ui.tokenB.slice(0, 8)}...
                  </div>
                </div>
              </div>

              {}
              <div>
                <div className="mb-1 font-bold text-purple-400">
                  Protocol Order (Sorted)
                </div>
                <div className="space-y-1 pl-2">
                  <div className="text-green-300">
                    <span className="text-green-500">tokenX:</span>{" "}
                    {orderContext.protocol.tokenX.slice(0, 8)}...
                  </div>
                  <div className="text-green-300">
                    <span className="text-green-500">tokenY:</span>{" "}
                    {orderContext.protocol.tokenY.slice(0, 8)}...
                  </div>
                </div>
              </div>

              {}
              <div>
                <div className="mb-1 font-bold text-orange-400">Mapping</div>
                <div className="space-y-1 pl-2">
                  <div className="text-green-300">
                    <span className="text-green-500">tokenAIsX:</span>{" "}
                    {orderContext.mapping.tokenAIsX ? (
                      <span className="text-green-400">✓ true</span>
                    ) : (
                      <span className="text-red-400">✗ false</span>
                    )}
                  </div>
                  <div className="text-green-300">
                    <span className="text-green-500">tokenBIsY:</span>{" "}
                    {orderContext.mapping.tokenBIsY ? (
                      <span className="text-green-400">✓ true</span>
                    ) : (
                      <span className="text-red-400">✗ false</span>
                    )}
                  </div>
                </div>
              </div>

              {}
              <div className="mt-3 border-green-700 border-t pt-2">
                <div className="text-green-500">Flow:</div>
                <div className="mt-1 pl-2 text-green-300">
                  {orderContext.mapping.tokenAIsX ? (
                    <>
                      tokenA → tokenX ✓
                      <br />
                      tokenB → tokenY ✓
                    </>
                  ) : (
                    <>
                      tokenA → tokenY (swapped)
                      <br />
                      tokenB → tokenX (swapped)
                    </>
                  )}
                </div>
              </div>

              {}
              <button
                className="mt-2 w-full rounded bg-green-800 px-2 py-1 text-green-300 hover:bg-green-700"
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(orderContext, null, 2),
                  );
                }}
                type="button"
              >
                📋 Copy JSON
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
