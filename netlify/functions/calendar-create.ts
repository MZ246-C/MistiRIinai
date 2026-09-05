import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import { requireSession } from "./_shared/auth";
import {
  json,
  unauthorized,
  badRequest,
  serverError,
  parseJsonBody,
  getClientIp,
} from "./_shared/http";
import { logAudit } from "./_shared/audit";

interface CreateEventBody {
  title: string;
  description?: string;
  startDatetime: string;
  endDatetime?: string;
  allDay?: boolean;
  category?: string;
  color?: string;
  recurrenceRule?: string;
  reminder?: string;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const session = await requireSession(event);
  if (!session) return unauthorized();

  const body = parseJsonBody<CreateEventBody>(event);
  if (!body?.title || !body.startDatetime) {
    return badRequest("An event needs at least a title and a start date.");
  }

  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("calendar_events")
      .insert({
        title: body.title.trim().slice(0, 200),
        description: body.description?.slice(0, 2000) ?? null,
        start_datetime: body.startDatetime,
        end_datetime: body.endDatetime ?? null,
        all_day: body.allDay ?? true,
        category: body.category ?? "custom",
        color: body.color ?? "#B8903F",
        recurrence_rule: body.recurrenceRule ?? null,
        reminder: body.reminder ?? "none",
        created_by: "owner",
      })
      .select("*")
      .single();

    if (error) throw error;

    await logAudit("create_calendar_event", { target: data.id, ip: getClientIp(event) });

    return json(201, { event: data });
  } catch (err) {
    return serverError(err, "calendar-create");
  }
};
