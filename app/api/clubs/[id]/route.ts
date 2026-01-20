import { NextRequest, NextResponse } from 'next/server'
import { connectMongo } from '@/lib/mongodb'
import { Club } from '@/models/Club'

// PUT /api/clubs/[id] - Update club
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongo()
    const id = params.id
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Club ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.email !== undefined) updateData.email = body.email
    if (body.status !== undefined) updateData.status = body.status
    if (body.members !== undefined) updateData.members = body.members
    if (body.logo !== undefined) updateData.logo = body.logo
    if (body.password !== undefined) updateData.password = body.password
    if (body.last_login !== undefined) updateData.last_login = body.last_login

    const result = await Club.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true }
    )

    if (!result) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      )
    }

    const transformedClub = {
      id: result.id,
      name: result.name,
      description: result.description,
      email: result.email,
      logo: result.logo || '/clubs/default.jpg',
      members: result.members || 0,
      status: result.status || 'active',
      last_login: result.last_login ? new Date(result.last_login).toISOString() : null,
      created_at: result.created_at ? new Date(result.created_at).toISOString() : new Date().toISOString(),
    }

    return NextResponse.json(transformedClub)
  } catch (error: any) {
    console.error('Error updating club:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update club' },
      { status: 500 }
    )
  }
}

// DELETE /api/clubs/[id] - Delete club
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectMongo()
    const id = params.id

    if (!id) {
      return NextResponse.json(
        { error: 'Club ID is required' },
        { status: 400 }
      )
    }

    const result = await Club.findOneAndDelete({ id })

    if (!result) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Club deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting club:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete club' },
      { status: 500 }
    )
  }
}
