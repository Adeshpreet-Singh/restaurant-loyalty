'use client'

export default function LoyaltyCard({ stamps, visitHistory, customerName, accountNumber, onBack, onNewVisit }: {
  stamps: number
  visitHistory: Array<{ date: string; bill: number; discount: number; finalAmount: string; promoCode?: string }>
  customerName: string
  accountNumber: string
  onBack: () => void
  onNewVisit: () => void
}) {
  const totalDiscount = visitHistory.reduce((sum, v) => sum + (v.bill - parseFloat(v.finalAmount)), 0)
  const currentCycle = stamps % 5 === 0 && stamps > 0 ? 5 : stamps % 5
  const isEligibleForFreeCoffee = stamps > 0 && stamps % 5 === 0

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
              <span className="stamps-title">Stamps Collected</span>
              <span className="stamps-count">{stamps} / {Math.ceil(stamps / 5) * 5 || 5}</span>
            </div>
            <div className="stamps-grid">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`card-stamp ${i < currentCycle ? 'stamped' : ''}`}>
                  <span className="stamp-icon">{i < currentCycle ? '⭐' : '☆'}</span>
                  <span className="stamp-num">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(currentCycle / 5) * 100}%` }} />
            </div>
            <span className="progress-text">
              {isEligibleForFreeCoffee
                ? '☕ Free Coffee Earned!'
                : `${5 - currentCycle} more visit${5 - currentCycle !== 1 ? 's' : ''} for free coffee`}
            </span>
          </div>
        </div>

        {isEligibleForFreeCoffee && (
          <div className="free-coffee-banner">
            <span className="coffee-icon">☕</span>
            <div>
              <strong>FREE COFFEE!</strong>
              <p>Show this to the manager</p>
            </div>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stamps}</span>
            <span className="stat-label">Total Visits</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{Math.floor(stamps / 5)}</span>
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
