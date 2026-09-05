import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import { requireSession } from "./_shared/auth";
import { json, unauthorized, badRequest, serverError, parseJsonBody } from "./_shared/http";

interface SettingsBody {
  siteSubtitle?: string;
  defaultTheme?: "light" | "dark" | "system";
  defaultGalleryLayout?: "masonry" | "grid" | "list";
  defaultSort?: "newest" | "oldest" | "recently_updated" | "alphabetical";
  dateFormat?: string;
  timeFormat?: "12h" | "24h";
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "PATCH" && event.httpMethod !== "PUT") {
    return json(405, { error: "Method not allowed" });
  }

  const session = await requireSession(event);
  if (!session) return unauthorized();

  const body = parseJsonBody<SettingsBody>(event);
  if (!body) return badRequest("Nothing to update.");

  try {
    const db = supabaseAdmin();
    const patch: Record<string, unknown> = {};
    if (body.siteSubtitle !== undefined) patch.site_subtitle = body.siteSubtitle.slice(0, 200);
    if (body.defaultTheme !== undefined) patch.default_theme = body.defaultTheme;
    if (body.defaultGalleryLayout !== undefined) patch.default_gallery_layout = body.defaultGalleryLayout;
    if (body.defaultSort !== undefined) patch.default_sort = body.defaultSort;
    if (body.dateFormat !== undefined) patch.date_format = body.dateFormat;
    if (body.timeFormat !== undefined) patch.time_format = body.timeFormat;

    const { data, error } = await db
      .from("app_config")
      .upsert({ id: 1, ...patch })
      .select("*")
      .single();

    if (error) throw error;

    return json(200, { settings: data });
  } catch (err) {
    return serverError(err, "settings-update");
  }
};
