type WorkerEnv = {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
};

type WorkerHandler = {
  fetch(request: Request, env: WorkerEnv, ctx: unknown): Promise<Response>;
};

const handler: WorkerHandler = {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request);
    }

    try {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) {
        return asset;
      }
    } catch (error) {
      console.error("Asset fetch failed", error);
    }

    const indexUrl = new URL("/", request.url);
    const indexRequest = new Request(indexUrl.toString(), request);
    return env.ASSETS.fetch(indexRequest);
  }
};

export default handler;

async function handleApi(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/api/health") {
    return json({ ok: true });
  }

  return json({ error: "Not found" }, 404);
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
