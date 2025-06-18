import { rpcHandler } from "@dex-web/orpc";

export const dynamic = "force-dynamic";
export const runtime = "edge";

async function handleRequest(request: Request) {
  const { response } = await rpcHandler.handle(request, {
    context: {
      headers: Object.fromEntries(request.headers.entries()),
    },
    prefix: "/rpc",
  });

  return response ?? new Response("Not found", { status: 404 });
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
