import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { ShortLink } from '../../models.js';

const router = Router();
const windows = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_CREATES_PER_HOUR = 20;

function creationRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  let entry = windows.get(key);
  if (!entry || now - entry.start >= WINDOW_MS) windows.set(key, entry = { start: now, count: 0 });
  if (entry.count >= MAX_CREATES_PER_HOUR) return res.status(429).json({ error: 'Too many links created. Try again later.' });
  entry.count += 1;
  return next();
}

function validDestination(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

router.post('/', creationRateLimit, async (req, res, next) => {
  const { url } = req.body || {};
  if (!validDestination(url)) return res.status(400).json({ error: 'Enter a valid HTTP or HTTPS URL, up to 2048 characters.' });
  try {
    const destinationUrl = new URL(url.trim()).href;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const link = await ShortLink.create({ code: randomBytes(5).toString('base64url'), destinationUrl, expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) });
        return res.status(201).json({ code: link.code });
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
    }
    return res.status(503).json({ error: 'Could not create a unique short link. Please try again.' });
  } catch (error) { return next(error); }
});

router.get('/:code', async (req, res, next) => {
  const { code } = req.params;
  if (!/^[A-Za-z0-9_-]{6,16}$/.test(code)) return res.status(404).json({ error: 'Short link not found.' });
  try {
    const link = await ShortLink.findOne({ code, expiresAt: { $gt: new Date() } }).select('destinationUrl');
    if (!link || !validDestination(link.destinationUrl)) return res.status(404).json({ error: 'Short link not found or expired.' });
    return res.json({ url: link.destinationUrl });
  } catch (error) { return next(error); }
});

export default router;
