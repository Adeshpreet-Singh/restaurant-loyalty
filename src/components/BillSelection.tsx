'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { getWeightedDiscount, canSpinToday, getJackpotCountThisMonth, getLastPhone } from '@/lib/utils/data'

const DISCOUNTS = [5, 7.5, 10, 12.5, 15, 17, 20, 100]
const SEGMENTS = DISCOUNTS.length
const SEGMENT_ANGLE = 360 / SEGMENTS

const COLORS = [
  '#FF6B35', '#F7C948', '#FF4757', '#2ED573',
  '#5352ED', '#FF6348', '#A855F7', '#E056A0',
]

export default function BillSelection({ userName, onResult, onError }: {
  userName: string
  onResult: (amount: number, discount: number) => void
  onError: (msg: string) => void
}) {
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [jackpotLeft, setJackpotLeft] = useState(4)
  const [billInput, setBillInput] = useState('')
  const wheelRef = useRef<HTMLDivElement>(null)

  const isUnlocked = billInput.length > 0 && parseFloat(billInput) >= 199

  useEffect(() => {
    getJackpotCountThisMonth().then(count => setJackpotLeft(4 - count))
  }, [])

  const handleSpin = useCallback(async () => {
    if (spinning) return

    const amount = parseFloat(billInput)
    if (!amount || amount <= 0) {
      onError?.('Please enter a valid bill amount')
      return
    }
    if (amount < 199) {
      onError?.('Minimum bill amount is ₹199')
      return
    }

    const phone = getLastPhone()
    const canSpin = await canSpinToday(phone || undefined)
    if (!canSpin) {
      onError?.('You already spun today! Come back tomorrow for another chance.')
      return
    }

    setSpinning(true)

    const resultDiscount = await getWeightedDiscount()
    const targetIndex = DISCOUNTS.indexOf(resultDiscount)
    const targetAngle = targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
    const extraSpins = 5 + Math.floor(Math.random() * 3)
    const totalRotation = rotation + extraSpins * 360 + (270 - targetAngle)

    setRotation(totalRotation)

    setTimeout(() => {
      setSpinning(false)
      onResult(amount, resultDiscount)
    }, 4200)
  }, [spinning, rotation, onResult, onError, billInput])

  const size = 260
  const center = size / 2
  const radius = center - 8

  return (
    <div className="screen bill-selection-screen">
      <div className="home-bg-mesh" />
      <div className="welcome-top-glow" />

      <div className="screen-content">
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-icon">☕</span>
            <span className="topbar-brand">Brewbakes</span>
          </div>
          {userName && (
            <div className="topbar-right">
              <span className="topbar-avatar">{userName.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </header>

        <div className="bill-input-section">
          <div className="bill-input-wrapper">
            <span className="bill-input-symbol">₹</span>
            <input
              type="number"
              className="bill-input-field"
              placeholder="Enter bill amount"
              value={billInput}
              onChange={(e) => setBillInput(e.target.value)}
            disabled={spinning}
            min="199"
          />
          </div>
          <button
            className={`btn-spin ${spinning ? 'spinning' : ''}`}
            onClick={handleSpin}
            disabled={spinning || !billInput}
          >
            {spinning ? 'Spinning...' : '🎰 Spin the Wheel'}
          </button>
        </div>

        <div className="home-hero-card">
          <div className="hero-card-bg-shimmer" />
          <div className="hero-card-content">
            <div className="hero-card-title-row">
              <span className="hero-sparkle">✦</span>
              <h2 className="hero-card-title">Spin &amp; Win</h2>
              <span className="hero-sparkle">✦</span>
            </div>
            <p className="hero-card-sub">
              Try your luck — win up to <strong>100% off</strong>
              {jackpotLeft > 0 && <span className="jackpot-left"> ({jackpotLeft} left this month)</span>}
            </p>

            <div className="wheel-hero">
              <div className="wheel-glow-ring" />
              <div className="wheel-container">
                <div className="wheel-pointer">▼</div>
                <div
                  className={`wheel-wrapper ${isUnlocked ? '' : 'wheel-locked'}`}
                  ref={wheelRef}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning
                      ? 'transform 4.2s cubic-bezier(0.17, 0.67, 0.12, 0.99), filter 0.6s ease, opacity 0.6s ease'
                      : 'filter 0.6s ease, opacity 0.6s ease',
                  }}
                >
                  <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%">
                    {DISCOUNTS.map((disc, i) => {
                      const startAngle = (i * SEGMENT_ANGLE * Math.PI) / 180
                      const endAngle = ((i + 1) * SEGMENT_ANGLE * Math.PI) / 180
                      const x1 = center + radius * Math.cos(startAngle)
                      const y1 = center + radius * Math.sin(startAngle)
                      const x2 = center + radius * Math.cos(endAngle)
                      const y2 = center + radius * Math.sin(endAngle)
                      const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0
                      const midAngle = ((i + 0.5) * SEGMENT_ANGLE * Math.PI) / 180
                      const textRadius = radius * 0.62
                      const tx = center + textRadius * Math.cos(midAngle)
                      const ty = center + textRadius * Math.sin(midAngle)
                      const textRotation = (i + 0.5) * SEGMENT_ANGLE

                      return (
                        <g key={i}>
                          <path
                            d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={COLORS[i]}
                            stroke="#1a1a2e"
                            strokeWidth="2"
                          />
                          <text
                            x={tx}
                            y={ty}
                            fill="white"
                            fontSize={disc === 100 ? '13' : '15'}
                            fontWeight="700"
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${textRotation}, ${tx}, ${ty})`}
                            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                          >
                            {disc}%
                          </text>
                        </g>
                      )
                    })}
                    <circle cx={center} cy={center} r="26" fill="#1a1a2e" stroke="#F7C948" strokeWidth="3" />
                    <text x={center} y={center} fill="#F7C948" fontSize="10" fontWeight="700" textAnchor="middle" dominantBaseline="central">
                      SPIN
                    </text>
                  </svg>
                </div>
                {!isUnlocked && !spinning && (
                  <div className="wheel-lock-overlay">
                    <span className="lock-icon">🔒</span>
                    <span className="lock-text">Enter bill amount to unlock</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="screen-footer">
          Brewbakes Courtyard • Loyalty Rewards
        </p>
      </div>
    </div>
  )
}
