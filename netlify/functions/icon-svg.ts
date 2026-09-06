import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";

// Public on purpose — the OS fetches this before you're logged in.
// It only ever returns branding colors, never private data.

function escapeHex(input: string | null | undefined, fallback: string): string {
  if (!input) return fallback;
  const trimmed = input.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let bg = "#311D28";
  let letter = "#B99040";

  try {
    const db = supabaseAdmin();
    const { data } = await db
      .from("app_config")
      .select("icon_bg_color, icon_letter_color")
      .eq("id", 1)
      .maybeSingle();

    bg = escapeHex(data?.icon_bg_color, bg);
    letter = escapeHex(data?.icon_letter_color, letter);
  } catch {
    // fall back to defaults if Supabase is briefly unreachable
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${bg}"/>
  <text x="256" y="336" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-weight="700"
        font-size="300" fill="${letter}">M</text>
</svg>`;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=86400, must-revalidate",
    },
    body: svg,
  };
};