import { describe, it, expect, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: { admin: { getUserById: vi.fn() } },
    from: vi.fn(),
  })),
}));

import { getSupabaseAdmin } from "../src/lib/supabase.js";

describe("getSupabaseAdmin", () => {
  it("throws when SUPABASE_URL is missing", () => {
    const orig = process.env.SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
    expect(() => getSupabaseAdmin()).toThrow("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.env.SUPABASE_URL = orig;
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", () => {
    const orig = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_URL = "https://test.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => getSupabaseAdmin()).toThrow("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.env.SUPABASE_SERVICE_ROLE_KEY = orig;
  });

  it("creates client when both env vars present", () => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
    const client = getSupabaseAdmin();
    expect(client).toBeDefined();
    expect(createClient).toHaveBeenCalled();
  });
});
