import { getData } from "./actions";
import { Editor } from "./Editor";

export const dynamic = "force-dynamic";

export default async function Home() {
  const jobs = await getData();

  return (
    <div className="grid md:max-w-[720px] mx-6 md:mx-auto py-[12vh]">
      <Editor jobs={jobs} />
    </div>
  );
}
