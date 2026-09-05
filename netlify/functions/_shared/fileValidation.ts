import crypto from "crypto";
import { env } from "./env";

export type MemoryType = "photo" | "video" | "audio" | "document" | "text" | "other";

// Allowlist only. Anything not in this list is rejected outright —
// this blocks executables, HTML/JS (XSS vectors), and anything else
// not explicitly a memory-worthy media type.
const ALLOWED_MIME_TO_TYPE: Record<string, MemoryType> = {
  "image/jpeg": "photo",
  "image/png": "photo",
  "image/webp": "photo",
  "image/gif": "photo",
  "image/heic": "photo",
  "image/heif": "photo",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "audio/mpeg": "audio",
  "audio/wav": "audio",
  "audio/x-wav": "audio",
  "audio/mp4": "audio",
  "audio/ogg": "audio",
  "application/pdf": "document",
  "text/plain": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "document",
};

const ALLOWED_EXTENSIONS: Record<string, MemoryType> = {
  jpg: "photo",
  jpeg: "photo",
  png: "photo",
  webp: "photo",
  gif: "photo",
  heic: "photo",
  heif: "photo",
  mp4: "video",
  webm: "video",
  mov: "video",
  mp3: "audio",
  wav: "audio",
  m4a: "audio",
  ogg: "audio",
  pdf: "document",
  txt: "document",
  doc: "document",
  docx: "document",
};

export interface FileValidationResult {
  ok: boolean;
  reason?: string;
  memoryType?: MemoryType;
}

export function validateFile(
  originalFilename: string,
  mimeType: string,
  fileSizeBytes: number
): FileValidationResult {
  const ext = (originalFilename.split(".").pop() || "").toLowerCase();

  const typeFromMime = ALLOWED_MIME_TO_TYPE[mimeType.toLowerCase()];
  const typeFromExt = ALLOWED_EXTENSIONS[ext];

  if (!typeFromMime || !typeFromExt) {
    return {
      ok: false,
      reason:
        "That file type isn't supported. Please upload a photo, video, audio clip, PDF, or plain text/Word document.",
    };
  }

  // MIME and extension must agree on the *category*, so a ".jpg" that is
  // actually an HTML file (mismatched MIME) gets rejected.
  if (typeFromMime !== typeFromExt) {
    return {
      ok: false,
      reason: "That file's contents don't match its file extension.",
    };
  }

  const limitsMb = env.maxUploadMb;
  const limitMb = limitsMb[typeFromMime as keyof typeof limitsMb] ?? limitsMb.document;
  const maxBytes = limitMb * 1024 * 1024;

  if (fileSizeBytes > maxBytes) {
    return {
      ok: false,
      reason: `That file is too large. The limit for this type is ${limitMb}MB.`,
    };
  }

  return { ok: true, memoryType: typeFromMime };
}

/**
 * Produces a safe, unique storage key. We never trust the user-supplied
 * filename for the actual storage path — only a sanitized copy is kept
 * as `original_filename` metadata for display purposes.
 */
export function generateStorageKey(originalFilename: string): string {
  const ext = (originalFilename.split(".").pop() || "bin")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  const random = crypto.randomBytes(16).toString("hex");
  const datePrefix = new Date().toISOString().slice(0, 10);
  return `${datePrefix}/${random}${ext ? "." + ext : ""}`;
}

export function sanitizeFilename(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-\s]/g, "")
    .trim()
    .slice(0, 180) || "memory-file";
}
