import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { requireAuth } from '../../middleware/requireAuth.js';
import { Setting, Subscription, User } from '../../models.js';

const router = Router();
const DEFAULT_PRICE_PAISE = 900;
const ADMIN_EMAIL = (process.env.FILEWIZ_ADMIN_EMAIL || '').toLowerCase();
const razorpayReady = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET);
const currentPremium = (user) => user.tier === 'premium' && (!user.planExpiresAt || user.planExpiresAt.getTime() > Date.now());

async function getPrice() {
  const setting = await Setting.findOne({ key: 'premium_monthly_price_paise' });
  return Number(setting?.value) || Number(process.env.FILEWIZ_PREMIUM_PRICE_PAISE) || DEFAULT_PRICE_PAISE;
}
async function razorpay(path, options = {}) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1${path}`, { ...options, headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json', ...options.headers } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.description || 'Razorpay could not complete the request.');
  return payload;
}
function signatureMatches(expected, supplied) {
  if (typeof supplied !== 'string' || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const a = Buffer.from(expected, 'hex'); const b = Buffer.from(supplied, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
function adminOnly(req, res, next) {
  if (!ADMIN_EMAIL || req.user.email.toLowerCase() !== ADMIN_EMAIL) return res.status(403).json({ error: 'Admin access is required.' });
  return next();
}

router.get('/config', async (_req, res, next) => {
  try { res.json({ enabled: razorpayReady(), amount: (await getPrice()) / 100, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID || '' }); }
  catch (error) { next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id, status: { $in: ['created', 'authenticated', 'active'] } });
    res.json({ tier: currentPremium(req.user) ? 'premium' : 'free', source: req.user.planSource || 'free', expiresAt: req.user.planExpiresAt, canCancelSubscription: Boolean(subscription), isAdmin: Boolean(ADMIN_EMAIL && req.user.email.toLowerCase() === ADMIN_EMAIL), monthlyPrice: (await getPrice()) / 100 });
  } catch (error) { next(error); }
});

router.post('/subscriptions', requireAuth, async (req, res, next) => {
  if (!razorpayReady()) return res.status(503).json({ error: 'Razorpay billing is not fully configured.' });
  try {
    if (currentPremium(req.user)) return res.status(409).json({ error: 'Premium is already active for this account.' });
    const pending = await Subscription.findOne({ userId: req.user._id, status: 'created' }).sort({ createdAt: -1 });
    if (pending) return res.json({ subscriptionId: pending.razorpaySubscriptionId, keyId: process.env.RAZORPAY_KEY_ID, amount: pending.amountPaise / 100, currency: pending.currency });
    const amount = await getPrice();
    const plan = await razorpay('/plans', { method: 'POST', body: JSON.stringify({ period: 'monthly', interval: 1, item: { name: 'FileWiz Premium', amount, currency: 'INR', description: 'FileWiz Premium monthly subscription' }, notes: { product: 'FileWiz' } }) });
    const subscription = await razorpay('/subscriptions', { method: 'POST', body: JSON.stringify({ plan_id: plan.id, total_count: 120, quantity: 1, customer_notify: 0, notes: { filewiz_user_id: req.user.id, filewiz_email: req.user.email } }) });
    await Subscription.create({ userId: req.user._id, razorpaySubscriptionId: subscription.id, razorpayPlanId: plan.id, status: subscription.status || 'created', amountPaise: amount, currency: 'INR' });
    res.status(201).json({ subscriptionId: subscription.id, shortUrl: subscription.short_url, keyId: process.env.RAZORPAY_KEY_ID, amount: amount / 100, currency: 'INR' });
  } catch (error) { next(error); }
});

router.post('/subscriptions/verify', requireAuth, async (req, res, next) => {
  const { razorpay_payment_id: paymentId, razorpay_subscription_id: subscriptionId, razorpay_signature: signature } = req.body || {};
  if (!paymentId || !subscriptionId || !signature) return res.status(400).json({ error: 'Payment verification details are incomplete.' });
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id, razorpaySubscriptionId: subscriptionId });
    if (!subscription) return res.status(404).json({ error: 'Subscription was not found for this account.' });
    const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${paymentId}|${subscriptionId}`).digest('hex');
    if (!signatureMatches(expected, signature)) return res.status(400).json({ error: 'Payment signature could not be verified.' });
    const verified = await razorpay(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
    if (!['active', 'authenticated'].includes(verified.status)) return res.status(402).json({ error: 'Razorpay has not activated this subscription yet.' });
    subscription.status = verified.status; subscription.razorpayPaymentId = paymentId; await subscription.save();
    req.user.tier = 'premium'; req.user.planSource = 'razorpay'; req.user.planExpiresAt = verified.current_end ? new Date(verified.current_end * 1000) : null; await req.user.save();
    res.json({ verified: true, tier: 'premium' });
  } catch (error) { next(error); }
});

