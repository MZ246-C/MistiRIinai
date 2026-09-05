import { describe, it, expect, beforeEach } from "vitest";

// The functions under test read env vars lazily via netlify/functions/_shared/env.ts,
// so we set reasonable defaults before importing.
process.env.MAX_UPLOAD_MB_IMAGE = "25";
process.env.MAX_UPLOAD_MB_VIDEO = "500";
process.env.MAX_UPLOAD_MB_AUDIO = "100";
process.env.MAX_UPLOAD_MB_DOCUMENT = "25";

import { validateFile, generateStorageKey, sanitizeFilename } from "../netlify/functions/_shared/fileValidation";

describe("validateFile", () => {
  it("accepts a normal jpeg within size limits", () => {
    const result = validateFile("beach-day.jpg", "image/jpeg", 2 * 1024 * 1024);
    expect(result.ok).toBe(true);
    expect(result.memoryType).toBe("photo");
  });

  it("rejects disallowed file types like .exe", () => {
    const result = validateFile("virus.exe", "application/x-msdownload", 1000);
    expect(result.ok).toBe(false);
  });

  it("rejects HTML disguised as an image extension", () => {
    const result = validateFile("photo.jpg", "text/html", 1000);
    expect(result.ok).toBe(false);
  });

  it("rejects files over the configured size limit", () => {
    const result = validateFile("home-movie.mp4", "video/mp4", 600 * 1024 * 1024);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/too large/i);
  });

  it("accepts a PDF document within limits", () => {
    const result = validateFile("letter.pdf", "application/pdf", 1024 * 1024);
    expect(result.ok).toBe(true);
    expect(result.memoryType).toBe("document");
  });
});

describe("generateStorageKey", () => {
  it("never reuses the original filename as the storage path", () => {
    const key = generateStorageKey("my private diary.pdf");
    expect(key).not.toContain("my private diary");
    expect(key.endsWith(".pdf")).toBe(true);
  });
});

describe("sanitizeFilename", () => {
  it("strips path separators and special characters", () => {
    expect(sanitizeFilename("../../etc/passwd")).not.toContain("/");
  });
});
