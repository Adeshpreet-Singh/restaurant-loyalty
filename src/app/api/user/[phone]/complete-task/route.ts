import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    await connectDB()
    const { phone } = await params
    const { task } = await req.json()

    if (!['phone', 'instagram', 'review'].includes(task)) {
      return NextResponse.json({ error: 'Invalid task. Must be phone, instagram, or review' }, { status: 400 })
    }

    const field = `completedTasks.${task}`

    const user = await User.findOne({ phone })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const alreadyCompleted = user.completedTasks?.[task as keyof typeof user.completedTasks]

    // Just mark task as completed — stamps are only awarded by save-spin
    const updated = await User.findOneAndUpdate(
      { phone },
      { $set: { [field]: true } },
      { new: true }
    )

    return NextResponse.json({
      user: updated,
      loyaltyIncreased: false,
    })
  } catch (err) {
    console.error('Error completing task:', err)
    return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 })
  }
}
