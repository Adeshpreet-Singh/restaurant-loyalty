import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Spin from '@/lib/models/Spin'

function getStartOfDay() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
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

    const currentMonth = getCurrentMonth()

    // Find existing user to check monthly stamp state
    let existingUser = await User.findOne({ phone })
    if (!existingUser) {
      existingUser = await User.create({
        phone,
        createdAt: new Date(),
        completedTasks: { phone: false, instagram: false, review: false },
        loyaltyPoints: 0,
        totalVisits: 0,
        totalFreeCoffees: 0,
        lastStampMonth: currentMonth,
      })
    }

    // Check if month changed — reset monthly stamps
    let monthlyStamps = existingUser.loyaltyPoints || 0
    if (existingUser.lastStampMonth !== currentMonth) {
      monthlyStamps = 0
    }

    let freeCoffeeEarned = false

    // Award stamp or free coffee
    if (monthlyStamps < 4) {
      // Stamps 1-4: just increment
      monthlyStamps += 1
    } else if (monthlyStamps === 4) {
      // 5th visit: free coffee!
      freeCoffeeEarned = true
      monthlyStamps = 0
    }

    const updateOps: Record<string, unknown> = {
      $set: {
        lastSpinDate: new Date(),
        lastStampMonth: currentMonth,
        loyaltyPoints: monthlyStamps,
      },
      $inc: { totalVisits: 1 },
      $push: { visitHistory: visit },
    }

    if (freeCoffeeEarned) {
      updateOps.$inc = { totalFreeCoffees: 1 }
    }

    const user = await User.findOneAndUpdate(
      { phone },
      updateOps,
      { new: true, upsert: true }
    )

    spin.phone = phone
    spin.redeemed = true
    await spin.save()

    // Attach computed fields for the frontend
    const result = JSON.parse(JSON.stringify(user))
    result.monthlyStamps = monthlyStamps
    result.freeCoffeeEarned = freeCoffeeEarned

    return NextResponse.json(result)
  } catch (err) {
    console.error('Error saving spin result:', err)
    return NextResponse.json({ error: 'Failed to save spin result' }, { status: 500 })
  }
}
