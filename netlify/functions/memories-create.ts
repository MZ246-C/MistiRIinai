import type { Handler } from "@netlify/functions";
import { requireSession } from "./_shared/auth";
import { json, unauthorized, badRequest, serverError } from "./_shared/http";
import { createMemoryRecord, CreateMemoryInput } from "./_shared/createMemory";
import { logAudit } from "./_shared/audit";
import { parseJsonBody, getClientIp } from "./_shared/http";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const session = await requireSession(event);
  if (!session) return unauthorized();

  const body = parseJsonBody<CreateMemoryInput>(event);
  if (!body || !body.title || !body.type) {
    return badRequest("A memory needs at least a title and a type.");
  }
  if (body.type !== "text") {
    return badRequest(
      "This endpoint is for text memories. File-based memories go through /api/uploads-complete."
    );
  }

  try {
    const memory = await createMemoryRecord(body);
    await logAudit("create_memory", { target: memory.id, ip: getClientIp(event) });
    return json(201, { memory });
  } catch (err) {
    return serverError(err, "memories-create");
  }
};
