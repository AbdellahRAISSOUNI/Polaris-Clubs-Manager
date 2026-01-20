import { NextResponse } from "next/server"
import { connectMongo } from "@/lib/mongodb"

export async function GET() {
  try {
    // Check if env vars are set (for debugging)
    const mongoUri = process.env.MONGODB_URI || ""
    const mongoDb = process.env.MONGODB_DB || "Atlas-Club-Manager"
    
    const uriPreview = mongoUri 
      ? `${mongoUri.substring(0, 20)}...${mongoUri.substring(mongoUri.length - 10)}` 
      : "(not set)"

    const conn = await connectMongo()
    const state = conn.connection.readyState // 1 = connected

    return NextResponse.json({
      ok: state === 1,
      readyState: state,
      host: conn.connection.host,
      name: conn.connection.name,
      uriPreview: uriPreview,
      dbName: mongoDb,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    const mongoUri = process.env.MONGODB_URI || ""
    
    return NextResponse.json({ 
      ok: false, 
      error: message,
      uriSet: !!mongoUri,
      uriPreview: mongoUri ? `${mongoUri.substring(0, 20)}...` : "(not set)",
      hint: !mongoUri ? "Make sure MONGODB_URI is set in your .env.local file" : undefined
    }, { status: 500 })
  }
}

