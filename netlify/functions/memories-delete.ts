import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import { requireSession } from "./_shared/auth";
import { env } from "./_shared/env";
import {
  json,
  unauthorized,
  badRequest,
  notFound,
  serverError,
  getClientIp,
} from "./_shared/http";
import { logAudit } from "./_shared/audit";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "DELETE") {
    return json(405, { error: "Method not allowed" });
  }

  const session = await requireSession(event);
  if (!session) return unauthorized();

  const id = event.queryStringParameters?.id;
  if (!id) return badRequest("Missing memory id.");

  try {
    const db = supabaseAdmin();
    const { data: memory, error: fetchError } = await db
      .from("memories")
      .select("id, storage_path, thumbnail_path")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!memory) return notFound();

    // Delete the DB row first inside a transaction-like order: if storage
    // deletion fails after this, we log it clearly rather than leaving a
    // record that points at a file we can no longer account for.
    const { error: deleteError } = await db.from("memories").delete().eq("id", id);
    if (deleteError) throw deleteError;

    const pathsToRemove = [memory.storage_path, memory.thumbnail_path].filter(
      (p): p is string => Boolean(p)
    );

    if (pathsToRemove.length > 0) {
      const { error: storageError } = await db.storage
        .from(env.storageBucket)
        .remove(pathsToRemove);
      if (storageError) {
        // eslint-disable-next-line no-console
        console.error(
          `[memories-delete] DB row ${id} deleted but storage cleanup failed`,
          storageError
        );
      }
    }

    await logAudit("delete_memory", { target: id, ip: getClientIp(event) });

    return json(200, { ok: true });
  } catch (err) {
    return serverError(err, "memories-delete");
  }
};
