import { afterEach, vi } from "vitest";

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
