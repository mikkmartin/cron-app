import cron from "node-cron";

export function GET() {
  const jobs = cron.getTasks();

  return Response.json(Array.from(jobs).map(([key, value]) => key));
  return Response.json({ hello: "world" });
}
