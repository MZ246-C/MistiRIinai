import { format } from "date-fns";
import { motion } from "framer-motion";
import { CalendarHeart } from "lucide-react";
import { EmptyState } from "@/components/ui/Feedback";

interface UpcomingItem {
  id: string;
  title: string;
  category: string;
  start_datetime: string;
  color: string | null;
}

export function UpcomingEvents({ items, onOpen }: { items: UpcomingItem[]; onOpen?: (id: string) => void }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<CalendarHeart size={28} />}
        title="No important dates yet."
        description="Save a date you'll want to remember."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((ev, i) => (
        <motion.li
          key={ev.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04, duration: 0.25 }}
          onClick={() => onOpen?.(ev.id)}
          className="flex cursor-pointer items-center gap-3 rounded-xl bg-white/60 p-2.5 transition-colors hover:bg-white/90 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <div
            className="flex h-10 w-10 flex-col items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: ev.color ?? "#B8903F" }}
          >
            <span className="text-[10px] font-semibold uppercase leading-none">
              {format(new Date(ev.start_datetime), "MMM")}
            </span>
            <span className="text-sm font-bold leading-none">{format(new Date(ev.start_datetime), "d")}</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-booth-ink dark:text-booth-paper">{ev.title}</p>
            <p className="text-xs capitalize text-booth-ink/50 dark:text-booth-paper/50">
              {ev.category.replace(/_/g, " ")}
            </p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
