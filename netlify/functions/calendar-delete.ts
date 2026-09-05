import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import { requireSession } from "./_shared/auth";
import { json, unauthorized, badRequest, serverError, getClientIp } from "./_shared/http";
import { logAudit } from "./_shared/audit";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "DELETE") {
    return json(405, { error: "Method not allowed" });
  }

  const session = await requireSession(event);
  if (!session) return unauthorized();

  const id = event.queryStringParameters?.id;
  if (!id) return badRequest("Missing event id.");

  try {
    const db = supabaseAdmin();
    const { error } = await db.from("calendar_events").delete().eq("id", id);
    if (error) throw error;

    await logAudit("delete_calendar_event", { target: id, ip: getClientIp(event) });

    return json(200, { ok: true });
  } catch (err) {
    return serverError(err, "calendar-delete");
  }
};
