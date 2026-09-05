import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CalendarEvent } from "@/lib/types";

export function useCalendarEvents(range?: { from?: string; to?: string }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (range?.from) params.set("from", range.from);
      if (range?.to) params.set("to", range.to);
      const res = await api.get<{ events: CalendarEvent[] }>(
        `/calendar-list?${params.toString()}`
      );
      setEvents(res.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the calendar.");
    } finally {
      setLoading(false);
    }
  }, [range?.from, range?.to]);

  useEffect(() => {
    load();
  }, [load]);

  return { events, loading, error, reload: load };
}
