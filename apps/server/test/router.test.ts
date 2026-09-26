import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "../src/routes/index.js";

describe("tRPC App Router", () => {
  it("health.ping returns ok", async () => {
    const caller = appRouter.createCaller({} as any);
    const res = await caller.health.ping();
    expect(res.ok).toBe(true);
    expect(res.timestamp).toBeDefined();
  });
});
