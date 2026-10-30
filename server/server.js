import 'dotenv/config';
import app from './src/app.js';
import { connectMongo } from './src/db.js';

const PORT = Number(process.env.PORT) || 5001;

await connectMongo();

const server = app.listen(PORT, () => {
  console.log(`✅ FileWiz Engine running on port ${PORT}`);
});

server.requestTimeout = Number(process.env.REQUEST_TIMEOUT_MS) || 90000;
server.headersTimeout = 30000;
