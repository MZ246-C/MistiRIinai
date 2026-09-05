import type { Handler } from "@netlify/functions";
import { json, serverError } from "./_shared/http";
import { requireSession } from "./_shared/auth";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const session = await requireSession(event);
    if (!session) {
      return json(200, { authenticated: false });
    }
    return json(200, {
      authenticated: true,
      role: session.role,
      expiresAt: session.expires_at,
    });
  } catch (err) {
    return serverError(err, "auth-session");
  }
};
