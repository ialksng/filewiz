import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';

// Import Modular Routes & Middlewares
import pdfRoutes from './modules/pdf/pdf.routes.js';
import linkRoutes from './modules/links/links.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { uploadRateLimit } from './middlewares/rateLimit.js';
import billingRoutes from './modules/billing/billing.routes.js';
import authRoutes from './modules/auth/auth.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  xFrameOptions: { action: 'deny' },
}));

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,https://ialksng.me')
  .split(',').map(origin => origin.trim()).filter(Boolean);
if (process.env.VERCEL_URL) allowedOrigins.push(`https://${process.env.VERCEL_URL}`);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '100kb', verify: (req, _res, buffer) => { req.rawBody = Buffer.from(buffer); } }));

// Health Check
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', service: 'filewiz-api' });
});

// ==========================================
// MOUNT TOOL MODULES HERE
// ==========================================
app.use('/api/pdf', uploadRateLimit, pdfRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
// app.use('/api/image', imageRoutes); // Future
// app.use('/api/video', videoRoutes); // Future

// ==========================================
// SERVE FRONTEND (React Build)
// ==========================================
// Adjusted dist path because app.js is now inside /src
const distPath = path.join(__dirname, '../../client/dist'); 
app.use(express.static(distPath));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Global Error Handler (must be last)
app.use(errorHandler);

export default app;
