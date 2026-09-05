import { env } from "./env";
import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Database-backed rate limiting. We deliberately don't use an in-memory
 * counter: serverless functions are not guaranteed to reuse the same
 * process between invocations, so an in-memory counter would silently
 * reset and provide no real protection.
 */
export async function isRateLimited(ip: string): Promise<boolean> {
  const windowStart = new Date(
    Date.now() - env.loginRateLimitWindowMinutes * 60 * 1000
  ).toISOString();

  const { count, error } = await supabaseAdmin()
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("success", false)
    .gte("attempted_at", windowStart);

  if (error) {
    // Fail closed on the side of usability, but log loudly — a broken
    // rate limiter should not silently become "no rate limiting".
    // eslint-disable-next-line no-console
    console.error("[rateLimit] failed to read login_attempts", error);
    return false;
  }

  return (count ?? 0) >= env.loginRateLimitMax;
}

export async function recordLoginAttempt(
  ip: string,
  success: boolean
): Promise<void> {
  await supabaseAdmin().from("login_attempts").insert({ ip, success });
}
