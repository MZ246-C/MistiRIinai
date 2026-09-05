import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import { requireSession } from "./_shared/auth";
import { env } from "./_shared/env";
import { json, unauthorized, notFound, badRequest, serverError } from "./_shared/http";
import { getTagsForMemory } from "./_shared/tags";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const session = await requireSession(event);
  if (!session) return unauthorized();

  const id = event.queryStringParameters?.id;
  if (!id) return badRequest("Missing memory id.");

  try {
    const db = supabaseAdmin();
    const { data: memory, error } = await db
      .from("memories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!memory) return notFound("That memory couldn't be found.");

    let signedUrl: string | null = null;
    let thumbnailUrl: string | null = null;

    if (memory.storage_path) {
      const { data: signed } = await db.storage
        .from(env.storageBucket)
        .createSignedUrl(memory.storage_path, env.signedUrlTtlSeconds);
      signedUrl = signed?.signedUrl ?? null;
    }
    if (memory.thumbnail_path) {
      const { data: signedThumb } = await db.storage
        .from(env.storageBucket)
        .createSignedUrl(memory.thumbnail_path, env.signedUrlTtlSeconds);
      thumbnailUrl = signedThumb?.signedUrl ?? null;
    }

    const tags = await getTagsForMemory(id);

    return json(200, { memory: { ...memory, tags, signedUrl, thumbnailUrl } });
  } catch (err) {
    return serverError(err, "memories-get");
  }
};
