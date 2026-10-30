import mongoose from 'mongoose';

let connectionPromise;

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI is required to start the FileWiz API.');
  connectionPromise = mongoose.connect(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 10000 })
    .then((connection) => {
      console.log('Connected to MongoDB');
      return connection;
    })
    .catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  return connectionPromise;
}
