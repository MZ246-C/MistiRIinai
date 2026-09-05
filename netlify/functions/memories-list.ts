import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import { requireSession } from "./_shared/auth";
import { env } from "./_shared/env";
import { json, unauthorized, serverError } from "./_shared/http";

const PAGE_SIZE_DEFAULT = 30;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const session = await requireSession(event);
  if (!session) return unauthorized();

  try {
    const qs = event.queryStringParameters || {};
    const page = Math.max(1, Number(qs.page ?? "1"));
    const pageSize = Math.min(100, Math.max(1, Number(qs.pageSize ?? PAGE_SIZE_DEFAULT)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const db = supabaseAdmin();
    let query = db
      .from("memories")
      .select(
        "id, title, description, type, thumbnail_path, storage_path, is_favorite, date_taken, created_at, location",
        { count: "exact" }
      );

    if (qs.type && qs.type !== "all") {
      query = query.eq("type", qs.type);
    }
    if (qs.favorite === "true") {
      query = query.eq("is_favorite", true);
    }
    if (qs.dateFrom) {
      query = query.gte("date_taken", qs.dateFrom);
    }
    if (qs.dateTo) {
      query = query.lte("date_taken", qs.dateTo);
    }
    if (qs.q) {
      const term = qs.q.replace(/[%_]/g, "");
      query = query.or(
        `title.ilike.%${term}%,description.ilike.%${term}%,text_content.ilike.%${term}%,location.ilike.%${term}%`
      );
    }

    const sort = qs.sort ?? "newest";
    if (sort === "oldest") query = query.order("created_at", { ascending: true });
    else if (sort === "recently_updated") query = query.order("updated_at", { ascending: false });
    else if (sort === "alphabetical") query = query.order("title", { ascending: true });
    else query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    // Generate a short-lived signed URL for the thumbnail of each photo,
    // so the gallery has something to render without a separate request
    // per card. Videos/audio/documents/text show an icon instead — we
    // don't want to mint a signed URL for every video just to render a
    // grid card. If a thumbnail was generated (thumbnail_path), prefer
    // that over the full original.
    const withSignedThumbs = await Promise.all(
      (data ?? []).map(async (m) => {
        if (m.type !== "photo") return { ...m, thumbUrl: null };
        const path = m.thumbnail_path || m.storage_path;
        if (!path) return { ...m, thumbUrl: null };
        const { data: signed } = await db.storage
          .from(env.storageBucket)
          .createSignedUrl(path, env.signedUrlTtlSeconds);
        return { ...m, thumbUrl: signed?.signedUrl ?? null };
      })
    );

    return json(200, {
      memories: withSignedThumbs,
      page,
      pageSize,
      total: count ?? 0,
    });
  } catch (err) {
    return serverError(err, "memories-list");
  }
};
