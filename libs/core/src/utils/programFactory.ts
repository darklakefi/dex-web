import { type AnchorProvider, type Idl, Program } from "@coral-xyz/anchor";
import { validateIdlComprehensive } from "./idlValidation";

export function createDarklakeProgram(
  idl: unknown,
  provider: AnchorProvider,
  requiredInstructions: string[] = [],
): Program<Idl> {
  if (!validateIdlComprehensive(idl, requiredInstructions)) {
    throw new Error(
      `IDL validation failed. Required instructions: ${requiredInstructions.join(", ")}`,
    );
  }

  try {
    const program = new Program(idl as Idl, provider);

    if (requiredInstructions.length > 0) {
      const missingMethods = requiredInstructions.filter((instruction) => {
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create Darklake program: ${errorMessage}`);
  }
}

export function validateProgramMethods(
  program: Program<Idl>,
  requiredMethods: string[],
): boolean {
  return requiredMethods.every(
    (method) => typeof program.methods[method] === "function",
  );
}

export const createLiquidityProgram = (
  idl: unknown,
  provider: AnchorProvider,
): Program<Idl> => {
  return createDarklakeProgram(idl, provider, [
    "add_liquidity",
    "remove_liquidity",
    "initialize_pool",
  ]);
};

export const createSwapProgram = (
  idl: unknown,
  provider: AnchorProvider,
): Program<Idl> => {
  return createDarklakeProgram(idl, provider, ["swap", "settle", "cancel"]);
};
