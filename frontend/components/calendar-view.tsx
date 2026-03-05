"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Views,
  type View,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { Meeting } from "@/types";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Meeting;
}

const statusColorMap: Record<string, { bg: string; border: string }> = {
  pending: { bg: "#f59e0b", border: "#d97706" },
  confirmed: { bg: "#22c55e", border: "#16a34a" },
  cancelled: { bg: "#ef4444", border: "#dc2626" },
};

interface CalendarViewProps {
  meetings: Meeting[];
  onRangeChange: (range: { start: Date; end: Date }) => void;
}

export function CalendarView({ meetings, onRangeChange }: CalendarViewProps) {
  const router = useRouter();

  const events: CalendarEvent[] = useMemo(
    () =>
      meetings.map((m) => ({
        id: m.id,
        title: `${m.title} — ${m.candidateName}`,
        start: new Date(m.startTime),
        end: new Date(m.endTime),
        resource: m,
      })),
    [meetings]
  );

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const colors = statusColorMap[event.resource.status] || statusColorMap.pending;
    return {
      style: {
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderWidth: "1px",
        borderStyle: "solid",
        color: "#fff",
        borderRadius: "4px",
        fontSize: "0.8rem",
      },
    };
  }, []);

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      router.push(`/meetings/${event.id}`);
    },
    [router]
  );

  const handleRangeChange = useCallback(
    (range: Date[] | { start: Date; end: Date }) => {
      if (Array.isArray(range)) {
        // Week/Day view returns array of dates
        onRangeChange({
          start: range[0],
          end: range[range.length - 1],
        });
      } else {
        onRangeChange(range);
      }
    },
    [onRangeChange]
  );

  return (
    <div className="rbc-wrapper h-[700px]">
      <BigCalendar<CalendarEvent>
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        defaultView={Views.MONTH}
        onSelectEvent={handleSelectEvent}
        onRangeChange={handleRangeChange}
        eventPropGetter={eventStyleGetter}
        popup
      />
    </div>
  );
}
