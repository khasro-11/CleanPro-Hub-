"use client";

import { useEffect, useState } from "react";
import { HOUR_HEIGHT, HOUR_RANGE } from "@/lib/calendar/date-helpers";

export function CurrentTimeIndicator() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours() + now.getMinutes() / 60;
  if (hour < HOUR_RANGE.start || hour > HOUR_RANGE.end) return null;

  const top = (hour - HOUR_RANGE.start) * HOUR_HEIGHT;

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
      style={{ top }}
    >
      <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 -translate-x-[3px]" />
      <div className="h-px flex-1 bg-red-500 opacity-80" />
    </div>
  );
}
