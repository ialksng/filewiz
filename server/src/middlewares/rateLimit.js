const windows = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 12;

export function uploadRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  let entry = windows.get(key);
  if (!entry || now - entry.start >= WINDOW_MS) {
    entry = { start: now, count: 0 };
    windows.set(key, entry);
  }
  if (windows.size > 10000) {
    for (const [address, value] of windows) {
      if (now - value.start >= WINDOW_MS) windows.delete(address);
    }
  }
  if (entry.count >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many processing requests. Try again later.' });
  }
  entry.count += 1;
  return next();
}
