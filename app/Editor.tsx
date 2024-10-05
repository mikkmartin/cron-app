"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import * as Table from "@/components/ui/table";
import { Job } from "@/lib/db";
import { getTimeUntilNextInvocation, time } from "@/lib/utils";
import { Check, EllipsisVertical, Trash, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { addJob, deleteJob, getData, updateJob } from "./actions";
import { Countdown } from "./countdown";

export function Editor(props: { jobs: Job[] }) {
  const [jobs, setJobs] = useState(props.jobs);

  useEffect(() => {
    const nextTrigger = jobs
      .filter((job) => job.active)
      .reduce((acc, job) => {
        const nextInvocation = getTimeUntilNextInvocation(job.pattern);
        return Math.min(acc, nextInvocation?.asMilliseconds() ?? Infinity);
      }, Infinity);
    const id = setTimeout(async () => {
      const jobs = await getData();
      setJobs(jobs);
    }, nextTrigger);
    return () => clearTimeout(id);
  }, [jobs]);

  return (
    <>
      <form
        action={(formData) => {
          const pattern = formData.get("pattern") as string;
          const url = formData.get("url") as string;
          const newJob = { id: "temp", pattern, url, active: true };

          setJobs([...jobs, newJob]);
          addJob(newJob).then((res) => {
            if (!res) return;
            setJobs(
              jobs.map((job) =>
                job.id === "temp" ? { ...job, id: res.id } : job
              )
            );
          });
        }}
        className="flex gap-2 w-full mb-2"
      >
        <Input
          className="flex-1"
          type="text"
          name="pattern"
          defaultValue="* * * * *"
          placeholder="Cron expression"
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

      <Table.Table className="w-full">
        <Table.TableHeader>
          <Table.TableRow>
            <Table.TableHead colSpan={2} className="min-w-[140px]">
              CRON expression
            </Table.TableHead>
            <Table.TableHead>URL</Table.TableHead>
            <Table.TableHead>Next run</Table.TableHead>
            <Table.TableHead>Last run</Table.TableHead>
            <Table.TableHead className="text-right">Status</Table.TableHead>
          </Table.TableRow>
        </Table.TableHeader>
        <Table.TableBody>
          {jobs.map((job) => (
            <Table.TableRow key={job.id}>
              <Table.TableCell>
                <Switch
                  checked={job.active}
                  onCheckedChange={(active) => {
                    setJobs((jobs) => {
                      const newJob = { ...job, active };
                      const newJobs = jobs.map((_job) =>
                        _job.id === job.id ? newJob : _job
                      );
                      updateJob(newJob);
                      return newJobs;
                    });
                  }}
                />
              </Table.TableCell>
              <Table.TableCell className="font-bold text-xl whitespace-nowrap">
                {job.pattern}
              </Table.TableCell>
              <Table.TableCell className="whitespace-nowrap truncate max-w-32">
                {job.url}
              </Table.TableCell>

              <Table.TableCell>
                {job.active ? (
                  <Countdown cronExpression={job.pattern} />
                ) : (
                  <span className="text-slate-400">Inactive</span>
                )}
              </Table.TableCell>

              <Table.TableCell>
                <Popover>
                  <PopoverTrigger className="flex items-center gap-2">
                    {job.lastRun ? (
                      job.lastRun.success ? (
                        <>
                          <Check className="w-4 text-green-600" />
                          {job.lastRun?.date
                            ? time
                                .duration(time(job.lastRun.date).diff(time()))
                                .humanize(true)
                            : ""}
                        </>
                      ) : (
                        <XCircle className="w-4 text-red-600" />
                      )
                    ) : (
                      <span>–</span>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="max-h-64 p-0 flex flex-col &>*:grow-0">
                    <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 px-3 py-2">
                      Response
                    </h3>
                    <hr />
                    <div className="w-full h-full overflow-auto">
                      <pre className="text-xs px-4">
                        {job.lastRun?.response}
                      </pre>
                    </div>
                  </PopoverContent>
                </Popover>
              </Table.TableCell>

              <Table.TableCell className="flex items-center justify-end overflow-visible pr-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="hover:bg-slate-100">
                      <EllipsisVertical className="w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                      onClick={() => {
                        setJobs(jobs.filter((_job) => job.id !== _job.id));
                        deleteJob(job.id);
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Table.TableCell>
            </Table.TableRow>
          ))}
        </Table.TableBody>
      </Table.Table>
    </>
  );
}
