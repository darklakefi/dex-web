import * as fs from "node:fs";
import * as path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import type {
	CheckTradeStatusRequest,
	CheckTradeStatusResponse,
	GetTokenMetadataListRequest,
	GetTokenMetadataListResponse,
	GetTokenMetadataRequest,
	GetTokenMetadataResponse,
	GetTradesListByUserRequest,
	GetTradesListByUserResponse,
	GrpcClient,
	SignedTransactionRequest,
	SignedTransactionResponse,
	SwapRequest,
	SwapResponse,
} from "./dex-gateway.type";

const config = {
	gatewayHost: process.env.GATEWAY_HOST,
	gatewayPort: parseInt(process.env.GATEWAY_PORT || "50051"),
};

let cachedProtoPath: string | null = null;

const getProtoPath = () => {
	if (cachedProtoPath) {
		return cachedProtoPath;
	}

	console.log(`Current working directory: ${process.cwd()}`);
	console.log(`__dirname: ${__dirname}`);

	const possiblePaths = [
		path.resolve(process.cwd(), "libs/orpc/src/proto", "api.proto"),
		path.resolve(process.cwd(), "../../libs/orpc/src/proto", "api.proto"),
		path.join(__dirname, "..", "chunks", "proto", "api.proto"),
		path.join(__dirname, "proto", "api.proto"),
		path.join(__dirname, "../../chunks/proto", "api.proto"),
		path.join(__dirname, "../../../libs/orpc/src/proto", "api.proto"),
	];

	for (const protoPath of possiblePaths) {
		try {
			fs.accessSync(protoPath);
			console.log(`Found proto file at: ${protoPath}`);
			cachedProtoPath = protoPath;
			return protoPath;
		} catch {}
	}

	const fallbackPath = path.join(
		process.cwd(),
		"libs/orpc/src/proto",
		"api.proto",
	);
	console.warn(
		`Proto file not found in standard locations, using fallback: ${fallbackPath}`,
	);
	cachedProtoPath = fallbackPath;
	return fallbackPath;
};

let gatewayProto: any = null;

function loadProtoDefinition() {
	if (gatewayProto) return gatewayProto;

	if (typeof window !== "undefined") {
		throw new Error("gRPC client should not be used on the client side");
	}

	const protoPath = getProtoPath();
	const protoDir = path.dirname(protoPath);

	console.log(`Loading proto from: ${protoPath}`);

	if (!fs.existsSync(protoPath)) {
		throw new Error(`Proto file not found at ${protoPath}`);
	}

	const packageDefinition = protoLoader.loadSync(protoPath, {
		defaults: true,
		enums: String,
		keepCase: true,
		longs: String,
		oneofs: true,
		includeDirs: [protoDir],
	});

	gatewayProto = grpc.loadPackageDefinition(packageDefinition);
	return gatewayProto;
}

function createGrpcClient(): GrpcClient {
	const proto = loadProtoDefinition();
	const { darklake } = proto as any;

	const client = new darklake.v1.SolanaGatewayService(
		`${config.gatewayHost}:${config.gatewayPort}`,
		grpc.credentials.createInsecure(),
	);

	return {
		checkTradeStatus: (
			request: CheckTradeStatusRequest,
		): Promise<CheckTradeStatusResponse> => {
			return new Promise((resolve, reject) => {
				client.CheckTradeStatus(
					request,
					(error: any, response: CheckTradeStatusResponse) => {
						if (error) {
							reject(error);
						} else {
							resolve(response);
						}
					},
				);
			});
		},
		getTokenMetadata: (
			request: GetTokenMetadataRequest,
		): Promise<GetTokenMetadataResponse> => {
			return new Promise((resolve, reject) => {
				client.GetTokenMetadata(
					request,
					(error: any, response: GetTokenMetadataResponse) => {
						if (error) {
							reject(error);
						} else {
							resolve(response);
						}
					},
				);
			});
		},
		getTokenMetadataList: (
			request: GetTokenMetadataListRequest,
		): Promise<GetTokenMetadataListResponse> => {
			return new Promise((resolve, reject) => {
				client.GetTokenMetadataList(
					request,
					(error: any, response: GetTokenMetadataListResponse) => {
						if (error) {
							reject(error);
						} else {
							resolve(response);
						}
					},
				);
			});
		},
		getTradesListByUser: (
			request: GetTradesListByUserRequest,
		): Promise<GetTradesListByUserResponse> => {
			return new Promise((resolve, reject) => {
				client.GetTradesListByUser(
					request,
					(error: any, response: GetTradesListByUserResponse) => {
						if (error) {
							reject(error);
						} else {
							resolve(response);
						}
					},
				);
			});
		},
		submitSignedTransaction: (
			request: SignedTransactionRequest,
		): Promise<SignedTransactionResponse> => {
			return new Promise((resolve, reject) => {
				client.SendSignedTransaction(
					request,
					(error: any, response: SignedTransactionResponse) => {
						if (error) {
							reject(error);
						} else {
							resolve(response);
						}
					},
				);
			});
		},
		swap: (request: SwapRequest): Promise<SwapResponse> => {
			return new Promise((resolve, reject) => {
				client.CreateUnsignedTransaction(
					request,
					(error: any, response: SwapResponse) => {
						if (error) {
							reject(error);
						} else {
							resolve(response);
						}
					},
				);
			});
		},
	};
}

let dexGatewayClientInstance: GrpcClient | null = null;

export function getDexGatewayClient(): GrpcClient {
	if (!dexGatewayClientInstance) {
		try {
			dexGatewayClientInstance = createGrpcClient();
		} catch (error) {
			console.error("Failed to create gRPC client:", error);
			throw new Error(
				`Failed to initialize gRPC client: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	return dexGatewayClientInstance;
}

export function closeDexGatewayClient(): void {
	if (dexGatewayClientInstance) {
		grpc.closeClient(dexGatewayClientInstance as unknown as grpc.Client);
		dexGatewayClientInstance = null;
	}
}
