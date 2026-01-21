import { NextRequest, NextResponse } from "next/server"
import { connectMongo } from "@/lib/mongodb"
import { TimePeriod, type TimePeriodType } from "@/models/TimePeriod"

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

async function hasOverlap(type: TimePeriodType, start: Date, end: Date, excludeId: string) {
  const existing = await TimePeriod.findOne({
    type,
    id: { $ne: excludeId },
    start_date: { $lte: end },
    end_date: { $gte: start },
  })
    .select("id name start_date end_date")
    .lean()
  return existing
}

// PUT /api/time-periods/[id] (admin only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized

  try {
    await connectMongo()
    const id = params.id
    const body = await request.json()

    const existing = await TimePeriod.findOne({ id }).lean()
    if (!existing) {
      return NextResponse.json({ error: "Time period not found" }, { status: 404 })
    }

    const update: any = {}

    if (body.name !== undefined) {
      const name = String(body.name || "").trim()
      if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
      update.name = name
    }

    // type is not editable to keep history stable

    const startRaw = body.start_date !== undefined ? toDate(body.start_date) : null
    const endRaw = body.end_date !== undefined ? toDate(body.end_date) : null

    // Compute final start/end for validation if either provided
    const finalStart = startRaw ? normalizeStart(startRaw) : new Date(existing.start_date)
    const finalEnd = endRaw ? normalizeEnd(endRaw) : new Date(existing.end_date)

    if (body.start_date !== undefined && !startRaw) {
      return NextResponse.json({ error: "Invalid start_date" }, { status: 400 })
    }
    if (body.end_date !== undefined && !endRaw) {
      return NextResponse.json({ error: "Invalid end_date" }, { status: 400 })
    }

    if (finalEnd <= finalStart) {
      return NextResponse.json({ error: "end_date must be after start_date" }, { status: 400 })
    }

    const existingType = existing.type as TimePeriodType
    if (existingType === "academicYear") {
      const overlap = await hasOverlap(existingType, finalStart, finalEnd, id)
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

    if (body.start_date !== undefined) update.start_date = finalStart
    if (body.end_date !== undefined) update.end_date = finalEnd
    update.updated_at = new Date()

    const updated = await TimePeriod.findOneAndUpdate({ id }, { $set: update }, { new: true }).lean()

    return NextResponse.json({
      id: updated?.id,
      type: updated?.type,
      name: updated?.name,
      start_date: updated?.start_date ? new Date(updated.start_date).toISOString() : null,
      end_date: updated?.end_date ? new Date(updated.end_date).toISOString() : null,
      created_at: updated?.created_at ? new Date(updated.created_at).toISOString() : null,
      updated_at: updated?.updated_at ? new Date(updated.updated_at).toISOString() : null,
    })
  } catch (error: any) {
    console.error("Error updating time period:", error)
    return NextResponse.json({ error: error.message || "Failed to update time period" }, { status: 500 })
  }
}

// DELETE /api/time-periods/[id] (admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireAdmin(request)
  if (unauthorized) return unauthorized

  try {
    await connectMongo()
    const id = params.id

    const deleted = await TimePeriod.findOneAndDelete({ id }).lean()
    if (!deleted) {
      return NextResponse.json({ error: "Time period not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting time period:", error)
    return NextResponse.json({ error: error.message || "Failed to delete time period" }, { status: 500 })
  }
}

