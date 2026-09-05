import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/Feedback";
import { api } from "@/lib/api";
import { MemoryDetail } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import { Star, Pencil, Trash2, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";

export function MemoryDetailModal({
  memoryId,
  onClose,
  onChanged,
}: {
  memoryId: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { show } = useToast();
  const [memory, setMemory] = useState<MemoryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    dateTaken: "",
    tags: "",
    textContent: "",
  });

  useEffect(() => {
    if (!memoryId) {
      setMemory(null);
      return;
    }
    setLoading(true);
    setEditing(false);
    api
      .get<{ memory: MemoryDetail }>(`/memories-get?id=${memoryId}`)
      .then((res) => {
        setMemory(res.memory);
        setForm({
          title: res.memory.title,
          description: res.memory.description ?? "",
          location: res.memory.location ?? "",
          dateTaken: res.memory.date_taken ?? "",
          tags: res.memory.tags.join(", "),
          textContent: res.memory.text_content ?? "",
        });
      })
      .catch(() => show("Couldn't open that memory.", "error"))
      .finally(() => setLoading(false));
  }, [memoryId]);

  async function toggleFavorite() {
    if (!memory) return;
    const next = !memory.is_favorite;
    setMemory({ ...memory, is_favorite: next });
    try {
      await api.patch(`/memories-update?id=${memory.id}`, { isFavorite: next });
      onChanged();
    } catch {
      setMemory((m) => (m ? { ...m, is_favorite: !next } : m));
      show("Couldn't update favorite status.", "error");
    }
  }

  async function saveEdits() {
    if (!memory) return;
    setSaving(true);
    try {
      const tagList = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
      await api.patch(`/memories-update?id=${memory.id}`, {
        title: form.title,
        description: form.description,
        location: form.location,
        dateTaken: form.dateTaken || undefined,
        tags: tagList,
        ...(memory.type === "text" ? { textContent: form.textContent } : {}),
      });
      show("Memory updated.", "success");
      setEditing(false);
      onChanged();
      const res = await api.get<{ memory: MemoryDetail }>(`/memories-get?id=${memory.id}`);
      setMemory(res.memory);
    } catch {
      show("Couldn't save your changes.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!memory) return;
    setDeleting(true);
    try {
      await api.delete(`/memories-delete?id=${memory.id}`);
      show("Memory deleted.", "success");
      onChanged();
      onClose();
    } catch {
      show("Couldn't delete that memory.", "error");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <Modal open={!!memoryId} onClose={onClose} size="lg">
        {loading || !memory ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-booth-ink/40" size={24} />
          </div>
        ) : editing ? (
          <div className="flex flex-col gap-4">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            {memory.type === "text" && (
              <Textarea
                label="Memory text"
                className="min-h-[160px]"
                value={form.textContent}
                onChange={(e) => setForm({ ...form, textContent: e.target.value })}
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Date" type="date" value={form.dateTaken} onChange={(e) => setForm({ ...form, dateTaken: e.target.value })} />
              <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveEdits} loading={saving}>
                Save changes
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              {memory.type === "photo" && memory.signedUrl && (
                <img src={memory.signedUrl} alt={memory.title} className="max-h-[60vh] w-full rounded-2xl object-contain" />
              )}
              {memory.type === "video" && memory.signedUrl && (
                <video src={memory.signedUrl} controls className="max-h-[60vh] w-full rounded-2xl bg-black" />
              )}
              {memory.type === "audio" && memory.signedUrl && (
                <div className="rounded-2xl bg-booth-plum-50 p-8 dark:bg-white/5">
                  <audio src={memory.signedUrl} controls className="w-full" />
                </div>
              )}
              {memory.type === "document" && memory.signedUrl && memory.mime_type === "application/pdf" && (
                <iframe src={memory.signedUrl} title={memory.title} className="h-[60vh] w-full rounded-2xl border border-booth-plum-100 dark:border-white/10" />
              )}
              {memory.type === "document" && memory.signedUrl && memory.mime_type !== "application/pdf" && (
                <a
                  href={memory.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-booth-plum-50 p-10 text-sm font-medium text-booth-plum-600 dark:bg-white/5 dark:text-booth-paper"
                >
                  <Download size={16} /> Open document
                </a>
              )}
              {memory.type === "text" && (
                <div className="whitespace-pre-wrap rounded-2xl bg-booth-plum-50 p-6 font-display text-lg leading-relaxed text-booth-ink dark:bg-white/5 dark:text-booth-paper">
                  {memory.text_content}
                </div>
              )}
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-xl text-booth-ink dark:text-booth-paper">{memory.title}</h3>
                <p className="mt-1 text-sm text-booth-ink/50 dark:text-booth-paper/50">
                  {memory.date_taken ? format(new Date(memory.date_taken), "MMMM d, yyyy") : format(new Date(memory.created_at), "MMMM d, yyyy")}
                  {memory.location ? ` · ${memory.location}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={toggleFavorite}
                  aria-label="Toggle favorite"
                  className="rounded-full p-2 hover:bg-booth-plum-50 dark:hover:bg-white/10"
                >
                  <Star size={18} className={memory.is_favorite ? "fill-booth-gold-400 text-booth-gold-500" : "text-booth-ink/40 dark:text-booth-paper/40"} />
                </button>
                <button onClick={() => setEditing(true)} aria-label="Edit" className="rounded-full p-2 hover:bg-booth-plum-50 dark:hover:bg-white/10">
                  <Pencil size={18} className="text-booth-ink/50 dark:text-booth-paper/50" />
                </button>
                <button onClick={() => setConfirmDelete(true)} aria-label="Delete" className="rounded-full p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                  <Trash2 size={18} className="text-rose-500" />
                </button>
              </div>
            </div>

            {memory.description && (
              <p className="mt-3 text-sm text-booth-ink/70 dark:text-booth-paper/70">{memory.description}</p>
            )}

            {memory.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {memory.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-booth-plum-50 px-2.5 py-1 text-xs text-booth-plum-600 dark:bg-white/10 dark:text-booth-paper/80">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this memory?"
        description="This will permanently remove the memory and its associated file."
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
