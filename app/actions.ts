"use server";
import { db, Job } from "@/lib/db";
import { randomUUID } from "crypto";
import cron from "node-cron";
import "server-only";

export async function getData() {
  const jobs = await db.get();
  return jobs;
}

export async function deleteJob(id: string) {
  return db.delete(id);
}

export async function updateJob(job: Job) {
  return db.upsert(job);
}

export async function addJob({ pattern, url }: Omit<Job, "id">) {
  const valid = cron.validate(pattern);
  if (!valid) return;

  const id = randomUUID();
  await db.upsert({
    id,
    pattern,
    url,
    active: true,
  });

  cron.schedule(
    pattern,
    () => {
      fetch(url).then((response) => {
        response.text().then((text) => {
          db.upsert({
            id,
            pattern,
            url,
            active: true,
            lastRun: {
              date: new Date().toISOString(),
              success: response.ok,
              response: text,
            },
          });
        });
      });
    },
    { name: id }
  );

  return { id };
}
