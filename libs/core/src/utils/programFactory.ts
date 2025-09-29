import { type AnchorProvider, type Idl, Program } from "@coral-xyz/anchor";
import { validateIdlComprehensive } from "./idlValidation";

/**
 * Type-safe wrapper for creating Anchor programs with IDL validation
 */
export const ProgramFactory = {
	/**
	 * Creates a validated Anchor program instance
	 * @param idl - The IDL to use for program creation
	 * @param provider - The Anchor provider
	 * @param requiredInstructions - Array of instruction names that must be present in the IDL
	 * @returns A validated Program instance
	 * @throws Error if IDL validation fails or Program creation fails
	 */
	createDarklakeProgram(
		idl: unknown,
		provider: AnchorProvider,
		requiredInstructions: string[] = [],
	): Program<Idl> {
		// Pre-validate IDL structure
		if (!validateIdlComprehensive(idl, requiredInstructions)) {
			throw new Error(
				`IDL validation failed. Required instructions: ${requiredInstructions.join(", ")}`,
			);
		}

		// Create Program with error handling
		try {
			const program = new Program(idl as Idl, provider);

			// Runtime validation of program methods
			if (requiredInstructions.length > 0) {
				const missingMethods = requiredInstructions.filter((instruction) => {
					// Convert snake_case to camelCase for method names
					const methodName = instruction.replace(/_([a-z])/g, (_, letter) =>
						letter.toUpperCase(),
					);
					return !program.methods[methodName];
				});

				if (missingMethods.length > 0) {
					throw new Error(
						`Program missing required methods: ${missingMethods.join(", ")}`,
					);
				}
			}

			return program;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to create Darklake program: ${errorMessage}`);
		}
	},

	/**
	 * Validates that a program has specific methods available
	 * @param program - The Anchor program to validate
	 * @param requiredMethods - Array of method names that must be available
	 * @returns boolean indicating if all methods are available
	 */
	validateProgramMethods(
		program: Program<Idl>,
		requiredMethods: string[],
	): boolean {
		return requiredMethods.every(
			(method) => typeof program.methods[method] === "function",
		);
	}
}

// Export a pre-configured factory function for liquidity operations
export const createLiquidityProgram = (
	idl: unknown,
	provider: AnchorProvider,
): Program<Idl> => {
	return ProgramFactory.createDarklakeProgram(idl, provider, [
		"add_liquidity",
		"remove_liquidity",
		"initialize_pool",
	]);
};

// Export a pre-configured factory function for swap operations
export const createSwapProgram = (
	idl: unknown,
	provider: AnchorProvider,
): Program<Idl> => {
	return ProgramFactory.createDarklakeProgram(idl, provider, [
		"swap",
		"settle",
		"cancel",
	]);
};
