import type { Idl } from "@coral-xyz/anchor";

/**
 * Validates that an object conforms to the Anchor IDL interface
 * @param idl - The IDL object to validate
 * @returns Type predicate indicating if the object is a valid Idl
 */
export const validateIdl = (idl: unknown): idl is Idl => {
	if (!idl || typeof idl !== "object") {
		console.error("IDL validation failed: not an object");
		return false;
	}

	const obj = idl as Record<string, unknown>;

	const requiredProps = [
		"address",
		"metadata",
		"instructions",
		"accounts",
		"types",
	];
	for (const prop of requiredProps) {
		if (!(prop in obj)) {
			console.error(`IDL validation failed: missing property '${prop}'`);
			return false;
		}
	}

	if (typeof obj.address !== "string" || obj.address.length === 0) {
		console.error("IDL validation failed: address must be a non-empty string");
		return false;
	}

	if (!obj.metadata || typeof obj.metadata !== "object") {
		console.error("IDL validation failed: metadata must be an object");
		return false;
	}

	const metadata = obj.metadata as Record<string, unknown>;
	if (
		typeof metadata.name !== "string" ||
		typeof metadata.version !== "string"
	) {
		console.error(
			"IDL validation failed: metadata must have name and version strings",
		);
		return false;
	}

	if (!Array.isArray(obj.instructions)) {
		console.error("IDL validation failed: instructions must be an array");
		return false;
	}

	if (!Array.isArray(obj.accounts)) {
		console.error("IDL validation failed: accounts must be an array");
		return false;
	}

	if (!Array.isArray(obj.types)) {
		console.error("IDL validation failed: types must be an array");
		return false;
	}

	return true;
};

/**
 * Validates that an IDL contains specific instructions
 * @param idl - The IDL object to check
 * @param requiredInstructions - Array of instruction names that must be present
 * @returns boolean indicating if all required instructions are present
 */
export const validateIdlInstructions = (
	idl: Idl,
	requiredInstructions: string[],
): boolean => {
	const instructionNames = idl.instructions.map(
		(instruction) => instruction.name,
	);

	const missingInstructions = requiredInstructions.filter(
		(required) => !instructionNames.includes(required),
	);

	if (missingInstructions.length > 0) {
		console.error(
			`IDL validation failed: missing required instructions: ${missingInstructions.join(", ")}`,
		);
		return false;
	}

	return true;
};

/**
 * Comprehensive IDL validation with instruction checking
 * @param idl - The IDL object to validate
 * @param requiredInstructions - Optional array of required instruction names
 * @returns Type predicate indicating if the object is a valid Idl with required instructions
 */
export const validateIdlComprehensive = (
	idl: unknown,
	requiredInstructions: string[] = [],
): idl is Idl => {
	if (!validateIdl(idl)) {
		return false;
	}

	if (requiredInstructions.length > 0) {
		return validateIdlInstructions(idl, requiredInstructions);
	}

	return true;
};