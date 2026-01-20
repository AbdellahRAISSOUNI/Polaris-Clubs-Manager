import { NextRequest, NextResponse } from 'next/server'
import { connectToMongo } from '@/lib/mongodb'
import { User } from '@/models/User'

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic'

// GET /api/users?id=xxx - Get user by ID
export async function GET(request: NextRequest) {
  try {
    await connectToMongo()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const role = searchParams.get('role')

    if (id) {
      // Fetch a single user by ID
      const user = await User.findOne({ id }).lean()

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Transform to match expected format
      const transformedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      }

      return NextResponse.json(transformedUser)
    }

    // If role is specified, fetch all users with that role
    if (role) {
      const users = await User.find({ role }).lean()
      const transformedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      }))
      return NextResponse.json(transformedUsers)
    }

    // Fetch all users
    const users = await User.find({}).lean()
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
    }))

    return NextResponse.json(transformedUsers)
  } catch (error: any) {
    console.error('Error in users API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
