import { db } from "@/lib/db";
import cron from "node-cron";

export async function register() {
  const jobs = await db.get();

  jobs.forEach(({ id, pattern, url }) => {
    console.log("Adding job: " + id);
    cron.schedule(
      pattern,
      () => {
        console.log("Running job!", id);
        fetch(url).then((response) => {
          response.text().then((text) => {
            db.upsert({
              id,
              pattern,
              url,
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
  });
}