router.post('/subscriptions/cancel', requireAuth, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id, status: { $in: ['created', 'authenticated', 'active'] } }).sort({ createdAt: -1 });
    if (!subscription) return res.status(404).json({ error: 'No active subscription was found.' });
    const updated = await razorpay(`/subscriptions/${encodeURIComponent(subscription.razorpaySubscriptionId)}/cancel`, { method: 'POST', body: JSON.stringify({ cancel_at_cycle_end: 1 }) });
    subscription.status = updated.status || subscription.status; await subscription.save();
    res.json({ cancelAtCycleEnd: true, status: subscription.status });
  } catch (error) { next(error); }
});

router.post('/webhook', async (req, res, next) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET; const supplied = req.headers['x-razorpay-signature'];
  if (!secret || !Buffer.isBuffer(req.rawBody)) return res.status(503).json({ error: 'Webhook verification is not configured.' });
  if (!signatureMatches(createHmac('sha256', secret).update(req.rawBody).digest('hex'), supplied)) return res.status(400).json({ error: 'Webhook signature is invalid.' });
  const event = req.body?.event; const entity = req.body?.payload?.subscription?.entity;
  if (!entity?.id) return res.json({ received: true });
  try {
    const subscription = await Subscription.findOne({ razorpaySubscriptionId: entity.id });
    if (!subscription) return res.json({ received: true });
    subscription.status = entity.status || event; await subscription.save();
    const user = await User.findById(subscription.userId);
    if (user && ['active', 'authenticated'].includes(subscription.status) && ['subscription.activated', 'subscription.charged', 'subscription.authenticated'].includes(event)) {
      user.tier = 'premium'; user.planSource = 'razorpay'; user.planExpiresAt = entity.current_end ? new Date(entity.current_end * 1000) : null; await user.save();
    } else if (user && ['cancelled', 'halted', 'completed'].includes(subscription.status)) {
      user.tier = 'free'; user.planSource = 'razorpay'; user.planExpiresAt = null; await user.save();
    }
    res.json({ received: true });
  } catch (error) { next(error); }
});

router.get('/admin/users', requireAuth, adminOnly, async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('email name tier planSource planExpiresAt createdAt');
    res.json({ users: users.map((user) => ({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt, tier: currentPremium(user) ? 'premium' : 'free', source: user.planSource || 'free', expiresAt: user.planExpiresAt })), monthlyPrice: (await getPrice()) / 100, adminEmail: ADMIN_EMAIL });
  } catch (error) { next(error); }
});

router.put('/admin/price', requireAuth, adminOnly, async (req, res, next) => {
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount < 1 || amount > 10000 || Math.round(amount * 100) !== amount * 100) return res.status(400).json({ error: 'Monthly price must be between ₹1 and ₹10,000, with up to two decimal places.' });
  try { await Setting.findOneAndUpdate({ key: 'premium_monthly_price_paise' }, { value: String(Math.round(amount * 100)) }, { upsert: true, new: true }); res.json({ amount }); }
  catch (error) { next(error); }
});

router.put('/admin/users/:id/tier', requireAuth, adminOnly, async (req, res, next) => {
  const tier = req.body?.tier;
  if (!['free', 'premium'].includes(tier)) return res.status(400).json({ error: 'Choose a valid account tier.' });
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User was not found.' });
    user.tier = tier; user.planSource = 'admin'; user.planExpiresAt = null; await user.save();
    res.json({ userId: user.id, tier });
  } catch (error) { next(error); }
});

export default router;
