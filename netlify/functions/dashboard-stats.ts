import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import { requireSession } from "./_shared/auth";
import { json, unauthorized, serverError } from "./_shared/http";

const TYPES = ["photo", "video", "audio", "document", "text", "other"] as const;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const session = await requireSession(event);
  if (!session) return unauthorized();

  try {
    const db = supabaseAdmin();

    const countPromises = TYPES.map((type) =>
      db.from("memories").select("id", { count: "exact", head: true }).eq("type", type)
    );
    const totalPromise = db.from("memories").select("id", { count: "exact", head: true });

    const [total, ...byType] = await Promise.all([totalPromise, ...countPromises]);

    const counts: Record<string, number> = { total: total.count ?? 0 };
    TYPES.forEach((type, i) => {
      counts[type] = byType[i].count ?? 0;
    });

    const nowIso = new Date().toISOString();
    const { data: upcoming } = await db
      .from("calendar_events")
      .select("id, title, category, start_datetime, color")
      .gte("start_datetime", nowIso)
      .order("start_datetime", { ascending: true })
      .limit(6);

    const { data: recent } = await db
      .from("memories")
      .select("id, title, type, thumbnail_path, created_at, is_favorite")
      .order("created_at", { ascending: false })
      .limit(8);

    return json(200, { counts, upcoming: upcoming ?? [], recent: recent ?? [] });
  } catch (err) {
    return serverError(err, "dashboard-stats");
  }
};
