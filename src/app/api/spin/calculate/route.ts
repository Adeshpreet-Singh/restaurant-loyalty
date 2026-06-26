import { NextRequest, NextResponse } from 'next/server'

function getTier(billAmount: number) {
  if (billAmount >= 1000) return 'high' as const
  if (billAmount >= 600) return 'mid' as const
  if (billAmount >= 300) return 'low' as const
  return 'base' as const
}

const TIER_TABLES = {
  base: [
    { discount: 10, weight: 100 },
  ],
  low: [  // ₹300-600 → 10%-20% (60% lower, 40% higher)
    { discount: 10,  weight: 20 },
    { discount: 12.5, weight: 20 },
    { discount: 15,  weight: 20 },
    { discount: 17,  weight: 20 },
    { discount: 20,  weight: 20 },
  ],
  mid: [  // ₹600-1000 → 5%-15% (50:50)
    { discount: 5,   weight: 17 },
    { discount: 7.5, weight: 17 },
    { discount: 10,  weight: 33 },
    { discount: 12.5, weight: 16 },
    { discount: 15,  weight: 17 },
  ],
  high: [  // ₹1000+ → fixed 10% + freebie
    { discount: 10, weight: 100 },
  ],
}

function pickDiscount(tier: 'base' | 'low' | 'mid' | 'high') {
  const table = TIER_TABLES[tier]
  const total = table.reduce((sum, e) => sum + e.weight, 0)
  let rand = Math.random() * total
  for (const entry of table) {
    rand -= entry.weight
    if (rand <= 0) return entry.discount
  }
  return table[0].discount
}

export async function POST(req: NextRequest) {
  try {
    const { billAmount } = await req.json()

    if (!billAmount || billAmount <= 0) {
      return NextResponse.json({ error: 'Valid billAmount required' }, { status: 400 })
    }

    const tier = getTier(billAmount)
    const discount = pickDiscount(tier)

    const result: { discount: number; freebie?: { name: string; value: number } } = { discount }

    if (tier === 'high') {
      result.freebie = { name: 'Mini Sundae', value: 130 }
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Error calculating discount:', err)
    return NextResponse.json({ error: 'Failed to calculate discount' }, { status: 500 })
  }
}
