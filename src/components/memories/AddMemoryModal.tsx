import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { FileUploader, StagedFile } from "./FileUploader";
import { api } from "@/lib/api";
import { uploadFileDirect } from "@/lib/supabaseClient";
import { useToast } from "@/context/ToastContext";
import { Image as ImageIcon, Type, Star } from "lucide-react";
import clsx from "clsx";

type Mode = "files" | "text";

export function AddMemoryModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { show } = useToast();
  const [mode, setMode] = useState<Mode>("files");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateTaken, setDateTaken] = useState("");
  const [tags, setTags] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setMode("files");
    setTitle("");
    setDescription("");
    setLocation("");
    setDateTaken("");
    setTags("");
    setIsFavorite(false);
    setTextContent("");
    setStaged([]);
  }

  function close() {
    reset();
    onClose();
  }

  function addFiles(files: File[]) {
    const next: StagedFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: "pending",
    }));
    setStaged((prev) => [...prev, ...next]);
    if (!title && files[0]) setTitle(files[0].name.replace(/\.[^.]+$/, ""));
  }

  async function uploadOne(sf: StagedFile): Promise<boolean> {
    setStaged((prev) => prev.map((f) => (f.id === sf.id ? { ...f, status: "uploading" } : f)));
    try {
      const createRes = await api.post<{
        storagePath: string;
        signedUrl: string;
        token: string;
        memoryType: string;
      }>("/uploads-create", {
        filename: sf.file.name,
        mimeType: sf.file.type,
        fileSizeBytes: sf.file.size,
      });

      await uploadFileDirect(createRes.storagePath, createRes.token, sf.file, (percent) => {
        setStaged((prev) => prev.map((f) => (f.id === sf.id ? { ...f, progress: percent } : f)));
      });

      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await api.post("/uploads-complete", {
        storagePath: createRes.storagePath,
        memoryType: createRes.memoryType,
        title: title || sf.file.name,
        description: description || undefined,
        originalFilename: sf.file.name,
        mimeType: sf.file.type,
        fileSizeBytes: sf.file.size,
        dateTaken: dateTaken || undefined,
        location: location || undefined,
        isFavorite,
        tags: tagList,
      });

      setStaged((prev) => prev.map((f) => (f.id === sf.id ? { ...f, status: "done", progress: 100 } : f)));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setStaged((prev) =>
        prev.map((f) => (f.id === sf.id ? { ...f, status: "error", errorMessage: message } : f))
      );
      return false;
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      if (mode === "text") {
        if (!title.trim() || !textContent.trim()) {
          show("Give your memory a title and a little text.", "error");
          setSubmitting(false);
          return;
        }
        const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
        await api.post("/memories-create", {
          title,
          description: description || undefined,
          type: "text",
          textContent,
          dateTaken: dateTaken || undefined,
          location: location || undefined,
          isFavorite,
          tags: tagList,
        });
        show("Memory saved.", "success");
        onCreated();
        close();
        return;
      }

      if (staged.length === 0) {
        show("Add at least one file first.", "error");
        setSubmitting(false);
        return;
      }

      const results = await Promise.all(
        staged.filter((f) => f.status !== "done").map((f) => uploadOne(f))
      );

      if (results.every(Boolean)) {
        show(
          results.length === 1 ? "Memory uploaded successfully." : "Memories uploaded successfully.",
          "success"
        );
        onCreated();
        close();
      } else {
        show("Some files couldn't be uploaded — you can retry them.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={close} title="Add a memory" size="lg">
      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setMode("files")}
          className={clsx(
            "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium transition-colors",
            mode === "files"
              ? "bg-booth-plum-600 text-white dark:bg-booth-gold-500 dark:text-booth-night"
              : "bg-booth-plum-50 text-booth-plum-600 dark:bg-white/5 dark:text-booth-paper/70"
          )}
        >
          <ImageIcon size={15} /> Photo / video / audio / file
        </button>
        <button
          onClick={() => setMode("text")}
          className={clsx(
            "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium transition-colors",
            mode === "text"
              ? "bg-booth-plum-600 text-white dark:bg-booth-gold-500 dark:text-booth-night"
              : "bg-booth-plum-50 text-booth-plum-600 dark:bg-white/5 dark:text-booth-paper/70"
          )}
        >
          <Type size={15} /> Text memory
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {mode === "files" ? (
          <FileUploader
            files={staged}
            onFilesAdded={addFiles}
            onRemove={(id) => setStaged((prev) => prev.filter((f) => f.id !== id))}
            onRetry={(id) => {
              const sf = staged.find((f) => f.id === id);
              if (sf) uploadOne(sf);
            }}
          />
        ) : (
          <Textarea
            label="Your memory"
            placeholder="Write what happened, how it felt, anything you want to remember..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="min-h-[140px]"
          />
        )}

        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A little note for this one" />
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Date"
            type="date"
            value={dateTaken}
            onChange={(e) => setDateTaken(e.target.value)}
          />
          <Input
            label="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where did this happen?"
          />
        </div>

        <Input
          label="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="us, travel, birthday"
        />

        <button
          onClick={() => setIsFavorite((v) => !v)}
          className="flex w-fit items-center gap-2 rounded-xl bg-white/60 px-3.5 py-2 text-sm font-medium text-booth-ink dark:bg-white/5 dark:text-booth-paper"
        >
          <Star size={16} className={isFavorite ? "fill-booth-gold-400 text-booth-gold-500" : "text-booth-ink/40 dark:text-booth-paper/40"} />
          Mark as favorite
        </button>

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            Save memory
          </Button>
        </div>
      </div>
    </Modal>
  );
}
