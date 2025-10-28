export function formatError(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    return error.message || "Unexpected error";
  }
  if (error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return "Something went wrong";
}
