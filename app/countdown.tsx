"use client";

import parser from "cron-parser";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(duration);
dayjs.extend(relativeTime);

export function Countdown({ cronExpression }: { cronExpression: string }) {
  const [time, setTime] = useState(() =>
    getTimeUntilNextInvocation(cronExpression)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeUntilNextInvocation(cronExpression));
    }, 1000);
    return () => clearInterval(interval);
  }, [cronExpression]);

  return <span>{time}</span>;
}

function getTimeUntilNextInvocation(cronExpression: string) {
  try {
    const interval = parser.parseExpression(cronExpression);
    const nextInvocation = interval.next().toDate();

    const now = dayjs();
    const difference = dayjs(nextInvocation).diff(now);
    const duration = dayjs.duration(difference);

    if (duration.asMinutes() < 1) {
      return (
        "00:00:" + Math.round(duration.seconds()).toString().padStart(2, "0")
      );
    }
    return duration.humanize(true);
  } catch (err) {
    console.error("Error parsing cron expression:", err);
    return null;
  }
}
