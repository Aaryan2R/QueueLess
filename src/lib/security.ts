const buckets = new Map<string, { count: number; resetAt: number }>();

export function isTrustedMutation(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const requestOrigin = new URL(request.url).origin;
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProtocol = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  const hostOrigin = forwardedHost ? `${forwardedProtocol}://${forwardedHost}` : null;

  return [configuredOrigin, requestOrigin, hostOrigin].includes(origin);
}

export function getClientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (buckets.size > 10_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function publicError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  const safePatterns = [
    /^There are no waiting customers\.$/,
    /^Queue not found or access denied\.$/,
    /^Ticket not found or access denied\.$/,
    /^That ticket cannot move from [A-Z_]+ to [A-Z_]+\.$/,
    /^This queue is not accepting new customers\.$/,
    /^This queue is currently full\.$/,
    /^Ticket not found or customer cancellation is disabled\.$/,
    /^This ticket is already complete\.$/,
    /^Ticket is not currently awaiting arrival\.$/,
    /^The 120-second arrival window has expired\.$/,
    /^Business not found or access denied\.$/,
    /^No account exists for that email address\.$/,
    /^The business owner is already a manager\.$/,
    /^Please enter a name between 1 and 80 characters\.$/,
    /^Party size must be between 1 and 20\.$/
  ];

  return safePatterns.some((pattern) => pattern.test(message)) ? message : fallback;
}
