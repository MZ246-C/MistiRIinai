import type { Handler } from "@netlify/functions";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import { env } from "./_shared/env";
import { json, badRequest, serverError, getClientIp, parseJsonBody } from "./_shared/http";
import { createSession, buildSessionCookie } from "./_shared/auth";
import { isRateLimited, recordLoginAttempt } from "./_shared/rateLimit";
import { logAudit } from "./_shared/audit";

interface LoginBody {
  password?: string;
}

async function getOrSeedPasswordHash(): Promise<string> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("app_config")
    .select("password_hash")
    .eq("id", 1)
    .maybeSingle();

  if (data?.password_hash) return data.password_hash;

  // First run: seed app_config from the INITIAL_ADMIN_PASSWORD env var.
  // The plaintext env var is only ever read here, hashed immediately,
  // and the hash — never the plaintext — is what gets stored.
  if (!env.initialAdminPassword) {
    throw new Error(
      "No password configured yet: set INITIAL_ADMIN_PASSWORD in your environment."
    );
  }
  const hash = await bcrypt.hash(env.initialAdminPassword, 12);
  await db.from("app_config").upsert({ id: 1, password_hash: hash });
  return hash;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const ip = getClientIp(event);

  try {
    if (await isRateLimited(ip)) {
      return json(429, {
        error:
          "Too many attempts. Please wait a while before trying again.",
      });
    }

    const body = parseJsonBody<LoginBody>(event);
    const password = body?.password;
    if (!password || typeof password !== "string") {
      return badRequest("Please enter a password.");
    }

    const passwordHash = await getOrSeedPasswordHash();
    const isValid = await bcrypt.compare(password, passwordHash);

    await recordLoginAttempt(ip, isValid);

    if (!isValid) {
      await logAudit("login_failed", { ip });
      return json(401, { error: "That password doesn't seem right." });
    }

    const { token, expiresAt } = await createSession(
      ip,
      event.headers["user-agent"]
    );
    await logAudit("login", { ip });

    return json(
      200,
      { ok: true },
      { "Set-Cookie": buildSessionCookie(token, expiresAt) }
    );
  } catch (err) {
    return serverError(err, "auth-login");
  }
};
