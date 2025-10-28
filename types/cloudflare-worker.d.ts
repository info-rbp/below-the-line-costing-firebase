export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type AssetFetcher = {
  fetch(request: Request): Promise<Response>;
};

export interface WorkerEnv {
  ASSETS: AssetFetcher;
}

export interface ExportedHandler {
  fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> | Response;
}
