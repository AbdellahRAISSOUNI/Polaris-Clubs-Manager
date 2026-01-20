import { NextRequest, NextResponse } from 'next/server'
import { connectMongo } from '@/lib/mongodb'
import { User } from '@/models/User'
import { Club } from '@/models/Club'

// POST /api/auth/login - Handle login for both admin and club users
export async function POST(request: NextRequest) {
  try {
    await connectMongo()

    const body = await request.json()
    const { email, password, userType } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (userType === 'admin') {
      // Admin login - check users table
      const user = await User.findOne({ 
        email: email.toLowerCase().trim(),
        role: 'admin'
      }).lean()

      if (user) {
        // Verify password (in a real app, you'd use proper password hashing)
        if (user.password !== password) {
          return NextResponse.json(
            { error: 'Invalid password. Please try again.' },
            { status: 401 }
          )
        }

        // Update last login time if the field exists
        await User.findOneAndUpdate(
          { id: user.id },
          { $set: { last_login: new Date() } }
        )

        return NextResponse.json({
          id: user.id,
          name: user.name || 'Admin',
          email: user.email,
          role: 'admin',
          avatar_url: user.avatar_url,
        })
      }

      // Fallback to demo users if not found in database
      const demoAdmins = [
        {
          id: "demo-admin-1",
          name: "Admin User",
          email: "admin@example.com",
          password: "admin123",
          role: "admin",
        },
      ]

      const demoAdmin = demoAdmins.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim()
      )

      if (demoAdmin && demoAdmin.password === password) {
        return NextResponse.json({
          id: demoAdmin.id,
          name: demoAdmin.name,
          email: demoAdmin.email,
          role: 'admin',
        })
      }

      return NextResponse.json(
        { error: 'Admin account not found. Please check your email and try again.' },
        { status: 404 }
      )
    } else {
      // Club login - check clubs table
      const club = await Club.findOne({ 
        email: email.toLowerCase().trim(),
        status: 'active'
      }).lean()

      if (club) {
        // Verify password
        if (club.password !== password) {
          return NextResponse.json(
            { error: 'Invalid password. Please try again.' },
            { status: 401 }
          )
        }

        // Update last login time
        await Club.findOneAndUpdate(
          { id: club.id },
          { $set: { last_login: new Date() } }
        )

        return NextResponse.json({
          id: club.id,
          name: club.name,
          email: club.email,
          role: 'club',
          logo: club.logo,
        })
      }

      return NextResponse.json(
        { error: 'Club not found or inactive. Please contact an administrator.' },
        { status: 404 }
      )
    }
  } catch (error: any) {
    console.error('Error in login API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process login' },
      { status: 500 }
    )
  }
}
