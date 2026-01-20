import mongoose from "mongoose"

// Note: MONGODB_URI and MONGODB_DB are read at runtime, not at import time
// This allows dotenv to load them before the module is used
const getMongoUri = () => process.env.MONGODB_URI || ""
const getMongoDb = () => process.env.MONGODB_DB || "Atlas-Club-Manager"

/**
 * We use a global cached connection in development to avoid
 * creating a new connection on every hot reload.
 */

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined
}

const globalForMongoose = global as unknown as { _mongoose?: MongooseCache }

const cached: MongooseCache = globalForMongoose._mongoose || {
  conn: null,
  promise: null,
}

export async function connectMongo() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const MONGODB_URI = getMongoUri()
    const MONGODB_DB = getMongoDb()
    
    // Validate URI format
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set")
    }

    if (!MONGODB_URI.startsWith("mongodb://") && !MONGODB_URI.startsWith("mongodb+srv://")) {
      throw new Error(`Invalid MongoDB URI format. Expected to start with "mongodb://" or "mongodb+srv://", got: ${MONGODB_URI.substring(0, 50)}...`)
    }

    // Build connection URI: if URI already ends with /databaseName, use as-is
    // Otherwise append the database name
    let uriWithDb = MONGODB_URI.trim()
    
    // Remove trailing slash if present
    if (uriWithDb.endsWith("/")) {
      uriWithDb = uriWithDb.slice(0, -1)
    }
    
    // Append database name if not already in URI
    // Check if URI already contains a database name (after the last /)
    const uriParts = uriWithDb.split("/")
    const lastPart = uriParts[uriParts.length - 1]
    
    // If last part doesn't look like a database name (contains @ or is empty), append DB name
    if (!lastPart || lastPart.includes("@") || lastPart.includes("?")) {
      uriWithDb = `${uriWithDb}/${MONGODB_DB}`
    }

    console.log(`Connecting to MongoDB: ${uriWithDb.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}`)

    cached.promise = mongoose
      .connect(uriWithDb, {
        // Serverless/Atlas connection options
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        // For serverless environments (Vercel, etc.)
        bufferCommands: false,
        bufferMaxEntries: 0,
        // Retry options
        retryWrites: true,
        w: 'majority',
      })
      .then((mongooseInstance) => {
        console.log(`✅ Connected to MongoDB database: ${mongooseInstance.connection.name}`)
        return mongooseInstance
      })
      .catch((err) => {
        console.error("Failed to connect to MongoDB:", err)
        // More detailed error logging
        if (err.message?.includes('IP')) {
          console.error("⚠️  IP Whitelist Issue: Make sure your deployment platform's IP is whitelisted in MongoDB Atlas")
          console.error("⚠️  For Vercel: You may need to whitelist 0.0.0.0/0 (all IPs) in Atlas")
        }
        if (err.message?.includes('authentication')) {
          console.error("⚠️  Authentication Issue: Check your MongoDB username and password")
        }
        throw err
      })
  }

  cached.conn = await cached.promise
  globalForMongoose._mongoose = cached
  return cached.conn
}

// Alias for backward compatibility
export const connectToMongo = connectMongo

export default connectMongo

