import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import JackpotLog from '@/lib/models/JackpotLog'

function getThisMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export async function GET(_req: NextRequest) {
  try {
    await connectDB()
    const monthKey = getThisMonthKey()
    const count = await JackpotLog.countDocuments({ month: monthKey })
    return NextResponse.json({ count, month: monthKey, max: 4 })
  } catch (err) {
    console.error('Error counting jackpots:', err)
    return NextResponse.json({ error: 'Failed to count jackpots' }, { status: 500 })
  }
}
