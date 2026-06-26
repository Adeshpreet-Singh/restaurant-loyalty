'use client'

export default function LoyaltyCard({ stamps, visitHistory, customerName, accountNumber, onBack, onNewVisit, totalFreeCoffees, freeCoffeePending, onClaimFreeCoffee }: {
  stamps: number
  visitHistory: Array<{ date: string; bill: number; discount: number; finalAmount: string; promoCode?: string }>
  customerName: string
  accountNumber: string
  onBack: () => void
  onNewVisit: () => void
  totalFreeCoffees: number
  freeCoffeePending: boolean
  onClaimFreeCoffee: () => void
}) {
  const totalDiscount = visitHistory.reduce((sum, v) => sum + (v.bill - parseFloat(v.finalAmount)), 0)

  // stamps = loyaltyPoints = 0-4 (monthly stamps)
  const monthlyStamps = stamps
  const nextRewardAt = 4 - monthlyStamps

  // Get current month visits
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthlyVisitCount = visitHistory.filter(v => {
    const d = new Date(v.date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === currentMonth
  }).length

  return (
    <div className="screen loyalty-screen">
      <div className="screen-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="topbar-back" onClick={onBack}>
              ← Back
            </button>
          </div>
          <div className="topbar-right">
            {customerName && (
              <span className="topbar-avatar">{customerName.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </header>

        <div className="loyalty-card-visual">
          <div className="card-top">
            <span className="card-brand">☕ Brewbakes Courtyard</span>
            <span className="card-type">LOYALTY MEMBER</span>
          </div>

          <div className="card-account">
            <span className="account-label">Account No:</span>
            <span className="account-number">{accountNumber}</span>
          </div>

          <div className="card-stamps">
            <div className="stamps-header">
              <span className="stamps-title">This Month&apos;s Stamps</span>
              <span className="stamps-count">{monthlyVisitCount} / 5</span>
            </div>
            <div className="stamps-grid">
              {[...Array(5)].map((_, i) => {
                const isStamp = i < monthlyStamps
                const isReward = i === 4
                return (
                  <div key={i} className={`card-stamp ${isStamp ? 'stamped' : ''} ${isReward ? 'reward-stamp' : ''}`}>
                    <span className="stamp-icon">
                      {isReward ? '☕' : isStamp ? '⭐' : '☆'}
                    </span>
                    <span className="stamp-num">{isReward ? 'FREE' : i + 1}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(monthlyStamps / 5) * 100}%` }} />
            </div>
            <span className="progress-text">
              {freeCoffeePending
                ? '☕ Free Coffee Ready! Claim it now'
                : `${nextRewardAt} more visit${nextRewardAt !== 1 ? 's' : ''} for free coffee`}
            </span>
          </div>
        </div>

        {freeCoffeePending && (
          <div className="free-coffee-banner" onClick={onClaimFreeCoffee}>
            <span className="coffee-icon">☕</span>
            <div>
              <strong>FREE COFFEE!</strong>
              <p>Tap to claim — show this to the manager</p>
            </div>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{monthlyVisitCount}</span>
            <span className="stat-label">This Month</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{totalFreeCoffees}</span>
            <span className="stat-label">Free Coffees</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">₹{totalDiscount.toFixed(0)}</span>
            <span className="stat-label">Total Saved</span>
          </div>
        </div>

        {visitHistory.length > 0 && (
          <div className="visit-history">
            <h3>Visit History</h3>
            <div className="history-list">
              {[...visitHistory].reverse().map((visit, i) => (
                <div key={i} className="history-item">
                  <div className="history-date">
                    {new Date(visit.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="history-details">
                    <span>Bill: ₹{visit.bill.toFixed(2)}</span>
                    <span className="history-discount">{visit.discount}% off</span>
                    <span className="history-final">Paid: ₹{visit.finalAmount}</span>
                  </div>
                  {visit.promoCode && (
                    <div className="history-promo">Code: {visit.promoCode}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="result-buttons">
          <button className="btn-primary" onClick={onNewVisit}>
            🔄 New Visit
          </button>
          <button className="btn-secondary" onClick={onBack}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
