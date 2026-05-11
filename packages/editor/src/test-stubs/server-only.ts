// Test-only stub for Next.js "server-only" sentinel. The real package throws
// at import time inside a client bundle; under vitest jsdom we want server
// modules loadable as plain TS.
export {};
