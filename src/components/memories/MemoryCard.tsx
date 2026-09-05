import { motion } from "framer-motion";
import { Star, Video, Music, FileText, Type as TypeIcon, File as FileIcon } from "lucide-react";
import { format } from "date-fns";
import { MemorySummary } from "@/lib/types";
import clsx from "clsx";

const ICONS: Record<string, React.ElementType> = {
  video: Video,
  audio: Music,
  document: FileText,
  text: TypeIcon,
  other: FileIcon,
};

export function MemoryCard({
  memory,
  onOpen,
  layout = "grid",
}: {
  memory: MemorySummary;
  onOpen: () => void;
  layout?: "grid" | "masonry" | "list";
}) {
  const Icon = ICONS[memory.type];

  if (layout === "list") {
    return (
      <motion.button
        layout
        onClick={onOpen}
        whileHover={{ x: 2 }}
        className="flex w-full items-center gap-3 rounded-2xl bg-white/60 p-3 text-left shadow-soft transition-colors hover:bg-white/90 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-booth-plum-50 dark:bg-white/10">
          {memory.type === "photo" && memory.thumbUrl ? (
            <img src={memory.thumbUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            Icon && <Icon size={18} className="text-booth-plum-500 dark:text-booth-paper/70" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-booth-ink dark:text-booth-paper">{memory.title}</p>
          <p className="text-xs text-booth-ink/50 dark:text-booth-paper/50">
            {memory.date_taken ? format(new Date(memory.date_taken), "MMM d, yyyy") : format(new Date(memory.created_at), "MMM d, yyyy")}
            {memory.location ? ` · ${memory.location}` : ""}
          </p>
        </div>
        {memory.is_favorite && <Star size={16} className="shrink-0 fill-booth-gold-400 text-booth-gold-500" />}
      </motion.button>
    );
  }

  return (
    <motion.button
      layout
      onClick={onOpen}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className={clsx(
        "group relative w-full overflow-hidden rounded-2xl bg-white/60 text-left shadow-soft dark:bg-white/5",
        layout === "masonry" ? "mb-4 break-inside-avoid" : ""
      )}
    >
      <div
        className={clsx(
          "relative flex items-center justify-center overflow-hidden bg-booth-plum-50 dark:bg-white/10",
          layout === "masonry" ? "" : "aspect-square"
        )}
      >
        {memory.type === "photo" && memory.thumbUrl ? (
          <img
            src={memory.thumbUrl}
            alt={memory.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full min-h-[120px] w-full flex-col items-center justify-center gap-2 py-8 text-booth-plum-400 dark:text-booth-paper/40">
            {Icon && <Icon size={28} />}
          </div>
        )}
        {memory.is_favorite && (
          <span className="absolute right-2 top-2 rounded-full bg-black/30 p-1.5 backdrop-blur-sm">
            <Star size={13} className="fill-booth-gold-400 text-booth-gold-400" />
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="truncate text-sm font-medium text-booth-ink dark:text-booth-paper">{memory.title}</p>
        <p className="text-[11px] text-booth-ink/50 dark:text-booth-paper/50">
          {memory.date_taken ? format(new Date(memory.date_taken), "MMM d, yyyy") : format(new Date(memory.created_at), "MMM d, yyyy")}
        </p>
      </div>
    </motion.button>
  );
}
