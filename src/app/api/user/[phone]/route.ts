import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    await connectDB()
    const { phone } = await params
    const user = await User.findOne({ phone })
    if (!user) {
      return NextResponse.json(null)
    }
    return NextResponse.json(user)
  } catch (err) {
    console.error('Error fetching user:', err)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
