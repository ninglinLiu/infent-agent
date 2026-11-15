/** Separate local build AND runtime opt-in. Never enabled on Vercel. */
export function localDemoEnabled() {
  return process.env.NEXT_PUBLIC_LOCAL_DEMO === '1' && process.env.OMNIAI_LOCAL_DEMO === '1' && !process.env.VERCEL
}
export function localOffline() { return localDemoEnabled() && process.env.OMNIAI_MODEL_MODE !== 'online' }
