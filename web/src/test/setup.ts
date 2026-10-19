import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// jsdom has no matchMedia. Report prefers-reduced-motion so motion renders final states
// immediately: tests assert on what the API sent, not on animation frames.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    // motion asks `(prefers-reduced-motion)` (boolean form), CSS-style queries ask `: reduce`.
    matches: query.includes('prefers-reduced-motion') && !query.includes('no-preference'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});
