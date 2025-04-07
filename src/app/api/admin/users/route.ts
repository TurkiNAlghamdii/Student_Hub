import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET to fetch all users
export async function GET() {
  try {
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) throw authError

    // Fetch student profiles for users with student emails
    const studentEmails = authUsers.users
      .filter(user => user.email?.endsWith('@stu.kau.edu.sa'))
      .map(user => user.email)

    let studentProfiles: Record<string, any> = {}
    if (studentEmails.length > 0) {
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('students')
        .select('*')
        .in('email', studentEmails)

      if (!profileError && profiles) {
        studentProfiles = profiles.reduce((acc, profile) => {
          acc[profile.email] = profile
          return acc
        }, {})
      }
    }

    // Combine auth users with their student profiles
    const usersWithProfiles = authUsers.users.map(user => ({
      ...user,
      student_profile: studentProfiles[user.email || ''] || null
    }))

    return NextResponse.json({ users: usersWithProfiles })
  } catch (err) {
    console.error('Error fetching users:', err)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// PUT to update user admin status
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    console.log('PUT request body:', body)
    
    const { userId, isAdmin } = body
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('Updating user admin status:', { userId, isAdmin })

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { app_metadata: { is_admin: isAdmin } }
    )

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Verify the update
    const { data: updatedUser, error: verifyError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (verifyError) {
      console.error('Error verifying update:', verifyError)
    } else {
      console.log('Updated user metadata:', updatedUser.user.app_metadata)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error updating user:', err)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// PATCH to update user status (enable/disable)
export async function PATCH(request: Request) {
  try {
    const { userId, isDisabled } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { is_disabled: isDisabled } }
    )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error updating user:', err)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
} 