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
    const { sessionId, phone } = await req.json()
    if (!sessionId || !phone) {
      return NextResponse.json({ error: 'sessionId and phone required' }, { status: 400 })
    }

    const startOfDay = getStartOfDay()

    const phoneAlreadyUsed = await Spin.findOne({
      phone,
      redeemed: true,
      spunAt: { $gte: startOfDay },
    })
    if (phoneAlreadyUsed) {
      return NextResponse.json({
        error: 'Phone already used today',
        spin: phoneAlreadyUsed,
      }, { status: 409 })
    }

    const spin = await Spin.findOne({
      sessionId,
      spunAt: { $gte: startOfDay },
    })
    if (!spin) {
      return NextResponse.json({ error: 'No spin found for this session' }, { status: 404 })
    }

    spin.phone = phone
    spin.redeemed = true
    await spin.save()

    return NextResponse.json({ success: true, spin })
  } catch (err) {
    console.error('Error redeeming spin:', err)
    return NextResponse.json({ error: 'Failed to redeem spin' }, { status: 500 })
  }
}
