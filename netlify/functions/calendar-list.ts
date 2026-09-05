import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import { requireSession } from "./_shared/auth";
import { json, unauthorized, serverError } from "./_shared/http";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const session = await requireSession(event);
  if (!session) return unauthorized();

  try {
    const qs = event.queryStringParameters || {};
    const db = supabaseAdmin();
    let query = db.from("calendar_events").select("*").order("start_datetime", { ascending: true });

    if (qs.from) query = query.gte("start_datetime", qs.from);
    if (qs.to) query = query.lte("start_datetime", qs.to);
    if (qs.category) query = query.eq("category", qs.category);
    if (qs.q) {
      const term = qs.q.replace(/[%_]/g, "");
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return json(200, { events: data });
  } catch (err) {
    return serverError(err, "calendar-list");
  }
};
