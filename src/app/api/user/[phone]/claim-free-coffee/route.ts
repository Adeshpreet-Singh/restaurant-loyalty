import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    await connectDB()
    const { phone } = await params

    const user = await User.findOneAndUpdate(
      { phone },
      { $set: { freeCoffeePending: false } },
      { new: true }
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, user })
  } catch (err) {
    console.error('Error claiming free coffee:', err)
    return NextResponse.json({ error: 'Failed to claim free coffee' }, { status: 500 })
  }
}
