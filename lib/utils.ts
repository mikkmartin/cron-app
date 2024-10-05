import { clsx, type ClassValue } from "clsx";
import parser from "cron-parser";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(duration);
dayjs.extend(relativeTime);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTimeUntilNextInvocation(cronExpression: string) {
  try {
    const interval = parser.parseExpression(cronExpression);
    const nextInvocation = interval.next().toDate();

    const now = dayjs();
    const difference = dayjs(nextInvocation).diff(now);
    return dayjs.duration(difference);
  } catch (err) {
    console.error("Error parsing cron expression:", err);
    return null;
  }
}

export const time = dayjs;
