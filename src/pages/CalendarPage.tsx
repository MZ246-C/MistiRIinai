import { useMemo, useState } from "react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { CalendarView } from "@/components/calendar/CalendarView";
import { UpcomingEvents } from "@/components/calendar/UpcomingEvents";
import { EventModal } from "@/components/calendar/EventModal";
import { CalendarEvent } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

export function CalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const range = useMemo(
    () => ({
      from: startOfMonth(month).toISOString(),
      to: endOfMonth(month).toISOString(),
    }),
    [month]
  );
  const { events, reload } = useCalendarEvents(range);

  const upcoming = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => new Date(e.start_datetime) >= now)
      .slice(0, 6)
      .map((e) => ({ id: e.id, title: e.title, category: e.category, start_datetime: e.start_datetime, color: e.color }));
  }, [events]);

  function openForDate(date: Date) {
    setSelectedEvent(null);
    setSelectedDate(format(date, "yyyy-MM-dd"));
    setModalOpen(true);
  }

  function openForEvent(event: CalendarEvent) {
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setModalOpen(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pb-10">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl text-booth-ink dark:text-booth-paper">Calendar</h1>
        <Button
          size="sm"
          onClick={() => {
            setSelectedEvent(null);
            setSelectedDate(format(new Date(), "yyyy-MM-dd"));
            setModalOpen(true);
          }}
        >
          <Plus size={15} /> Add date
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-3xl bg-white/40 p-4 dark:bg-white/5 lg:col-span-2 sm:p-5">
          <CalendarView
            month={month}
            onMonthChange={setMonth}
            events={events}
            onDayClick={openForDate}
            onEventClick={openForEvent}
          />
        </div>
        <div>
          <h2 className="mb-3 font-display text-lg text-booth-ink dark:text-booth-paper">Upcoming</h2>
          <UpcomingEvents items={upcoming} onOpen={(id) => openForEvent(events.find((e) => e.id === id)!)} />
        </div>
      </div>

      <EventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultDate={selectedDate}
        existing={selectedEvent}
        onSaved={reload}
      />
    </div>
  );
}
