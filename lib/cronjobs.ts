import { db, Job } from "./db";
import cron from "node-cron";

export function scheduleJob({ pattern, url, id }: Job) {
  console.log("Scheduling job: " + id);
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
}
