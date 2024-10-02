import * as Table from "@/components/ui/table";
import { randomUUID } from "crypto";
import cron from "node-cron";

export default async function Home() {
  const jobs = await db.get();

  return (
    <div className="grid items-center justify-center my-[10vh]">
      <form action={addJob}>
        <input
          type="text"
          name="pattern"
          placeholder="Enter a cron expression"
        />
        <input type="text" name="url" placeholder="Enter a url to fetch" />
        <input type="submit" value="Add Job" />
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
              <Table.TableCell className="text-right">
                {lastRun?.date}
              </Table.TableCell>
            </Table.TableRow>
          ))}
        </Table.TableBody>
      </Table.Table>
    </div>
  );
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

  cron.schedule(pattern, () => {
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
  });
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
    await db.set(JSON.stringify(oldData));
  },
};
