import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Spin from '@/lib/models/Spin'

function getStartOfDay() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    await connectDB()
    const { sessionId } = await params
    const phone = _req.nextUrl.searchParams.get('phone') || null
    const startOfDay = getStartOfDay()

    const sessionSpin = await Spin.findOne({
      sessionId,
      spunAt: { $gte: startOfDay },
    })
    if (sessionSpin) {
      return NextResponse.json({ canSpin: false, reason: 'session' })
    }

    if (phone) {
      const phoneSpin = await Spin.findOne({
        phone,
        spunAt: { $gte: startOfDay },
      })
      if (phoneSpin) {
        return NextResponse.json({ canSpin: false, reason: 'phone' })
      }
    }

    return NextResponse.json({ canSpin: true })
  } catch (err) {
    console.error('Error checking spin:', err)
    return NextResponse.json({ error: 'Failed to check spin status' }, { status: 500 })
  }
}
