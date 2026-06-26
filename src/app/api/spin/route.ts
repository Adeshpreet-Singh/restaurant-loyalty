import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Spin from '@/lib/models/Spin'

function getStartOfDay() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { sessionId, discount, billAmount, promoCode } = await req.json()
    if (!sessionId || discount == null || !billAmount || !promoCode) {
      return NextResponse.json({ error: 'sessionId, discount, billAmount, promoCode required' }, { status: 400 })
    }

    const startOfDay = getStartOfDay()
    const existing = await Spin.findOne({
      sessionId,
      spunAt: { $gte: startOfDay },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already spun today', spin: existing }, { status: 409 })
    }

    const spin = await Spin.create({ sessionId, discount, billAmount, promoCode })
    return NextResponse.json({ success: true, spin })
  } catch (err) {
    console.error('Error recording spin:', err)
    return NextResponse.json({ error: 'Failed to record spin' }, { status: 500 })
  }
}
