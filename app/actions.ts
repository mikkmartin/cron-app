"use server";
import { scheduleJob } from "@/lib/cronjobs";
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

export async function addJob(job: Omit<Job, "id">) {
  const valid = cron.validate(job.pattern);
  if (!valid) return;

  const id = randomUUID();
  await db.upsert({ id, ...job });

  scheduleJob({ id, ...job });

  return { id };
}
