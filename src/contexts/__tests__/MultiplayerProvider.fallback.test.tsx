import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

const originalEnv = {
  url: process.env.VITE_SUPABASE_URL,
  key: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
};
const originalProcess = globalThis.process;
const originalImportMetaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;

describe('MultiplayerProvider fallback', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  });

  afterEach(() => {
    vi.stubGlobal('process', originalProcess);
    if (typeof import.meta !== 'undefined') {
      (import.meta as any).env = originalImportMetaEnv;
    }
    vi.resetModules();
    if (originalEnv.url === undefined) {
      delete process.env.VITE_SUPABASE_URL;
    } else {
      process.env.VITE_SUPABASE_URL = originalEnv.url;
    }
    if (originalEnv.key === undefined) {
      delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    } else {
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY = originalEnv.key;
    }
  });

  it('renders without Supabase credentials', async () => {
    const module = await import('@/contexts/MultiplayerProvider');
    const { MultiplayerProvider } = module;

    expect(() =>
      render(
        <MultiplayerProvider>
          <div>test-child</div>
        </MultiplayerProvider>,
      ),
    ).not.toThrow();
  });

  it('renders when environment globals are unavailable', async () => {
    vi.stubGlobal('process', undefined as never);
    if (typeof import.meta !== 'undefined') {
      (import.meta as any).env = undefined;
    }

    const module = await import('@/contexts/MultiplayerProvider');
    const { MultiplayerProvider } = module;

    expect(() =>
      render(
        <MultiplayerProvider>
          <div>test-child</div>
        </MultiplayerProvider>,
      ),
    ).not.toThrow();
  });
});
