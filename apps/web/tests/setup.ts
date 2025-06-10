import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock minimal crypto API required by Solana
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: () => new Uint8Array(32),
    subtle: { digest: vi.fn() } as unknown as SubtleCrypto,
    randomUUID: () => '00000000-0000-0000-0000-000000000000'
  } as unknown as Crypto
});

// Mock process.env.NETWORK
process.env.NETWORK = 'devnet';

afterEach(() => {
  cleanup();
});
