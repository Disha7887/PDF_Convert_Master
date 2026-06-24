/**
 * Global runtime configuration.
 *
 * `USE_MOCK_DATA` is the single switch that disables ALL real network / API /
 * auth behaviour. This build keeps it OFF (false): the app runs against the real
 * backend for auth, dashboard and everything else — no mock data or demo emails
 * are used. When flipped to true, the app would instead run fully offline against
 * the local mock-data layer in `mocks/` (those files are kept but currently
 * unused). The real backend code paths live in `services/api.ts`.
 */
export const USE_MOCK_DATA = false;

/**
 * The CONVERT tools always call the real api-server backend (the same API the
 * web app uses), even while `USE_MOCK_DATA` keeps auth, dashboard and marketing
 * on the offline mock layer. This lets anyone run real file conversions without
 * being forced to log in. Flip to `false` to fall back to bundled sample
 * outputs for a fully-offline demo.
 */
export const USE_REAL_CONVERSIONS = true;

/** Simulated network latency (ms) for mock service calls. */
export const MOCK_LATENCY_MS = 650;

/** Simulated per-step conversion duration (ms) for the mock job lifecycle. */
export const MOCK_CONVERT_STEP_MS = 900;

/** Resolves a promise after `ms` to emulate async network behaviour. */
export function mockDelay<T>(value: T, ms: number = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
