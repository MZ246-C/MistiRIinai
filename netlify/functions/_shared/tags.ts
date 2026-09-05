import { supabaseAdmin } from "./supabaseAdmin";

/** Normalizes, upserts, and links tag names to a memory. Replaces any
 * previous tag links for that memory (simplest correct behavior for edits). */
export async function syncMemoryTags(
  memoryId: string,
  tagNames: string[]
): Promise<void> {
  const db = supabaseAdmin();
  const cleaned = Array.from(
    new Set(
      tagNames
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0 && t.length <= 40)
    )
  ).slice(0, 20);

  await db.from("memory_tags").delete().eq("memory_id", memoryId);

  if (cleaned.length === 0) return;

  const tagIds: string[] = [];
  for (const name of cleaned) {
    const { data: existing } = await db
      .from("tags")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    if (existing) {
      tagIds.push(existing.id);
    } else {
      const { data: created, error } = await db
        .from("tags")
        .insert({ name })
        .select("id")
        .single();
      if (error) throw error;
      tagIds.push(created.id);
    }
  }

  const rows = tagIds.map((tagId) => ({ memory_id: memoryId, tag_id: tagId }));
  const { error: linkError } = await db.from("memory_tags").insert(rows);
  if (linkError) throw linkError;
}

export async function getTagsForMemory(memoryId: string): Promise<string[]> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("memory_tags")
    .select("tags(name)")
    .eq("memory_id", memoryId);

  return (data ?? [])
    .map((row: any) => row.tags?.name)
    .filter((name: unknown): name is string => typeof name === "string");
}
