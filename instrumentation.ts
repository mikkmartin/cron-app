export async function register() {
  const { NEXT_RUNTIME, NODE_ENV } = process.env;
  console.log({ NEXT_RUNTIME, NODE_ENV });
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("registering instrumentation");
    (await import("./startup")).register();
  }
}
