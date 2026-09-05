import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, Music, Video, FileIcon, X, RotateCcw, Check } from "lucide-react";
import clsx from "clsx";

export interface StagedFile {
  id: string;
  file: File;
  previewUrl?: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  errorMessage?: string;
}

function iconFor(file: File) {
  if (file.type.startsWith("video/")) return Video;
  if (file.type.startsWith("audio/")) return Music;
  if (file.type === "application/pdf" || file.type.startsWith("text/")) return FileText;
  return FileIcon;
}

export function FileUploader({
  files,
  onFilesAdded,
  onRemove,
  onRetry,
  multiple = true,
}: {
  files: StagedFile[];
  onFilesAdded: (files: File[]) => void;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  multiple?: boolean;
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      onFilesAdded(Array.from(fileList));
    },
    [onFilesAdded]
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragActive
            ? "border-booth-gold-500 bg-booth-gold-300/10"
            : "border-booth-plum-200 bg-white/40 hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
        )}
      >
        <motion.div animate={dragActive ? { y: -4 } : { y: 0 }}>
          <UploadCloud size={28} className="mx-auto mb-2 text-booth-gold-500" />
        </motion.div>
        <p className="text-sm font-medium text-booth-ink dark:text-booth-paper">
          {dragActive ? "Drop your memories here." : "Drag files here, or tap to choose"}
        </p>
        <p className="mt-1 text-xs text-booth-ink/50 dark:text-booth-paper/50">
          Photos, videos, audio, PDFs, or docs
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex flex-col gap-2"
          >
            {files.map((sf) => {
              const Icon = iconFor(sf.file);
              return (
                <motion.li
                  key={sf.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex items-center gap-3 rounded-xl bg-white/60 p-2.5 dark:bg-white/5"
                >
                  {sf.previewUrl ? (
                    <img src={sf.previewUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-booth-plum-50 dark:bg-white/10">
                      <Icon size={18} className="text-booth-plum-500 dark:text-booth-paper/70" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-booth-ink dark:text-booth-paper">
                      {sf.file.name}
                    </p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-booth-plum-50 dark:bg-white/10">
                      <motion.div
                        className={clsx(
                          "h-full rounded-full",
                          sf.status === "error" ? "bg-rose-400" : "bg-booth-gold-500"
                        )}
                        animate={{ width: `${sf.progress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    {sf.status === "error" && (
                      <p className="mt-1 text-[11px] text-rose-500">{sf.errorMessage}</p>
                    )}
                  </div>
                  {sf.status === "done" && <Check size={16} className="shrink-0 text-emerald-500" />}
                  {sf.status === "error" && onRetry && (
                    <button
                      onClick={() => onRetry(sf.id)}
                      aria-label="Retry upload"
                      className="shrink-0 rounded-full p-1.5 text-booth-ink/50 hover:bg-booth-plum-50 dark:text-booth-paper/50 dark:hover:bg-white/10"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  {sf.status !== "uploading" && (
                    <button
                      onClick={() => onRemove(sf.id)}
                      aria-label="Remove file"
                      className="shrink-0 rounded-full p-1.5 text-booth-ink/50 hover:bg-rose-50 hover:text-rose-500 dark:text-booth-paper/50 dark:hover:bg-rose-500/10"
                    >
                      <X size={14} />
                    </button>
                  )}
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
