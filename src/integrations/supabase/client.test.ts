import { afterEach, describe, expect, it, vi } from 'vitest';

describe('supabase client', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('imports without a window object', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'public-anon-key');

    await expect(import('./client')).resolves.toHaveProperty('supabase');
  });
});
