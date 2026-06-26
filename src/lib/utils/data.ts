const SESSION_KEY = 'brewbakes_session'
const PENDING_SPIN_KEY = 'brewbakes_pending_spin'
const PHONE_KEY = 'brewbakes_last_phone'
const MAX_JACKPOT_PER_MONTH = 4

// ─── API helper ────────────────────────────────────────────────────
async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error || `API error: ${res.status}`)
    ;(err as Error & { status: number }).status = res.status
    ;(err as Error & { body: unknown }).body = body
    throw err
  }
  return res.json()
}

// ─── Session (anonymous, per-device — stays in localStorage) ───────
export function getSessionId() {
  let sid = localStorage.getItem(SESSION_KEY)
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(SESSION_KEY, sid)
  }
  return sid
}

// ─── Anti-spam (checks session + phone on server) ──────────────────
export async function canSpinToday(phone?: string) {
  try {
    const params = phone ? `?phone=${phone}` : ''
    const data = await api(`/api/spin/can-spin/${getSessionId()}${params}`)
    return data.canSpin
  } catch {
    return true
  }
}

// ─── Record spin result on server (called when wheel lands) ────────
export async function recordSpin(discount: number, billAmount: number, promoCode: string) {
  try {
    const result = await api('/api/spin', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: getSessionId(),
        discount,
        billAmount,
        promoCode,
      }),
    })
    return result
  } catch (err) {
    console.error('Failed to record spin:', err)
    throw err
  }
}

// ─── Get today's spin for this session (restore on refresh) ────────
export async function getTodaysSpin() {
  try {
    return await api(`/api/spin/today/${getSessionId()}`)
  } catch {
    return null
  }
}

// ─── User CRUD ─────────────────────────────────────────────────────
export async function getUser(phone: string) {
  try {
    return await api(`/api/user/${phone}`)
  } catch {
    return null
  }
}

// ─── Save completed spin (uses server-side data) ───────────────────
export async function saveSpinResult(phone: string) {
  const data = await api('/api/user/save-spin', {
    method: 'POST',
    body: JSON.stringify({ phone, sessionId: getSessionId() }),
  })
  saveLastPhone(phone)
  return data
}

// ─── Task completion ─────────────────────────────────────────────
export async function completeTask(phone: string, task: string) {
  try {
    const result = await api(`/api/user/${phone}/complete-task`, {
      method: 'POST',
      body: JSON.stringify({ task }),
    })
    const cached = getCompletedTasks()
    cached[task] = true
    localStorage.setItem('brewbakes_completed_tasks', JSON.stringify(cached))
    return result
  } catch (err) {
    console.error('Failed to complete task:', err)
    const cached = getCompletedTasks()
    cached[task] = true
    localStorage.setItem('brewbakes_completed_tasks', JSON.stringify(cached))
    return { user: null, loyaltyIncreased: false }
  }
}

// ─── Claim free coffee ──────────────────────────────────────────
export async function claimFreeCoffee(phone: string) {
  try {
    const result = await api(`/api/user/${phone}/claim-free-coffee`, {
      method: 'POST',
    })
    return result
  } catch (err) {
    console.error('Failed to claim free coffee:', err)
  }
}

// ─── Phone persistence (localStorage) ────────────────────────────
export function saveLastPhone(phone: string) {
  localStorage.setItem(PHONE_KEY, phone)
}

export function getLastPhone() {
  return localStorage.getItem(PHONE_KEY) || ''
}

// ─── Completed tasks cache (localStorage) ────────────────────────
export function getCompletedTasks() {
  try {
    return JSON.parse(localStorage.getItem('brewbakes_completed_tasks') || '{}')
  } catch {
    return {}
  }
}

export function setCompletedTasks(tasks: Record<string, boolean>) {
  localStorage.setItem('brewbakes_completed_tasks', JSON.stringify(tasks))
}

// ─── Pending spin (localStorage — offline resilience) ──────────────
export function savePendingSpin(billAmount: number, discount: number, promoCode: string) {
  localStorage.setItem(PENDING_SPIN_KEY, JSON.stringify({
    billAmount, discount, promoCode,
    timestamp: new Date().toISOString(),
  }))
}

export function loadPendingSpin() {
  try {
    const raw = localStorage.getItem(PENDING_SPIN_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    const spinDate = new Date(data.timestamp)
    const now = new Date()
    const isToday = spinDate.toDateString() === now.toDateString()
    return isToday ? data : null
  } catch {
    return null
  }
}

export function clearPendingSpin() {
  localStorage.removeItem(PENDING_SPIN_KEY)
}

// ─── Jackpot (100%) monthly limit ──────────────────────────────────
export async function getJackpotCountThisMonth() {
  try {
    const data = await api('/api/jackpot/count')
    return data.count
  } catch {
    return 0
  }
}

export async function canWinJackpot() {
  const count = await getJackpotCountThisMonth()
  return count < MAX_JACKPOT_PER_MONTH
}

export async function logJackpotWin(phone?: string) {
  try {
    await api('/api/jackpot/log', {
      method: 'POST',
      body: JSON.stringify({ phone: phone || null }),
    })
  } catch (err) {
    console.error('Failed to log jackpot:', err)
  }
}

// ─── Promo code ────────────────────────────────────────────────────
export function generatePromoCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// ─── Server-side discount calculation ──────────────────────────────
export async function calculateDiscount(billAmount: number): Promise<{ discount: number; freebie?: { name: string; value: number } }> {
  try {
    const result = await api('/api/spin/calculate', {
      method: 'POST',
      body: JSON.stringify({ billAmount }),
    })
    return result
  } catch {
    return { discount: 5 }
  }
}
