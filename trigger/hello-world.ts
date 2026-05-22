import { logger, task } from "@trigger.dev/sdk/v3";

export const helloWorld = task({
  id: "hello-world",
  run: async () => {
    logger.log("Hello from dpaperwork");
  },
});
