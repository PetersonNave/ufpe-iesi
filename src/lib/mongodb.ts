import mongoose from 'mongoose';

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

declare global {
  var mongoose: MongooseCache | undefined;
}
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Por favor, defina a variável MONGODB_URI no seu .env.local');
}

let cached: MongooseCache;

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null } as MongooseCache;
}
cached = global.mongoose as MongooseCache;

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;