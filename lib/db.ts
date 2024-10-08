import "server-only";
import cron from "node-cron";

const dbPath =
  process.env.NODE_ENV === "production" ? "../data/db.json" : "db.json";

export const db = {
  get: async (): Promise<Job[]> => {
    const file = await Bun.file(dbPath);
    const exists = await file.exists();
    if (exists) {
      return Bun.file(dbPath).json();
    }
    Bun.write(dbPath, "[]");
    return [];
  },
  set: async (data: Job[]) => {
    const dataString = JSON.stringify(data, null, 2);
    await Bun.write(dbPath, dataString);
  },
  upsert: async (data: Job) => {
    const oldData = await db.get();
    const index = oldData.findIndex((job) => job.id === data.id);
    if (index === -1) {
      oldData.push(data);
    } else {
      oldData[index] = data;
    }
    await db.set(oldData);
  },
  insert: async (data: Job) => {
    const oldData = await db.get();
    oldData.push(data);
    await db.set(oldData);
  },
  delete: async (id: string) => {
    const oldData = await db.get();
    const index = oldData.findIndex((job) => job.id === id);
    if (index === -1) return;
    oldData.splice(index, 1);
    const tasks = cron.getTasks();
    [...tasks].map(([name, task]: [string, cron.ScheduledTask]) => {
      console.log(name, id);
      if (name === id) {
        task.stop();
        console.log("Job deleted: " + name);
      }
    });
    await db.set(oldData);
  },
};

export type Job = {
  id: string;
  pattern: string;
  url: string;
  active: boolean;
  lastRun?: {
    date: string;
    success: boolean;
    response: string;
  };
};
