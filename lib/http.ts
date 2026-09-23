import http from "node:http"
import https from "node:https"
import { URL } from "node:url"

/**
 * GET a URL without honoring HTTP(S)_PROXY.
 * The local proxy (127.0.0.1:7897) is currently down; Node's fetch would fail.
 */
export function fetchDirect(url: string, timeoutMs = 12_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const lib = u.protocol === "https:" ? https : http
    const req = lib.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || undefined,
        path: `${u.pathname}${u.search}`,
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "application/json,text/plain,*/*",
          "Accept-Encoding": "identity",
          Referer: "https://quote.eastmoney.com/",
        },
        timeout: timeoutMs,
      },
      (res) => {
        const status = res.statusCode ?? 0
        if (status >= 300 && status < 400 && res.headers.location) {
          const next = new URL(res.headers.location, url).toString()
          fetchDirect(next, timeoutMs).then(resolve, reject)
          return
        }
        const chunks: Buffer[] = []
        res.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8")
          if (status < 200 || status >= 300) {
            reject(new Error(`HTTP ${status} ${u.hostname}: ${body.slice(0, 180)}`))
            return
          }
          resolve(body)
        })
      }
    )
    req.on("error", reject)
    req.on("timeout", () => {
      req.destroy()
      reject(new Error(`timeout ${u.hostname}`))
    })
    req.end()
  })
}

export async function fetchDirectJson<T>(url: string, timeoutMs = 12_000): Promise<T> {
  const text = await fetchDirect(url, timeoutMs)
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`invalid JSON from ${new URL(url).hostname}: ${text.slice(0, 120)}`)
  }
}
