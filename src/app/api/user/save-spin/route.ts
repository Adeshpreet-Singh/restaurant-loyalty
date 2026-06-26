import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Spin from '@/lib/models/Spin'

function getStartOfDay() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { phone, sessionId } = await req.json()

    if (!phone || !sessionId) {
      return NextResponse.json({ error: 'phone and sessionId are required' }, { status: 400 })
    }

    const startOfDay = getStartOfDay()

    const existingRedeemed = await Spin.findOne({
      phone,
      redeemed: true,
      spunAt: { $gte: startOfDay },
    })
    if (existingRedeemed) {
      return NextResponse.json({
        error: 'Phone already used today',
        spin: existingRedeemed,
      }, { status: 409 })
    }

    const spin = await Spin.findOne({
      sessionId,
      spunAt: { $gte: startOfDay },
    })
    if (!spin) {
      return NextResponse.json({ error: 'No spin found for this session' }, { status: 404 })
    }

    const { discount, billAmount, promoCode } = spin
    const discountAmount = (billAmount * discount) / 100
    const finalAmount = (billAmount - discountAmount).toFixed(2)

    const visit = {
      date: new Date(),
      bill: billAmount,
      discount,
      finalAmount,
      promoCode,
    }

    const user = await User.findOneAndUpdate(
      { phone },
      {
        $setOnInsert: {
          phone,
          createdAt: new Date(),
          completedTasks: { phone: false, instagram: false, review: false },
        },
        $set: { lastSpinDate: new Date() },
        $inc: { totalVisits: 1 },
        $push: { visitHistory: visit },
      },
      { new: true, upsert: true }
    )

    spin.phone = phone
    spin.redeemed = true
    await spin.save()

    return NextResponse.json(user)
  } catch (err) {
    console.error('Error saving spin result:', err)
    return NextResponse.json({ error: 'Failed to save spin result' }, { status: 500 })
  }
}
