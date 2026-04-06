import { useState, useEffect } from 'react'

interface HaltedPair {
  pairId:   string
  reason:   string
  haltedAt: number
}

export function AdminPage() {
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('admin_key') ?? '')
  const [haltedPairs, setHaltedPairs] = useState<HaltedPair[]>([])
  const [haltPairId, setHaltPairId] = useState('')
  const [haltReason, setHaltReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Fetch halted pairs on mount and after each action
  const fetchHalted = async () => {
    try {
      const res = await fetch(`${import.meta.env['VITE_API_URL'] ?? ''}/admin/halted`, {
        headers: { 'X-Admin-Key': apiKey },
      })
      if (res.ok) {
        const data = await res.json() as { halted: HaltedPair[] }
        setHaltedPairs(data.halted)
      }
    } catch { /* ignore */ }
  }

  useEffect(() => { if (apiKey) void fetchHalted() }, [apiKey])

  const saveKey = () => {
    sessionStorage.setItem('admin_key', apiKey)
    void fetchHalted()
  }

  const haltPair = async () => {
    if (!haltPairId.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env['VITE_API_URL'] ?? ''}/admin/halt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': apiKey },
        body: JSON.stringify({ pairId: haltPairId.trim(), reason: haltReason || 'Manual halt' }),
      })
      setMessage(res.ok ? `✅ Halted: ${haltPairId}` : `❌ Error: ${res.status}`)
      void fetchHalted()
    } catch { setMessage(`❌ Network error`) }
    setLoading(false)
  }

  const resumePair = async (pairId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env['VITE_API_URL'] ?? ''}/admin/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': apiKey },
        body: JSON.stringify({ pairId }),
      })
      setMessage(res.ok ? `✅ Resumed: ${pairId}` : `❌ Error: ${res.status}`)
      void fetchHalted()
    } catch { setMessage(`❌ Network error`) }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-xl font-semibold text-color-text-1">Admin — Circuit Breaker</h1>

      {/* API Key input */}
      <section className="bg-color-layer-2 rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-medium text-color-text-0">Admin API Key</h2>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Enter admin API key"
            className="flex-1 bg-color-layer-3 border border-color-border rounded px-3 py-2 text-sm text-color-text-1"
          />
          <button onClick={saveKey} className="px-4 py-2 bg-color-accent rounded text-sm font-medium">
            Connect
          </button>
        </div>
      </section>

      {/* Halted pairs list */}
      <section className="bg-color-layer-2 rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-medium text-color-text-0">
          Halted Pairs ({haltedPairs.length})
        </h2>
        {haltedPairs.length === 0 ? (
          <p className="text-sm text-color-text-2">No pairs currently halted — trading active</p>
        ) : (
          <ul className="space-y-2">
            {haltedPairs.map(p => (
              <li key={p.pairId} className="flex items-center justify-between bg-color-layer-3 rounded px-3 py-2">
                <div>
                  <span className="text-sm font-mono text-color-text-1">{p.pairId}</span>
                  <span className="ml-2 text-xs text-color-text-2">{p.reason}</span>
                </div>
                <button
                  onClick={() => void resumePair(p.pairId)}
                  disabled={loading}
                  className="px-3 py-1 bg-color-positive text-white rounded text-xs font-medium disabled:opacity-50"
                >
                  Resume
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Halt a pair */}
      <section className="bg-color-layer-2 rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-medium text-color-text-0">Halt a Pair</h2>
        <input
          value={haltPairId}
          onChange={e => setHaltPairId(e.target.value)}
          placeholder="Pair ID (e.g. 0xBASE/0xQUOTE)"
          className="w-full bg-color-layer-3 border border-color-border rounded px-3 py-2 text-sm font-mono text-color-text-1"
        />
        <input
          value={haltReason}
          onChange={e => setHaltReason(e.target.value)}
          placeholder="Reason (optional)"
          className="w-full bg-color-layer-3 border border-color-border rounded px-3 py-2 text-sm text-color-text-1"
        />
        <button
          onClick={() => void haltPair()}
          disabled={loading || !haltPairId.trim()}
          className="w-full py-2 bg-color-error text-white rounded text-sm font-medium disabled:opacity-50"
        >
          Halt Trading
        </button>
      </section>

      {message && (
        <p className="text-sm text-center text-color-text-1">{message}</p>
      )}
    </div>
  )
}
