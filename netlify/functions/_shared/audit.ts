import { supabaseAdmin } from "./supabaseAdmin";

export type AuditAction =
  | "login"
  | "login_failed"
  | "logout"
  | "upload"
  | "create_memory"
  | "edit_memory"
  | "delete_memory"
  | "create_calendar_event"
  | "edit_calendar_event"
  | "delete_calendar_event";

export async function logAudit(
  action: AuditAction,
  opts: { target?: string; ip?: string; metadata?: Record<string, unknown> } = {}
): Promise<void> {
  try {
    await supabaseAdmin().from("audit_logs").insert({
      actor: "owner",
      action,
      target: opts.target ?? null,
      ip: opts.ip ?? null,
      metadata: opts.metadata ?? {},
    });
  } catch (err) {
    // Audit logging must never break the primary request.
    // eslint-disable-next-line no-console
    console.error("[audit] failed to write audit log", err);
  }
}
