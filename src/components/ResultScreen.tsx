'use client'

import { useState, useEffect } from 'react'
import { getLastPhone, getUser, completeTask } from '@/lib/utils/data'

const INSTAGRAM_URL = 'https://www.instagram.com/brewbakes_courtyard_kharar/'
const GOOGLE_REVIEW_URL = 'https://www.google.com/search?hl=en-IN&gl=in&q=Brewbakes+Courtyard+%7C+Best+Multicuisine+Restaurant+in+Kharar+%7C+Best+Cafe+Kharar,+Sbp+city+sqaure+(City+of+dreams,+SCF+3B,+Landran+Rd,+Sante+Majra,+Kharar,+Sahibzada+Ajit+Singh+Nagar,+Punjab+140301&ludocid=17561637694977643097&lsig=AB86z5U-7J68ljxSxdiFUmEW5qyL#lrd=0x390fef7b3bfd774d:0xf3b7787023409259,3'

function isToday(dateStr: string | Date) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate()
}

export default function ResultScreen({
  discount,
  billAmount,
  promoCode,
  onSaved,
  onViewLoyalty,
}: {
  discount: number
  billAmount: number
  promoCode: string
  onSaved: (phone: string) => Promise<unknown>
  onViewLoyalty: () => void
}) {
  const [animate, setAnimate] = useState(false)
  const [alreadyUsedToday, setAlreadyUsedToday] = useState(false)

  const [phoneInput, setPhoneInput] = useState(getLastPhone())
  const [phoneDone, setPhoneDone] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [igDone, setIgDone] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)

  const [codeRevealed, setCodeRevealed] = useState(false)
  const [savedData, setSavedData] = useState<Record<string, unknown> | null>(null)
  const [existingPromoCode, setExistingPromoCode] = useState<string | null>(null)

  const tasksCompleted = [phoneDone, igDone, reviewDone].filter(Boolean).length
  const allDone = phoneDone && igDone && reviewDone
  const displayPromoCode = existingPromoCode || promoCode

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100)
  }, [])

  useEffect(() => {
    const phone = getLastPhone()
    if (!phone) return

    getUser(phone).then(async (user: Record<string, unknown> | null) => {
      if (!user) return

      const lastSpinDate = user.lastSpinDate as string | undefined
      if (lastSpinDate && isToday(lastSpinDate)) {
        setAlreadyUsedToday(true)
        setCodeRevealed(true)
        setPhoneDone(true)
        setSavedData(user)
        setPhoneInput(phone)
        const visitHistory = user.visitHistory as Array<{ date: string; promoCode?: string }> | undefined
        const todayVisit = visitHistory?.find(v => isToday(v.date))
        if (todayVisit?.promoCode) {
          setExistingPromoCode(todayVisit.promoCode)
        }
        const tasks = user.completedTasks as { instagram?: boolean; review?: boolean } | undefined
        if (tasks?.instagram) setIgDone(true)
        if (tasks?.review) setReviewDone(true)
        return
      }

      try {
        const updated = await onSaved(phone) as Record<string, unknown>
        setSavedData(updated)
        setPhoneDone(true)
        setPhoneInput(phone)

        const tasks = updated.completedTasks as { instagram?: boolean; review?: boolean } | undefined
        if (tasks?.instagram) setIgDone(true)
        if (tasks?.review) setReviewDone(true)

        if (tasks?.instagram && tasks?.review) {
          setCodeRevealed(true)
        }
      } catch {
        setAlreadyUsedToday(true)
        setCodeRevealed(true)
        setPhoneDone(true)
        setSavedData(user)
        const visitHistory = user.visitHistory as Array<{ date: string; promoCode?: string }> | undefined
        const todayVisit = visitHistory?.find(v => isToday(v.date))
        if (todayVisit?.promoCode) {
          setExistingPromoCode(todayVisit.promoCode)
        }
      }
    }).catch(() => {})
  }, [onSaved])

  useEffect(() => {
    if (allDone && !codeRevealed && !alreadyUsedToday) {
      setTimeout(() => setCodeRevealed(true), 600)
    }
  }, [allDone, codeRevealed, alreadyUsedToday])

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (phoneInput.length !== 10) {
      setPhoneError('Enter a valid 10-digit number')
      return
    }
    setPhoneError('')

    try {
      const data = await onSaved(phoneInput) as Record<string, unknown>
      setSavedData(data)
      setPhoneDone(true)

      await completeTask(phoneInput, 'phone')

      const tasks = data?.completedTasks as { instagram?: boolean; review?: boolean } | undefined
      if (tasks?.instagram) setIgDone(true)
      if (tasks?.review) setReviewDone(true)
    } catch (err: unknown) {
      const error = err as { status?: number; body?: { spin?: { promoCode?: string } } }
      if (error.status === 409) {
        if (error.body?.spin?.promoCode) {
          setExistingPromoCode(error.body.spin.promoCode)
        }
        setAlreadyUsedToday(true)
        setCodeRevealed(true)
        const user = await getUser(phoneInput).catch(() => null)
        if (user) {
          setSavedData(user)
          setPhoneDone(true)
        }
      } else {
        setPhoneError('Something went wrong. Please try again.')
      }
    }
  }

  async function handleInstagram() {
    window.open(INSTAGRAM_URL, '_blank')
    setTimeout(async () => {
      setIgDone(true)
      await completeTask(phoneInput, 'instagram')
    }, 2500)
  }

  async function handleGoogleReview() {
    window.open(GOOGLE_REVIEW_URL, '_blank')
    setTimeout(async () => {
      setReviewDone(true)
      await completeTask(phoneInput, 'review')
    }, 2500)
  }

  const discountAmount = (billAmount * discount) / 100
  const finalAmount = billAmount - discountAmount
  const loyaltyPoints = (savedData?.loyaltyPoints as number) || 0
  const pointsInCycle = loyaltyPoints % 5
  const freeCoffeeEarned = loyaltyPoints > 0 && loyaltyPoints % 5 === 0

  if (alreadyUsedToday) {
    return (
      <div className="screen result-screen">
        <div className="screen-content">
          <header className="topbar">
            <div className="topbar-left">
              <span className="topbar-icon">☕</span>
              <span className="topbar-brand">Brewbakes</span>
            </div>
          </header>

          <div className={`result-content ${animate ? 'result-animate' : ''}`}>
            <div className="result-badge">
              <div className="badge-inner">
                <span className="badge-emoji">⏰</span>
                <span className="badge-text">ALREADY USED</span>
              </div>
            </div>

            <div className="result-discount">
              <span className="discount-value">{discount}%</span>
              <span className="discount-label">DISCOUNT</span>
            </div>

            <div className="result-breakdown">
              <div className="breakdown-row">
                <span>Original Bill</span>
                <span className="line-through">₹{billAmount.toFixed(2)}</span>
              </div>
              <div className="breakdown-row discount-row">
                <span>Discount ({discount}%)</span>
                <span className="discount-amount">-₹{discountAmount.toFixed(2)}</span>
              </div>
              <div className="breakdown-divider" />
              <div className="breakdown-row final-row">
                <span>You Pay</span>
                <span className="final-amount">₹{finalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="promo-section">
              <h3 className="promo-title">🎁 Your Promo Code</h3>
              <div className="promo-code-box revealed">
                <span className="promo-code-text">{displayPromoCode || '· · · · · ·'}</span>
              </div>
              <p className="promo-revealed-text">
                ✅ Show this code at the counter to avail your discount!
              </p>
            </div>

            <div className="already-used-banner">
              <span className="already-used-icon">⏳</span>
              <div>
                <strong>Coupon already used today</strong>
                <p>Come back tomorrow for a new spin!</p>
              </div>
            </div>

            {loyaltyPoints > 0 && (
              <div className="stamp-display">
                <span className="stamp-label">Loyalty Progress</span>
                <div className="stamp-dots">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`stamp-dot ${i < (freeCoffeeEarned ? 5 : pointsInCycle) ? 'filled' : ''}`}
                    >
                      {i < (freeCoffeeEarned ? 5 : pointsInCycle) ? '⭐' : '○'}
                    </span>
                  ))}
                </div>
                <span className="stamp-count">
                  {pointsInCycle === 0 && loyaltyPoints > 0 ? 5 : pointsInCycle} / 5 for free coffee
                  {freeCoffeeEarned && ' — FREE COFFEE EARNED!'}
                </span>
              </div>
            )}

            <div className="result-buttons">
              <button className="btn-secondary" onClick={onViewLoyalty}>
                🎫 My Loyalty Card
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen result-screen">
      <div className="confetti-container">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`confetti confetti-${i % 5}`} />
        ))}
      </div>

      <div className="screen-content">
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-icon">☕</span>
            <span className="topbar-brand">Brewbakes</span>
          </div>
        </header>

        <div className={`result-content ${animate ? 'result-animate' : ''}`}>
          <div className="result-badge">
            <div className="badge-inner">
              <span className="badge-emoji">🎉</span>
              <span className="badge-text">YOU WON</span>
            </div>
          </div>

          <div className="result-discount">
            <span className="discount-value">{discount}%</span>
            <span className="discount-label">DISCOUNT</span>
          </div>

          <div className="result-breakdown">
            <div className="breakdown-row">
              <span>Original Bill</span>
              <span className="line-through">₹{billAmount.toFixed(2)}</span>
            </div>
            <div className="breakdown-row discount-row">
              <span>Discount ({discount}%)</span>
              <span className="discount-amount">-₹{discountAmount.toFixed(2)}</span>
            </div>
            <div className="breakdown-divider" />
            <div className="breakdown-row final-row">
              <span>You Pay</span>
              <span className="final-amount">₹{finalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="promo-section">
            <h3 className="promo-title">🎁 Your Promo Code</h3>

            <div className={`promo-code-box ${codeRevealed ? 'revealed' : 'hidden'}`}>
              <span className="promo-code-text">
                {codeRevealed ? displayPromoCode : '· · · · · ·'}
              </span>
              {!codeRevealed && (
                <span className="promo-lock-overlay">
                  🔒 Complete tasks below to reveal
                </span>
              )}
            </div>

            {!allDone && (
              <p className="promo-hint">
                Complete {3 - tasksCompleted} more task{3 - tasksCompleted !== 1 ? 's' : ''} to reveal your code
              </p>
            )}
            {codeRevealed && (
              <p className="promo-revealed-text">
                ✅ Show this code at the counter to avail your discount!
              </p>
            )}
          </div>

          <div className="tasks-section">
            <div className="tasks-progress">
              <div className="tasks-progress-bar">
                <div
                  className="tasks-progress-fill"
                  style={{ width: `${(tasksCompleted / 3) * 100}%` }}
                />
              </div>
              <span className="tasks-progress-label">
                {tasksCompleted}/3 completed
              </span>
            </div>

            {!phoneDone ? (
              <form className="task-phone-form" onSubmit={handlePhoneSubmit}>
                <div className="task-phone-header">
                  <span className="task-icon">📱</span>
                  <div className="task-content">
                    <span className="task-label">Enter your phone number</span>
                    <span className="task-sub">We&apos;ll save your loyalty points</span>
                  </div>
                </div>
                <div className="task-phone-inputs">
                  <div className="input-wrapper compact">
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="10-digit number"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                    />
                  </div>
                  {phoneError && <p className="field-hint error-hint">{phoneError}</p>}
                  <button type="submit" className="btn-task-submit">
                    Save &amp; Continue →
                  </button>
                </div>
              </form>
            ) : (
              <div className="task-item done">
                <span className="task-icon">📱</span>
                <div className="task-content">
                  <span className="task-label">Phone Number Saved</span>
                  <span className="task-sub">Completed ✓</span>
                </div>
                <span className="task-check">✅</span>
              </div>
            )}

            <button
              className={`task-item ${igDone ? 'done' : 'pending'}`}
              onClick={!igDone ? handleInstagram : undefined}
              disabled={igDone || !phoneDone}
              style={!phoneDone ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            >
              <span className="task-icon">📸</span>
              <div className="task-content">
                <span className="task-label">Follow on Instagram</span>
                <span className="task-sub">
                  {igDone ? 'Completed ✓' : !phoneDone ? 'Complete task 1 first' : 'Tap to follow @brewbakescourtyard'}
                </span>
              </div>
              {igDone ? <span className="task-check">✅</span> : <span className="task-arrow">→</span>}
            </button>

            <button
              className={`task-item ${reviewDone ? 'done' : 'pending'}`}
              onClick={!reviewDone ? handleGoogleReview : undefined}
              disabled={reviewDone || !igDone}
              style={!igDone ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            >
              <span className="task-icon">⭐</span>
              <div className="task-content">
                <span className="task-label">Review Brewbakes Courtyard</span>
                <span className="task-sub">
                  {reviewDone ? 'Completed ✓' : !igDone ? 'Complete task 2 first' : 'Tap to leave a Google review'}
                </span>
              </div>
              {reviewDone ? <span className="task-check">✅</span> : <span className="task-arrow">→</span>}
            </button>
          </div>

          {phoneDone && (
            <div className="loyalty-earn-section">
              <div className="loyalty-earn-badge">
                <span className="loyalty-earn-icon">⭐</span>
                <span className="loyalty-earn-text">+1 Loyalty Point</span>
              </div>

              <div className="stamp-display">
                <span className="stamp-label">Loyalty Progress</span>
                <div className="stamp-dots">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`stamp-dot ${i < (freeCoffeeEarned ? 5 : pointsInCycle) ? 'filled' : ''}`}
                    >
                      {i < (freeCoffeeEarned ? 5 : pointsInCycle) ? '⭐' : '○'}
                    </span>
                  ))}
                </div>
                <span className="stamp-count">
                  {pointsInCycle === 0 && loyaltyPoints > 0 ? 5 : pointsInCycle} / 5 for free coffee
                  {freeCoffeeEarned && ' — FREE COFFEE EARNED!'}
                </span>
              </div>
            </div>
          )}

          {freeCoffeeEarned && (
            <div className="free-coffee-banner">
              <span className="coffee-icon">☕</span>
              <div>
                <strong>FREE COFFEE EARNED!</strong>
                <p>Show this to the manager</p>
              </div>
            </div>
          )}

          <div className="result-buttons">
            {phoneDone && (
              <button className="btn-secondary" onClick={onViewLoyalty}>
                🎫 My Loyalty Card
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
