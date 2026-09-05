import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { MemorySummary, CalendarEvent } from "@/lib/types";
import { format } from "date-fns";

export function SearchModal({
  open,
  onClose,
  onOpenMemory,
}: {
  open: boolean;
  onClose: () => void;
  onOpenMemory: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState<Pick<MemorySummary, "id" | "title" | "type" | "date_taken" | "created_at">[]>([]);
  const [events, setEvents] = useState<Pick<CalendarEvent, "id" | "title" | "start_datetime" | "category">[]>([]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setMemories([]);
      setEvents([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setMemories([]);
      setEvents([]);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get<{ memories: typeof memories; events: typeof events }>(
          `/search?q=${encodeURIComponent(query)}`
        );
        setMemories(res.memories);
        setEvents(res.events);
      } catch {
        setMemories([]);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <Modal open={open} onClose={onClose} title="Search" size="md">
      <Input
        autoFocus
        icon={<SearchIcon size={16} />}
        placeholder="Search memories and dates..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-4 max-h-[50vh] overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-booth-ink/30" size={20} />
          </div>
        )}

        {!loading && query && memories.length === 0 && events.length === 0 && (
          <p className="py-6 text-center text-sm text-booth-ink/50 dark:text-booth-paper/50">
            Nothing found for "{query}".
          </p>
        )}

        {memories.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-booth-ink/40 dark:text-booth-paper/40">
              Memories
            </p>
            {memories.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  onOpenMemory(m.id);
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm hover:bg-booth-plum-50 dark:hover:bg-white/5"
              >
                <span className="truncate text-booth-ink dark:text-booth-paper">{m.title}</span>
                <span className="ml-2 shrink-0 text-xs text-booth-ink/40 dark:text-booth-paper/40">
                  {format(new Date(m.date_taken || m.created_at), "MMM d, yyyy")}
                </span>
              </button>
            ))}
          </div>
        )}

        {events.length > 0 && (
          <div>
            <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-booth-ink/40 dark:text-booth-paper/40">
              Important dates
            </p>
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm">
                <span className="truncate text-booth-ink dark:text-booth-paper">{ev.title}</span>
                <span className="ml-2 shrink-0 text-xs text-booth-ink/40 dark:text-booth-paper/40">
                  {format(new Date(ev.start_datetime), "MMM d, yyyy")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
