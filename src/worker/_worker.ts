import type { ExportedHandler, WorkerEnv } from "../../types/cloudflare-worker";

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders(request.headers.get("Origin")),
        });
      }

      if (url.pathname === "/api/health") {
        return json({ ok: true });
      }

      return json({ error: "Not found" }, 404);
    }

    try {
      // @ts-ignore provided by Wrangler asset binding at runtime
      const assetResp = await env.ASSETS.fetch(request);
      if (assetResp.status !== 404) {
        return assetResp;
      }
    } catch (_error) {
      // ignore and fall back to SPA
    }

    const indexUrl = new URL("/", request.url);
    // @ts-ignore provided by Wrangler asset binding at runtime
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
} satisfies ExportedHandler<WorkerEnv>;

function corsHeaders(origin: string | null) {
  const allowedOrigin = origin ?? "*";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(null),
      "Content-Type": "application/json",
    },
  });
}
