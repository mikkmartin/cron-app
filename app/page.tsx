import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as Table from "@/components/ui/table";
import { randomUUID } from "crypto";
import { Trash } from "lucide-react";
import cron from "node-cron";
import parser from "cron-parser";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { db } from "@/lib/db";
dayjs.extend(duration);
dayjs.extend(relativeTime);

export default async function Home() {
  const jobs = await db.get();

  return (
    <div className="grid items-center justify-center my-[10vh]">
      <form action={addJob} className="flex gap-2">
        <Input
          className="flex-1"
          type="text"
          name="pattern"
          defaultValue="* * * * *"
          placeholder="Enter a cron expression"
        />
        <Input
          className="flex-[3]"
          type="text"
          name="url"
          placeholder="Enter a url to fetch"
        />
        <Button type="submit" value="Add Job">
          Add job
        </Button>
      </form>

      <Table.Table>
        <Table.TableHeader>
          <Table.TableRow>
            <Table.TableHead className="min-w-[100px]">
              CRON expression
            </Table.TableHead>
            <Table.TableHead>URL</Table.TableHead>
            <Table.TableHead>Next run</Table.TableHead>
            <Table.TableHead className="text-right">Last run</Table.TableHead>
          </Table.TableRow>
        </Table.TableHeader>
        <Table.TableBody>
          {jobs.map(({ id, pattern, url, lastRun }) => (
            <Table.TableRow key={id}>
              <Table.TableCell className="font-medium w-[150px]">
                {pattern}
              </Table.TableCell>
              <Table.TableCell>{url}</Table.TableCell>
              <Table.TableCell>
                {getTimeUntilNextInvocation(pattern)?.humanize(true)}
              </Table.TableCell>
              <Table.TableCell>
                {lastRun?.date
                  ? dayjs
                      .duration(dayjs(lastRun.date).diff(dayjs()))
                      .humanize(true)
                  : ""}
              </Table.TableCell>
              <Table.TableCell className="text-right">
                <form action={deleteJob}>
                  <Button name="id" value={id} variant="secondary">
                    <Trash />
                  </Button>
                </form>
              </Table.TableCell>
            </Table.TableRow>
          ))}
        </Table.TableBody>
      </Table.Table>
    </div>
  );
}

async function deleteJob(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  return db.delete(id);
}

async function addJob(formData: FormData) {
  "use server";
  const pattern = formData.get("pattern") as string;
  const url = formData.get("url") as string;

  const valid = cron.validate(pattern);
  if (!valid) return;

  const id = randomUUID();
  await db.upsert({
    id,
    pattern,
    url,
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

function getTimeUntilNextInvocation(cronExpression: string) {
  try {
    const interval = parser.parseExpression(cronExpression);
    const nextInvocation = interval.next().toDate();

    const now = dayjs();
    const difference = dayjs(nextInvocation).diff(now);
    const duration = dayjs.duration(difference);

    return duration;
  } catch (err) {
    console.error("Error parsing cron expression:", err);
    return null;
  }
}
