import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String, trim: true, maxlength: 80, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, select: false },
  googleId: { type: String, unique: true, sparse: true, select: false },
  resetTokenHash: { type: String, select: false },
  resetTokenExpiresAt: { type: Date, select: false },
  tier: { type: String, enum: ['free', 'premium'], default: 'free' },
  planSource: { type: String, default: 'free' },
  planExpiresAt: { type: Date, default: null },
  sessionVersion: { type: Number, default: 0 },
}, { timestamps: true });

const shortLinkSchema = new Schema({
  code: { type: String, required: true, unique: true },
  destinationUrl: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

const subscriptionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  razorpaySubscriptionId: { type: String, required: true, unique: true },
  razorpayPlanId: String,
  razorpayPaymentId: String,
  status: { type: String, required: true, index: true },
  amountPaise: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
}, { timestamps: true });

const settingSchema = new Schema({ key: { type: String, unique: true }, value: String }, { timestamps: true });

export const User = model('User', userSchema);
export const ShortLink = model('ShortLink', shortLinkSchema);
export const Subscription = model('Subscription', subscriptionSchema);
export const Setting = model('Setting', settingSchema);
