import { LibSQLStore } from "@mastra/libsql";
import { DuckDBStore } from "@mastra/duckdb";
import { MastraCompositeStore } from "@mastra/core/storage";
import { Memory } from "@mastra/memory";

export const storage = new MastraCompositeStore({
  id: "composite-storage",
  default: new LibSQLStore({
    id: "mastra-storage",
    url: "file:./mastra.db",
  }),
  domains: {
    observability: await new DuckDBStore().getStore("observability"),
  },
});

export const agentMemory = new Memory({ storage });
