import type { Handler } from "@netlify/functions";
import { json, serverError, getClientIp } from "./_shared/http";
import {
  getSessionTokenFromEvent,
  revokeSessionByToken,
  buildLogoutCookie,
} from "./_shared/auth";
import { logAudit } from "./_shared/audit";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const token = getSessionTokenFromEvent(event);
    if (token) {
      await revokeSessionByToken(token);
      await logAudit("logout", { ip: getClientIp(event) });
    }
    return json(200, { ok: true }, { "Set-Cookie": buildLogoutCookie() });
  } catch (err) {
    return serverError(err, "auth-logout");
  }
};
