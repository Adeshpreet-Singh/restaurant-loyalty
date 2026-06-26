'use client'

import { useState, useEffect, useCallback } from 'react'
import BillSelection from '@/components/BillSelection'
import ResultScreen from '@/components/ResultScreen'
import LoyaltyCard from '@/components/LoyaltyCard'
import {
  getUser,
  saveSpinResult,
  canSpinToday,
  recordSpin,
  getTodaysSpin,
  generatePromoCode,
  savePendingSpin,
  loadPendingSpin,
  clearPendingSpin,
  logJackpotWin,
  getLastPhone,
  claimFreeCoffee,
} from '@/lib/utils/data'

function generateAccountNumber(phone: string) {
  const hash = phone.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0)
  }, 0)
  return 'BB' + Math.abs(hash).toString().slice(0, 6).padStart(6, '0')
}

interface VisitHistory {
  date: string
  bill: number
  discount: number
  finalAmount: string
  promoCode?: string
}

interface UserData {
  name?: string
  loyaltyPoints?: number
  totalVisits?: number
  totalFreeCoffees?: number
  freeCoffeePending?: boolean
  visitHistory?: VisitHistory[]
  accountNumber?: string
}

export default function LoyaltyApp() {
  const [screen, setScreen] = useState<'bill' | 'result' | 'loyalty'>('bill')
  const [billAmount, setBillAmount] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [promoCode, setPromoCode] = useState('')
  const [freebie, setFreebie] = useState<{ name: string; value: number } | undefined>(undefined)
  const [error, setError] = useState('')

  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [stamps, setStamps] = useState(0)
  const [totalFreeCoffees, setTotalFreeCoffees] = useState(0)
  const [freeCoffeePending, setFreeCoffeePending] = useState(false)
  const [visitHistory, setVisitHistory] = useState<VisitHistory[]>([])
  const [accountNumber, setAccountNumber] = useState('')

  useEffect(() => {
    const phone = getLastPhone()

    const loadUser = phone
      ?       getUser(phone).then((user: UserData | null) => {
          if (user) {
            setUserPhone(phone)
            setUserName(user.name || '')
            setStamps(user.loyaltyPoints || 0)
            setTotalFreeCoffees(user.totalFreeCoffees || 0)
            setFreeCoffeePending(user.freeCoffeePending || false)
            setVisitHistory(user.visitHistory || [])
            setAccountNumber(user.accountNumber || generateAccountNumber(phone))
            return user
          }
          return null
        }).catch(() => null)
      : Promise.resolve(null)

    const loadSpin = getTodaysSpin().catch(() => {
      const pending = loadPendingSpin()
      if (pending) {
        return { billAmount: pending.billAmount, discount: pending.discount, promoCode: pending.promoCode }
      }
      return null
    })

    Promise.all([loadUser, loadSpin]).then(([user, spin]) => {
      if (spin) {
        setBillAmount(spin.billAmount)
        setDiscount(spin.discount)
        setPromoCode(spin.promoCode)

        if (user) {
          // Has phone + today's spin → show loyalty card with all promo codes
          setScreen('loyalty')
        } else {
          // No phone + today's spin → show result (already used today)
          setScreen('result')
        }
      }
    })
  }, [])

  async function handleSpinResult(amount: number, disc: number, freebieResult?: { name: string; value: number }) {
    const code = generatePromoCode()
    setBillAmount(amount)
    setDiscount(disc)
    setPromoCode(code)
    setFreebie(freebieResult)
    savePendingSpin(amount, disc, code)

    try {
      await recordSpin(disc, amount, code)
      if (disc === 100) {
        const phone = userPhone || getLastPhone()
        await logJackpotWin(phone || undefined)
      }
    } catch {
      // server offline — result saved in localStorage
    }
    setScreen('result')
  }

  const handleSaveUser = useCallback(async (phone: string) => {
    const updated = await saveSpinResult(phone) as UserData
    clearPendingSpin()

    setUserPhone(phone)
    setUserName(updated.name || '')
    setStamps(updated.loyaltyPoints || 0)
    setTotalFreeCoffees(updated.totalFreeCoffees || 0)
    setFreeCoffeePending(updated.freeCoffeePending || false)
    setVisitHistory(updated.visitHistory || [])
    setAccountNumber(updated.accountNumber || generateAccountNumber(phone))

    return updated
  }, [])

  async function handleViewLoyalty() {
    const phone = userPhone || getLastPhone()
    if (phone) {
      const user = await getUser(phone) as UserData | null
      if (user) {
        setUserPhone(phone)
        setUserName(user.name || '')
        setStamps(user.loyaltyPoints || 0)
        setTotalFreeCoffees(user.totalFreeCoffees || 0)
        setFreeCoffeePending(user.freeCoffeePending || false)
        setVisitHistory(user.visitHistory || [])
        setAccountNumber(user.accountNumber || generateAccountNumber(phone))
      }
    }
    setScreen('loyalty')
  }

  function handleBackToWelcome() {
    setError('')
    setScreen('bill')
  }

  async function handleClaimFreeCoffee() {
    const phone = userPhone || getLastPhone()
    if (phone) {
      await claimFreeCoffee(phone)
      setFreeCoffeePending(false)
    }
  }

  async function handleNewVisit() {
    const phone = userPhone || getLastPhone()
    const canSpin = await canSpinToday(phone || undefined)
    if (!canSpin) {
      setError('You already spun today! Come back tomorrow for another chance.')
      return
    }
    setError('')
    setBillAmount(0)
    setDiscount(0)
    setPromoCode('')
    setScreen('bill')
  }

  return (
    <div className="app">
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {error && (
        <div className="global-error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className="screen-container" key={screen}>
        {screen === 'bill' && (
          <BillSelection userName={userName} onResult={handleSpinResult} onError={setError} />
        )}
        {screen === 'result' && (
          <ResultScreen
            discount={discount}
            billAmount={billAmount}
            promoCode={promoCode}
            freebie={freebie}
            onSaved={handleSaveUser}
            onViewLoyalty={handleViewLoyalty}
            onBackToHome={handleBackToWelcome}
          />
        )}
        {screen === 'loyalty' && (
          <LoyaltyCard
            stamps={stamps}
            visitHistory={visitHistory}
            customerName={userName}
            accountNumber={accountNumber}
            onBack={handleBackToWelcome}
            onNewVisit={handleNewVisit}
            totalFreeCoffees={totalFreeCoffees}
            freeCoffeePending={freeCoffeePending}
            onClaimFreeCoffee={handleClaimFreeCoffee}
          />
        )}
      </div>
    </div>
  )
}
