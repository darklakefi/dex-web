/**
 * Query Helper Utilities
 *
 * Shared utilities for query hooks to maintain consistency across the codebase.
 *
 * @module queryHelpers
 */

/**
 * Combines base parameter validation with user-provided enabled option.
 *
 * This helper ensures that queries only run when:
 * 1. All required parameters are valid (base validation)
 * 2. The user hasn't explicitly disabled the query (options.enabled)
 *
 * The pattern prevents the user's enabled option from overriding base validation,
 * while still allowing users to disable queries even when params are valid.
 *
 * @param hasRequiredParams - Whether all required parameters are present and valid
 * @param userEnabled - Optional user-provided enabled state
 * @returns Combined enabled state (defaults to true if userEnabled is undefined)
 *
 * @example
 * ```tsx
 * // In a query hook
 * const hasRequiredParams = !!tokenX && !!tokenY && amount > 0;
 * const enabled = combineEnabled(hasRequiredParams, options?.enabled);
 *
 * return useQuery({
 *   ...queryOptions,
 *   enabled,
 * });
 * ```
 *
 * Truth table:
 * | hasRequiredParams | userEnabled  | Result |
 * |-------------------|--------------|--------|
 * | false             | undefined    | false  |
 * | false             | true         | false  |
 * | false             | false        | false  |
 * | true              | undefined    | true   |
 * | true              | true         | true   |
 * | true              | false        | false  |
 */
export function combineEnabled(
  hasRequiredParams: boolean,
  userEnabled?: boolean,
): boolean {
  return hasRequiredParams && (userEnabled ?? true);
}

/**
 * Validates that all provided values are truthy (non-empty, non-null, non-undefined).
 *
 * @param values - Array of values to validate
 * @returns true if all values are truthy, false otherwise
 *
 * @example
 * ```tsx
 * const hasParams = allTruthy([tokenX, tokenY, ownerAddress]);
 * // Equivalent to: !!tokenX && !!tokenY && !!ownerAddress
 * ```
 */
export function allTruthy(values: unknown[]): boolean {
  return values.every((value) => !!value);
}
