import app from '../server/src/app.js';
import { connectMongo } from '../server/src/db.js';

let databaseReady;

export default async function handler(req, res) {
  try {
    databaseReady ||= connectMongo();
    await databaseReady;
    return app(req, res);
  } catch (error) {
    databaseReady = undefined;
    console.error('FileWiz API initialization failed:', error.message);
    return res.status(503).json({ error: 'FileWiz API is temporarily unavailable. Check the MongoDB connection settings.' });
  }
}
