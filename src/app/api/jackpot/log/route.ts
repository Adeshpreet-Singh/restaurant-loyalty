import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import JackpotLog from '@/lib/models/JackpotLog'

function getThisMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { phone } = await req.json()
    const entry = await JackpotLog.create({
      month: getThisMonthKey(),
      date: new Date(),
      phone: phone || null,
    })
    return NextResponse.json({ success: true, entry })
  } catch (err) {
    console.error('Error logging jackpot:', err)
    return NextResponse.json({ error: 'Failed to log jackpot' }, { status: 500 })
  }
}
