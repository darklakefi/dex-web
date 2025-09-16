export function createSolanaGatewayClient() {
	throw new Error("Server-only client should not be called in browser");
}

export function createDarklakeIntegrationsClient() {
	throw new Error("Server-only client should not be called in browser");
}
