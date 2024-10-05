import { getData } from "./actions";
import { Editor } from "./Editor";

export const dynamic = "force-dynamic";

export default async function Home() {
  const jobs = await getData();

  return (
    <div className="grid my-[10vh] md:max-w-[720px] mx-6 md:mx-auto">
      <Editor jobs={jobs} />
    </div>
  );
}
