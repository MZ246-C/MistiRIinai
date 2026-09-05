import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { useMemories } from "@/hooks/useMemories";
import { MemoryGallery } from "@/components/memories/MemoryGallery";
import { MemoryType } from "@/lib/types";
import { Select, Input } from "@/components/ui/Input";
import { Star, Search } from "lucide-react";

const TYPE_FILTERS: { key: MemoryType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "photo", label: "Photos" },
  { key: "video", label: "Videos" },
  { key: "audio", label: "Audio" },
  { key: "document", label: "Documents" },
  { key: "text", label: "Text" },
];

export function MemoriesPage({
  onOpenMemory,
  onAddMemory,
  favoritesOnly = false,
}: {
  onOpenMemory: (id: string) => void;
  onAddMemory: () => void;
  favoritesOnly?: boolean;
}) {
  const [type, setType] = useState<MemoryType | "all">("all");
  const [favoriteFilter, setFavoriteFilter] = useState(favoritesOnly);
  const [sort, setSort] = useState<"newest" | "oldest" | "recently_updated" | "alphabetical">("newest");
  const [layout, setLayout] = useState<"masonry" | "grid" | "list">("masonry");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const { memories, loading } = useMemories({ type, favorite: favoriteFilter, sort, q: debouncedSearch });

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pb-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-booth-ink dark:text-booth-paper">
          {favoritesOnly ? "Favorites" : "Memories"}
        </h1>
        <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="w-auto">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="recently_updated">Recently updated</option>
          <option value="alphabetical">Alphabetical</option>
        </Select>
      </div>

      <div className="mb-4 max-w-sm">
        <Input
          icon={<Search size={15} />}
          placeholder="Search this collection..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setType(f.key)}
            className={clsx(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              type === f.key
                ? "bg-booth-plum-600 text-white dark:bg-booth-gold-500 dark:text-booth-night"
                : "bg-white/50 text-booth-ink/70 hover:bg-white dark:bg-white/5 dark:text-booth-paper/70 dark:hover:bg-white/10"
            )}
          >
            {f.label}
          </button>
        ))}
        {!favoritesOnly && (
          <button
            onClick={() => setFavoriteFilter((v) => !v)}
            className={clsx(
              "flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              favoriteFilter
                ? "bg-booth-gold-500 text-booth-night"
                : "bg-white/50 text-booth-ink/70 hover:bg-white dark:bg-white/5 dark:text-booth-paper/70 dark:hover:bg-white/10"
            )}
          >
            <Star size={13} className={favoriteFilter ? "fill-booth-night" : ""} /> Favorites
          </button>
        )}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <MemoryGallery
          memories={memories}
          loading={loading}
          layout={layout}
          onLayoutChange={setLayout}
          onOpen={onOpenMemory}
          onAddMemory={onAddMemory}
        />
      </motion.div>
    </div>
  );
}
