type Bucket = { tokens: number; lastRefillMs: number }

const buckets = new Map<string, Bucket>()

export type RateLimitOptions = {
  limit: number
  intervalMs: number
}

export function rateLimit(key: string, opts: RateLimitOptions) {
  const now = Date.now()
  const perMs = opts.limit / opts.intervalMs

  const bucket = buckets.get(key) ?? { tokens: opts.limit, lastRefillMs: now }
  const elapsed = now - bucket.lastRefillMs
  const refill = elapsed * perMs
  bucket.tokens = Math.min(opts.limit, bucket.tokens + refill)
  bucket.lastRefillMs = now

  if (bucket.tokens < 1) {
    buckets.set(key, bucket)
    return { ok: false, retryAfterMs: Math.ceil((1 - bucket.tokens) / perMs) }
  }

  bucket.tokens -= 1
  buckets.set(key, bucket)
  return { ok: true, retryAfterMs: 0 }
}

export function getClientIp(req: Request) {
  const xfwd = req.headers.get("x-forwarded-for")
  if (xfwd) return xfwd.split(",")[0]?.trim() ?? "unknown"
  return req.headers.get("x-real-ip") ?? "unknown"
}

