import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import { requireSession } from "./_shared/auth";
import {
  json,
  unauthorized,
  badRequest,
  notFound,
  serverError,
  parseJsonBody,
  getClientIp,
} from "./_shared/http";
import { logAudit } from "./_shared/audit";

interface UpdateEventBody {
  title?: string;
  description?: string;
  startDatetime?: string;
  endDatetime?: string | null;
  allDay?: boolean;
  category?: string;
  color?: string;
  recurrenceRule?: string | null;
  reminder?: string;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "PATCH" && event.httpMethod !== "PUT") {
    return json(405, { error: "Method not allowed" });
  }

  const session = await requireSession(event);
  if (!session) return unauthorized();

  const id = event.queryStringParameters?.id;
  if (!id) return badRequest("Missing event id.");

  const body = parseJsonBody<UpdateEventBody>(event);
  if (!body) return badRequest("Nothing to update.");

  try {
    const db = supabaseAdmin();
    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = body.title.trim().slice(0, 200);
    if (body.description !== undefined) patch.description = body.description?.slice(0, 2000);
    if (body.startDatetime !== undefined) patch.start_datetime = body.startDatetime;
    if (body.endDatetime !== undefined) patch.end_datetime = body.endDatetime;
    if (body.allDay !== undefined) patch.all_day = body.allDay;
    if (body.category !== undefined) patch.category = body.category;
    if (body.color !== undefined) patch.color = body.color;
    if (body.recurrenceRule !== undefined) patch.recurrence_rule = body.recurrenceRule;
    if (body.reminder !== undefined) patch.reminder = body.reminder;

    const { data, error } = await db
      .from("calendar_events")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) return notFound("That event couldn't be found.");

    await logAudit("edit_calendar_event", { target: id, ip: getClientIp(event) });

    return json(200, { event: data });
  } catch (err) {
    return serverError(err, "calendar-update");
  }
};
