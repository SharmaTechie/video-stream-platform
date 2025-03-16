import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/video-streaming"

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

interface MongooseCache {
  conn: any;
  promise: any;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose as MongooseCache

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return { mongoose, db: mongoose.connection.db }
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}

