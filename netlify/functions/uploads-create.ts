import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import { requireSession } from "./_shared/auth";
import { env } from "./_shared/env";
import { json, unauthorized, badRequest, serverError, parseJsonBody } from "./_shared/http";
import { validateFile, generateStorageKey } from "./_shared/fileValidation";

interface UploadCreateBody {
  filename?: string;
  mimeType?: string;
  fileSizeBytes?: number;
}

// Browser uploads big files (esp. video) directly to Supabase Storage using
// a short-lived signed upload token — never through this serverless
// function's body, which avoids Netlify Functions' request-size limits
// (see spec §43 "large video handling").
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const session = await requireSession(event);
  if (!session) return unauthorized();

  const body = parseJsonBody<UploadCreateBody>(event);
  if (!body?.filename || !body.mimeType || !body.fileSizeBytes) {
    return badRequest("Missing filename, mimeType, or fileSizeBytes.");
  }

  const validation = validateFile(body.filename, body.mimeType, body.fileSizeBytes);
  if (!validation.ok) {
    return badRequest(validation.reason ?? "That file isn't allowed.");
  }

  try {
    const storageKey = generateStorageKey(body.filename);
    const db = supabaseAdmin();
    const { data, error } = await db.storage
      .from(env.storageBucket)
      .createSignedUploadUrl(storageKey);

    if (error) throw error;

    return json(200, {
      storagePath: storageKey,
      signedUrl: data.signedUrl,
      token: data.token,
      memoryType: validation.memoryType,
    });
  } catch (err) {
    return serverError(err, "uploads-create");
  }
};
