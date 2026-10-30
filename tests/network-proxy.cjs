// Optional local test transport for machines that require HTTPS_PROXY.
// Not imported by the application or included in production requests.
if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
  const { EnvHttpProxyAgent, setGlobalDispatcher } = require('undici')
  setGlobalDispatcher(new EnvHttpProxyAgent())
}
