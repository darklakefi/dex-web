import { rpcHandler } from "@dex-web/orpc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  try {
    const { response } = await rpcHandler.handle(request, {
      context: {
        headers: Object.fromEntries(request.headers.entries()),
      },
      prefix: "/rpc",
    });

    return response ?? new Response("Not found", { status: 404 });
  } catch (error) {
    console.error("RPC handler error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
        status: 500,
      },
    );
  }
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const OPTIONS = handleRequest;
