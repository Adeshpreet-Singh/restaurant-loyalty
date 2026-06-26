import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

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

    // Only award loyalty point for phone task, and only if not already completed
    if (task === 'phone' && !alreadyCompleted) {
      const currentMonth = getCurrentMonth()
      let monthlyStamps = user.loyaltyPoints || 0

      // Reset if month changed
      if (user.lastStampMonth !== currentMonth) {
        monthlyStamps = 0
      }

      let freeCoffeeEarned = false

      if (monthlyStamps < 4) {
        monthlyStamps += 1
      } else if (monthlyStamps === 4) {
        freeCoffeeEarned = true
        monthlyStamps = 0
      }

      const updateOps: Record<string, unknown> = {
        $set: {
          [field]: true,
          loyaltyPoints: monthlyStamps,
          lastStampMonth: currentMonth,
        },
      }

      if (freeCoffeeEarned) {
        updateOps.$inc = { totalFreeCoffees: 1 }
      }

      const updated = await User.findOneAndUpdate(
        { phone },
        updateOps,
        { new: true }
      )

      return NextResponse.json({
        user: updated,
        loyaltyIncreased: true,
        monthlyStamps,
        freeCoffeeEarned,
      })
    }

    // For instagram/review tasks or already completed phone task
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
