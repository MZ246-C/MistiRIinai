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
    const db = supabaseAdmin();
    const { data } = await db
      .from("app_config")
      .select(
        "site_subtitle, default_theme, default_gallery_layout, default_sort, date_format, time_format"
      )
      .eq("id", 1)
      .maybeSingle();

    return json(200, {
      settings: data ?? {
        site_subtitle: "A little place for all the moments that matter.",
        default_theme: "system",
        default_gallery_layout: "masonry",
        default_sort: "newest",
        date_format: "MMM d, yyyy",
        time_format: "12h",
      },
    });
  } catch (err) {
    return serverError(err, "settings-get");
  }
};
