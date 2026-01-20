import { NextRequest, NextResponse } from 'next/server'
import { connectToMongo } from '@/lib/mongodb'
import { User } from '@/models/User'

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToMongo()

    const id = params.id
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url
    if (body.password !== undefined) updateData.password = body.password

    const result = await User.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true }
    )

    if (!result) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const transformedUser = {
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role,
      avatar_url: result.avatar_url,
    }

    return NextResponse.json(transformedUser)
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}
