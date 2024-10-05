"use client";

import { useEffect, useState } from "react";

import { getTimeUntilNextInvocation } from "@/lib/utils";
import type { Duration } from "dayjs/plugin/duration";

export function Countdown({ cronExpression }: { cronExpression: string }) {
  const [time, setTime] = useState(() => {
    const duration = getTimeUntilNextInvocation(cronExpression);
    return duration ? formatDuration(duration) : null;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const duration = getTimeUntilNextInvocation(cronExpression);
      setTime(duration ? formatDuration(duration) : null);
    }, 1000);
    return () => clearInterval(interval);
  }, [cronExpression]);

  return <span suppressHydrationWarning>{time}</span>;
}

function formatDuration(duration: Duration) {
  if (duration.asMinutes() < 1) {
    return (
      "00:00:" + Math.round(duration.seconds()).toString().padStart(2, "0")
    );
  }
  return duration.humanize(true);
}
