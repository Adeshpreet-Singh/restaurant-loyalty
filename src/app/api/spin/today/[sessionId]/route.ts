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
    const startOfDay = getStartOfDay()

    const spin = await Spin.findOne({
      sessionId,
      spunAt: { $gte: startOfDay },
    })

    return NextResponse.json(spin)
  } catch (err) {
    console.error('Error fetching spin:', err)
    return NextResponse.json({ error: 'Failed to fetch spin' }, { status: 500 })
  }
}
