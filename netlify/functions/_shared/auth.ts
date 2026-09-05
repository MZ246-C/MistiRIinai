import crypto from "crypto";
import * as cookie from "cookie";
import type { HandlerEvent } from "@netlify/functions";
import { env } from "./env";
import { supabaseAdmin } from "./supabaseAdmin";

export const SESSION_COOKIE_NAME = "mistirinai_session";

export interface SessionRecord {
  id: string;
  user_label: string;
  role: string;
  expires_at: string;
}

function hashToken(token: string): string {
  // We only ever store a hash of the session token, never the token itself,
  // the same principle as password storage — so a DB leak alone doesn't
  // hand out valid sessions.
  return crypto
    .createHmac("sha256", env.sessionSecret)
    .update(token)
    .digest("hex");
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export async function createSession(
  ip: string,
  userAgent: string | undefined
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + env.sessionTtlHours * 60 * 60 * 1000
  );

  const { error } = await supabaseAdmin().from("sessions").insert({
    token_hash: tokenHash,
    user_label: "owner",
    role: "editor",
    ip,
    user_agent: userAgent?.slice(0, 300),
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw error;

  return { token, expiresAt };
}

export async function revokeSessionByToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await supabaseAdmin()
    .from("sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", tokenHash);
}

function readSessionTokenFromEvent(event: HandlerEvent): string | null {
  const header = event.headers.cookie;
  if (!header) return null;
  const parsed = cookie.parse(header);
  return parsed[SESSION_COOKIE_NAME] ?? null;
}

/**
 * Verifies the request's session cookie against the server-side session
 * store. Every private endpoint must call this itself — there is no
 * shared "middleware" layer in Netlify Functions, so each function
 * imports and calls this directly as its very first step.
 */
export async function requireSession(
  event: HandlerEvent
): Promise<SessionRecord | null> {
  const token = readSessionTokenFromEvent(event);
  if (!token) return null;

  const tokenHash = hashToken(token);
  const { data, error } = await supabaseAdmin()
    .from("sessions")
    .select("id, user_label, role, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) return null;
  if (data.revoked_at) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  return {
    id: data.id,
    user_label: data.user_label,
    role: data.role,
    expires_at: data.expires_at,
  };
}

export function buildSessionCookie(token: string, expiresAt: Date): string {
  return cookie.serialize(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.secureCookies,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function buildLogoutCookie(): string {
  return cookie.serialize(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: env.secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionTokenFromEvent(event: HandlerEvent): string | null {
  return readSessionTokenFromEvent(event);
}
