import { supabaseAdmin } from "./supabaseAdmin";
import { syncMemoryTags } from "./tags";
import { sanitizeFilename } from "./fileValidation";
import type { MemoryType } from "./fileValidation";

export interface CreateMemoryInput {
  title: string;
  description?: string;
  type: MemoryType;
  storagePath?: string | null;
  thumbnailPath?: string | null;
  originalFilename?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  textContent?: string | null;
  dateTaken?: string | null;
  location?: string | null;
  isFavorite?: boolean;
  people?: string[];
  tags?: string[];
}

export async function createMemoryRecord(input: CreateMemoryInput) {
  const db = supabaseAdmin();

  if (input.type === "text" && !input.textContent) {
    throw new Error("Text memories need some text content.");
  }
  if (input.type !== "text" && !input.storagePath) {
    throw new Error("A file-based memory needs a storage path.");
  }

  const { data, error } = await db
    .from("memories")
    .insert({
      title: input.title.trim().slice(0, 200),
      description: input.description?.slice(0, 4000) ?? null,
      type: input.type,
      storage_path: input.storagePath ?? null,
      thumbnail_path: input.thumbnailPath ?? null,
      original_filename: input.originalFilename
        ? sanitizeFilename(input.originalFilename)
        : null,
      mime_type: input.mimeType ?? null,
      file_size: input.fileSize ?? null,
      text_content: input.textContent ?? null,
      date_taken: input.dateTaken ?? null,
      location: input.location?.slice(0, 200) ?? null,
      is_favorite: input.isFavorite ?? false,
      people: input.people ?? [],
      created_by: "owner",
    })
    .select("*")
    .single();

  if (error) throw error;

  if (input.tags && input.tags.length) {
    await syncMemoryTags(data.id, input.tags);
  }

  return data;
}
