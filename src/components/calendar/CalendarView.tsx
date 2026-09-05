import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { CalendarEvent } from "@/lib/types";
import { Button } from "@/components/ui/Button";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({
  month,
  onMonthChange,
  events,
  onDayClick,
  onEventClick,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const [direction, setDirection] = useState(0);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const key = format(new Date(ev.start_datetime), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), ev]);
    }
    return map;
  }, [events]);

  function go(delta: number) {
    setDirection(delta);
    onMonthChange(delta > 0 ? addMonths(month, 1) : subMonths(month, 1));
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl text-booth-ink dark:text-booth-paper">{format(month, "MMMM yyyy")}</h2>
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" onClick={() => onMonthChange(new Date())}>
            Today
          </Button>
          <button onClick={() => go(-1)} aria-label="Previous month" className="rounded-lg p-2 hover:bg-booth-plum-50 dark:hover:bg-white/5">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => go(1)} aria-label="Next month" className="rounded-lg p-2 hover:bg-booth-plum-50 dark:hover:bg-white/5">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-booth-ink/40 dark:text-booth-paper/40">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={format(month, "yyyy-MM")}
          custom={direction}
          initial={{ opacity: 0, x: direction >= 0 ? 24 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction >= 0 ? -24 : 24 }}
          transition={{ duration: 0.22 }}
          className="grid grid-cols-7 gap-1.5"
        >
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, month);
            return (
              <button
                key={key}
                onClick={() => onDayClick(day)}
                className={clsx(
                  "flex min-h-[76px] flex-col items-start rounded-xl p-1.5 text-left transition-colors sm:min-h-[92px] sm:p-2",
                  inMonth ? "bg-white/50 dark:bg-white/5" : "bg-transparent opacity-40",
                  isToday(day) && "ring-1 ring-booth-gold-500"
                )}
              >
                <span
                  className={clsx(
                    "mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
                    isToday(day)
                      ? "bg-booth-gold-500 text-booth-night"
                      : "text-booth-ink/60 dark:text-booth-paper/60"
                  )}
                >
                  {format(day, "d")}
                </span>
                <div className="flex w-full flex-col gap-0.5">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <span
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(ev);
                      }}
                      className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: ev.color ?? "#B8903F" }}
                    >
                      {ev.title}
                    </span>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[10px] text-booth-ink/40 dark:text-booth-paper/40">
                      +{dayEvents.length - 2} more
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
