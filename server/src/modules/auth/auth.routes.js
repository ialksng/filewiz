import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'node:crypto';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../../models.js';
import { issueToken, requireAuth } from '../../middleware/requireAuth.js';

const router = Router();
const googleClient = new OAuth2Client();
const publicUser = (user) => ({ id: user.id, email: user.email, name: user.name || '', tier: user.tier || 'free', createdAt: user.createdAt });
const sendSession = (res, user, status = 200) => res.status(status).json({ token: issueToken(user), user: publicUser(user) });

router.post('/signup', async (req, res, next) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (name.length > 80 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Enter a valid email, a name under 80 characters, and a password of 8 to 128 characters.' });
  }
  try {
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    return sendSession(res, user, 201);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'An account with this email already exists.' });
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  try {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) return res.status(401).json({ error: 'Email or password is incorrect.' });
    if (!user.passwordHash) return res.status(401).json({ error: 'This account uses Google sign-in. Continue with Google to access it.' });
    if (!(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
    return sendSession(res, user);
  } catch (error) { return next(error); }
});

router.post('/google', async (req, res, next) => {
  const credential = typeof req.body?.credential === 'string' ? req.body.credential : '';
  if (!credential || credential.length > 12000) return res.status(400).json({ error: 'Google sign-in credential is missing or invalid.' });
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Google sign-in is not configured on the API.' });
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const identity = ticket.getPayload();
    if (!identity?.sub || !identity.email || identity.email_verified !== true) return res.status(401).json({ error: 'Google could not verify this account email.' });
    let user = await User.findOne({ googleId: identity.sub }).select('+googleId');
    if (!user) {
      user = await User.findOne({ email: identity.email.toLowerCase() }).select('+googleId +passwordHash');
      if (user?.passwordHash && !user.googleId) return res.status(409).json({ error: 'An account already uses this email. Sign in with your password to continue.' });
      if (user?.googleId && user.googleId !== identity.sub) return res.status(409).json({ error: 'This email is linked to a different Google account.' });
      const requestedName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      if (!user) user = new User({ email: identity.email.toLowerCase(), name: requestedName || identity.name || '', googleId: identity.sub });
      else user.googleId = identity.sub;
      await user.save();
    }
    return sendSession(res, user);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'This Google account is already linked to another FileWiz account.' });
    return next(error);
  }
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

router.put('/profile', requireAuth, async (req, res, next) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name || name.length > 80) return res.status(400).json({ error: 'Enter a name up to 80 characters.' });
  try {
    req.user.name = name;
    await req.user.save();
    return res.json({ user: publicUser(req.user) });
  } catch (error) { return next(error); }
});

router.post('/forgot-password', async (req, res, next) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) return res.status(503).json({ error: 'Password reset email is not configured. Add SMTP_HOST and SMTP_FROM to the API settings.' });
  try {
    const user = await User.findOne({ email });
    if (user) {
      const resetToken = randomBytes(32).toString('hex');
      user.resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
      user.resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT) || 587, secure: process.env.SMTP_SECURE === 'true', auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined });
      const origin = process.env.APP_ORIGIN || 'https://ialksng.me/work/projects/filewiz/';
      const link = `${origin.replace(/\/$/, '')}/reset-password?token=${resetToken}`;
      await transporter.sendMail({ from: process.env.SMTP_FROM, to: user.email, subject: 'Reset your FileWiz password', text: `Use this link within 30 minutes to reset your password: ${link}` });
    }
    return res.json({ message: 'If an account exists for that email, a password reset link has been sent.' });
  } catch (error) { return next(error); }
});

router.post('/reset-password', async (req, res, next) => {
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (password.length < 8 || password.length > 128) return res.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
  try {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ resetTokenHash: tokenHash, resetTokenExpiresAt: { $gt: new Date() } }).select('+passwordHash');
    if (!user) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetTokenHash = undefined;
    user.resetTokenExpiresAt = undefined;
    user.sessionVersion += 1;
    await user.save();
    return res.json({ message: 'Password updated. You can now sign in.' });
  } catch (error) { return next(error); }
});

export default router;
