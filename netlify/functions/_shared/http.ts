import type { HandlerEvent } from "@netlify/functions";

export type JsonBody = Record<string, unknown> | unknown[];

const BASE_HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export function json(
  statusCode: number,
  body: JsonBody,
  extraHeaders: Record<string, string> = {}
) {
  return {
    statusCode,
    headers: { ...BASE_HEADERS, ...extraHeaders },
    body: JSON.stringify(body),
  };
}

export function badRequest(message: string) {
  return json(400, { error: message });
}

export function unauthorized(message = "You need to sign in to do that.") {
  return json(401, { error: message });
}

export function forbidden(message = "You don't have permission to do that.") {
  return json(403, { error: message });
}

export function notFound(message = "That memory couldn't be found.") {
  return json(404, { error: message });
}

export function tooManyRequests(message: string) {
  return json(429, { error: message });
}

// Never leak stack traces or raw error text to the client.
export function serverError(err: unknown, context: string) {
  // eslint-disable-next-line no-console
  console.error(`[${context}]`, err);
  return json(500, {
    error: "Something went wrong on our end. Please try again in a moment.",
  });
}

export function getClientIp(event: HandlerEvent): string {
  const fwd = event.headers["x-forwarded-for"] || event.headers["client-ip"];
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

export function parseJsonBody<T>(event: HandlerEvent): T | null {
  if (!event.body) return null;
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf-8")
      : event.body;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
