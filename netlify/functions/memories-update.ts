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
import { syncMemoryTags } from "./_shared/tags";
import { logAudit } from "./_shared/audit";

interface UpdateBody {
  title?: string;
  description?: string;
  location?: string;
  dateTaken?: string;
  isFavorite?: boolean;
  people?: string[];
  tags?: string[];
  textContent?: string;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "PATCH" && event.httpMethod !== "PUT") {
    return json(405, { error: "Method not allowed" });
  }

  const session = await requireSession(event);
  if (!session) return unauthorized();

  const id = event.queryStringParameters?.id;
  if (!id) return badRequest("Missing memory id.");

  const body = parseJsonBody<UpdateBody>(event);
  if (!body) return badRequest("Nothing to update.");

  try {
    const db = supabaseAdmin();
    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = body.title.trim().slice(0, 200);
    if (body.description !== undefined) patch.description = body.description.slice(0, 4000);
    if (body.location !== undefined) patch.location = body.location.slice(0, 200);
    if (body.dateTaken !== undefined) patch.date_taken = body.dateTaken;
    if (body.isFavorite !== undefined) patch.is_favorite = body.isFavorite;
    if (body.people !== undefined) patch.people = body.people;
    if (body.textContent !== undefined) patch.text_content = body.textContent;

    const { data, error } = await db
      .from("memories")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) return notFound();

    if (body.tags !== undefined) {
      await syncMemoryTags(id, body.tags);
    }

    await logAudit("edit_memory", { target: id, ip: getClientIp(event) });

    return json(200, { memory: data });
  } catch (err) {
    return serverError(err, "memories-update");
  }
};
