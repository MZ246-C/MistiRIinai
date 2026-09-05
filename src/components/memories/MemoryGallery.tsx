import { LayoutGrid, Rows3, GalleryVertical } from "lucide-react";
import clsx from "clsx";
import { MemorySummary } from "@/lib/types";
import { MemoryCard } from "./MemoryCard";
import { EmptyState, LoadingState } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { ImagePlus } from "lucide-react";

type Layout = "masonry" | "grid" | "list";

export function MemoryGallery({
  memories,
  loading,
  layout,
  onLayoutChange,
  onOpen,
  onAddMemory,
}: {
  memories: MemorySummary[];
  loading: boolean;
  layout: Layout;
  onLayoutChange: (l: Layout) => void;
  onOpen: (id: string) => void;
  onAddMemory: () => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-1">
        {(
          [
            { key: "masonry", icon: GalleryVertical },
            { key: "grid", icon: LayoutGrid },
            { key: "list", icon: Rows3 },
          ] as const
        ).map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onLayoutChange(key)}
            aria-label={`${key} view`}
            className={clsx(
              "rounded-lg p-2 transition-colors",
              layout === key
                ? "bg-booth-plum-600 text-white dark:bg-booth-gold-500 dark:text-booth-night"
                : "text-booth-ink/50 hover:bg-booth-plum-50 dark:text-booth-paper/50 dark:hover:bg-white/5"
            )}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : memories.length === 0 ? (
        <EmptyState
          icon={<ImagePlus size={32} />}
          title="No memories yet."
          description="Every collection starts with one little moment."
          action={<Button onClick={onAddMemory}>Add your first memory</Button>}
        />
      ) : layout === "list" ? (
        <div className="flex flex-col gap-2">
          {memories.map((m) => (
            <MemoryCard key={m.id} memory={m} layout="list" onOpen={() => onOpen(m.id)} />
          ))}
        </div>
      ) : layout === "masonry" ? (
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
          {memories.map((m) => (
            <MemoryCard key={m.id} memory={m} layout="masonry" onOpen={() => onOpen(m.id)} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {memories.map((m) => (
            <MemoryCard key={m.id} memory={m} layout="grid" onOpen={() => onOpen(m.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
