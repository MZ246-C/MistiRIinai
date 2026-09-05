// Centralized, validated access to server-only environment variables.
// Nothing in this file is ever imported by frontend (src/) code.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  get supabaseUrl() {
    return required("SUPABASE_URL");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get storageBucket() {
    return optional("SUPABASE_STORAGE_BUCKET", "memories");
  },
  get initialAdminPassword() {
    return process.env.INITIAL_ADMIN_PASSWORD ?? "";
  },
  get sessionSecret() {
    return required("SESSION_SECRET");
  },
  get secureCookies() {
    return optional("SECURE_COOKIES", "true") === "true";
  },
  get sessionTtlHours() {
    return Number(optional("SESSION_TTL_HOURS", "12"));
  },
  get loginRateLimitMax() {
    return Number(optional("LOGIN_RATE_LIMIT_MAX", "8"));
  },
  get loginRateLimitWindowMinutes() {
    return Number(optional("LOGIN_RATE_LIMIT_WINDOW_MINUTES", "15"));
  },
  get maxUploadMb() {
    return {
      photo: Number(optional("MAX_UPLOAD_MB_IMAGE", "25")),
      video: Number(optional("MAX_UPLOAD_MB_VIDEO", "500")),
      audio: Number(optional("MAX_UPLOAD_MB_AUDIO", "100")),
      document: Number(optional("MAX_UPLOAD_MB_DOCUMENT", "25")),
      other: Number(optional("MAX_UPLOAD_MB_DOCUMENT", "25")),
    };
  },
  get signedUrlTtlSeconds() {
    return Number(optional("SIGNED_URL_TTL_SECONDS", "300"));
  },
};
