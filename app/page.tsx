import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as Table from "@/components/ui/table";
import { randomUUID } from "crypto";
import { Delete, Trash } from "lucide-react";
import cron from "node-cron";

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
              <Table.TableCell>In....</Table.TableCell>
              <Table.TableCell>{lastRun?.date}</Table.TableCell>
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

type Job = {
  id: string;
  pattern: string;
  url: string;
  lastRun?: {
    date: string;
    success: boolean;
    response: string;
  };
};

const dbPath = "db.json";
const db = {
  get: async (): Promise<Job[]> => {
    const file = await Bun.file(dbPath);
    const exists = await file.exists();
    if (exists) {
      return Bun.file(dbPath).json();
    }
    Bun.write(dbPath, "[]");
    return [];
  },
  set: async (data: string) => {
    JSON.parse(data);
    await Bun.write(dbPath, data);
  },
  upsert: async (data: Job) => {
    const oldData = await db.get();
    const index = oldData.findIndex((job) => job.id === data.id);
    if (index === -1) {
      oldData.push(data);
    } else {
      oldData[index] = data;
    }
    await db.set(JSON.stringify(oldData));
  },
  insert: async (data: Job) => {
    const oldData = await db.get();
    const inserted = oldData.push(data);
    await db.set(JSON.stringify(inserted));
  },
  delete: async (id: string) => {
    const oldData = await db.get();
    const index = oldData.findIndex((job) => job.id === id);
    if (index === -1) return;
    oldData.splice(index, 1);
    const deleted = cron.getTasks().delete(id);
    console.log("Job deleted: " + deleted);
    await db.set(JSON.stringify(oldData));
  },
};
