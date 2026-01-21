import { NextRequest, NextResponse } from "next/server"
import { connectMongo } from "@/lib/mongodb"
import { TimePeriod, type TimePeriodType } from "@/models/TimePeriod"
import { randomUUID } from "crypto"

export const dynamic = "force-dynamic"

function requireAdmin(request: NextRequest) {
  const userType = request.headers.get("x-user-type")
  if (userType !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(d.getTime()) ? null : d
}

function normalizeStart(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function normalizeEnd(date: Date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

async function hasOverlap(type: TimePeriodType, start: Date, end: Date, excludeId?: string) {
  const query: any = {
    type,
    start_date: { $lte: end },
    end_date: { $gte: start },
  }
  if (excludeId) query.id = { $ne: excludeId }
  const existing = await TimePeriod.findOne(query).select("id name start_date end_date").lean()
  return existing
}

// GET /api/time-periods?type=mandate|academicYear
export async function GET(request: NextRequest) {
  try {
    await connectMongo()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") as TimePeriodType | null

    const query: any = {}
    if (type) query.type = type

    const periods = await TimePeriod.find(query).sort({ start_date: -1 }).lean()

    const transformed = periods.map((p: any) => ({
      id: p.id,
      type: p.type,
      name: p.name,
      start_date: p.start_date ? new Date(p.start_date).toISOString() : null,
      end_date: p.end_date ? new Date(p.end_date).toISOString() : null,
      created_at: p.created_at ? new Date(p.created_at).toISOString() : null,
      updated_at: p.updated_at ? new Date(p.updated_at).toISOString() : null,
    }))

    return NextResponse.json(transformed)
  } catch (error: any) {
    console.error("Error fetching time periods:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch time periods" }, { status: 500 })
  }
}

// POST /api/time-periods (admin only)
export async function POST(request: NextRequest) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized

  try {
    await connectMongo()
    const body = await request.json()

    const type = body.type as TimePeriodType
    const name = String(body.name || "").trim()
    const startRaw = toDate(body.start_date)
    const endRaw = toDate(body.end_date)

    if (!type || !["mandate", "academicYear"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!startRaw || !endRaw) {
      return NextResponse.json({ error: "start_date and end_date are required" }, { status: 400 })
    }

    const start_date = normalizeStart(startRaw)
    const end_date = normalizeEnd(endRaw)

    if (end_date <= start_date) {
      return NextResponse.json({ error: "end_date must be after start_date" }, { status: 400 })
    }

    // Academic years should not overlap to keep "current/previous" unambiguous.
    // Mandates are allowed to overlap because they're used as flexible search filters.
    if (type === "academicYear") {
      const overlap = await hasOverlap(type, start_date, end_date)
      if (overlap) {
        return NextResponse.json(
          {
            error: `Overlaps with existing academic year "${overlap.name}" (${overlap.id}) [${new Date(
              overlap.start_date
            ).toLocaleDateString()} → ${new Date(overlap.end_date).toLocaleDateString()}]. Academic years cannot overlap.`,
          },
          { status: 400 }
        )
      }
    }

    const period = await TimePeriod.create({
      id: randomUUID(),
      type,
      name,
      start_date,
      end_date,
      created_at: new Date(),
      updated_at: new Date(),
    })

    return NextResponse.json(
      {
        id: period.id,
        type: period.type,
        name: period.name,
        start_date: new Date(period.start_date).toISOString(),
        end_date: new Date(period.end_date).toISOString(),
        created_at: period.created_at ? new Date(period.created_at).toISOString() : null,
        updated_at: period.updated_at ? new Date(period.updated_at).toISOString() : null,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating time period:", error)
    return NextResponse.json({ error: error.message || "Failed to create time period" }, { status: 500 })
  }
}

