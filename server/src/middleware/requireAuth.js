import jwt from 'jsonwebtoken';
import { User } from '../models.js';

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
  try {
    if (!process.env.JWT_SECRET) return res.status(503).json({ error: 'Authentication is not configured.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'filewiz-api', audience: 'filewiz-client' });
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'Your session expired. Sign in again.' });
    if (payload.version !== user.sessionVersion) return res.status(401).json({ error: 'Your session expired. Sign in again.' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Your session expired. Sign in again.' });
  }
}

export function issueToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required for authentication.');
  return jwt.sign({ sub: user.id, version: user.sessionVersion || 0 }, process.env.JWT_SECRET, { expiresIn: '7d', issuer: 'filewiz-api', audience: 'filewiz-client' });
}
