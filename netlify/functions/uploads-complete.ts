import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import { requireSession } from "./_shared/auth";
import { env } from "./_shared/env";
import {
  json,
  unauthorized,
  badRequest,
  serverError,
  parseJsonBody,
  getClientIp,
} from "./_shared/http";
import { createMemoryRecord } from "./_shared/createMemory";
import type { MemoryType } from "./_shared/fileValidation";
import { logAudit } from "./_shared/audit";

interface CompleteBody {
  storagePath: string;
  memoryType: MemoryType;
  title: string;
  description?: string;
  originalFilename?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  dateTaken?: string;
  location?: string;
  isFavorite?: boolean;
  people?: string[];
  tags?: string[];
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const session = await requireSession(event);
  if (!session) return unauthorized();

  const body = parseJsonBody<CompleteBody>(event);
  if (!body?.storagePath || !body.memoryType || !body.title) {
    return badRequest("Missing storagePath, memoryType, or title.");
  }

  try {
    // Confirm the object actually exists in storage before creating a DB
    // record that points at it — this prevents dangling references if the
    // browser-to-storage upload silently failed.
    const db = supabaseAdmin();
    const folder = body.storagePath.split("/").slice(0, -1).join("/");
    const filePart = body.storagePath.split("/").pop();
    const { data: listing, error: listError } = await db.storage
      .from(env.storageBucket)
      .list(folder || undefined, { search: filePart });

    if (listError) throw listError;
    const exists = (listing ?? []).some((f) => f.name === filePart);
    if (!exists) {
      return badRequest(
        "We couldn't find the uploaded file yet. Please try uploading again."
      );
    }

    const memory = await createMemoryRecord({
      title: body.title,
      description: body.description,
      type: body.memoryType,
      storagePath: body.storagePath,
      originalFilename: body.originalFilename,
      mimeType: body.mimeType,
      fileSize: body.fileSizeBytes,
      dateTaken: body.dateTaken,
      location: body.location,
      isFavorite: body.isFavorite,
      people: body.people,
      tags: body.tags,
    });

    await logAudit("upload", { target: memory.id, ip: getClientIp(event) });

    return json(201, { memory });
  } catch (err) {
    return serverError(err, "uploads-complete");
  }
};
