const ipRequests = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, limit: number = 25, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = ipRequests.get(ip);

  if (!record || now > record.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}
