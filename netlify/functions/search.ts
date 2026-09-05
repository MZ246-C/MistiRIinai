import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import { requireSession } from "./_shared/auth";
import { json, unauthorized, badRequest, serverError } from "./_shared/http";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const session = await requireSession(event);
  if (!session) return unauthorized();

  const q = event.queryStringParameters?.q?.trim();
  if (!q || q.length < 1) return badRequest("Type something to search for.");

  try {
    const db = supabaseAdmin();
    const term = q.replace(/[%_]/g, "");

    const [memoriesRes, eventsRes] = await Promise.all([
      db
        .from("memories")
        .select("id, title, description, type, thumbnail_path, date_taken, is_favorite")
        .or(
          `title.ilike.%${term}%,description.ilike.%${term}%,text_content.ilike.%${term}%,location.ilike.%${term}%`
        )
        .order("created_at", { ascending: false })
        .limit(25),
      db
        .from("calendar_events")
        .select("id, title, description, start_datetime, category, color")
        .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
        .order("start_datetime", { ascending: true })
        .limit(25),
    ]);

    if (memoriesRes.error) throw memoriesRes.error;
    if (eventsRes.error) throw eventsRes.error;

    return json(200, {
      memories: memoriesRes.data,
      events: eventsRes.data,
    });
  } catch (err) {
    return serverError(err, "search");
  }
};
