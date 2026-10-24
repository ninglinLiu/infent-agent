export const accountTransport: typeof fetch = (input, init) => {
  const timeout = AbortSignal.timeout(15000)
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout
  return fetch(input, { ...init, signal })
}
