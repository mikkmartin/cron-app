import { db } from "@/lib/db";
import { scheduleJob } from "./lib/cronjobs";

export async function register() {
  const jobs = await db.get();
  jobs.filter((job) => job.active).map(scheduleJob);
}
