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
    const update: Record<string, unknown> = { $set: { [field]: true } }
    if (!alreadyCompleted && task === 'phone') {
      update.$inc = { loyaltyPoints: 1 }
    }

    const updated = await User.findOneAndUpdate(
      { phone },
      update,
      { new: true }
    )

    return NextResponse.json({
      user: updated,
      loyaltyIncreased: !alreadyCompleted,
    })
  } catch (err) {
    console.error('Error completing task:', err)
    return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 })
  }
}
