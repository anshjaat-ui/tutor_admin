import { useEffect, useState } from 'react'
import { Plus, Trash2, X, Check } from 'lucide-react'
import { api } from '../api/client'

const emptyForm = { name: '', depositAmount: '', durationMonths: '', monthlyPayout: '', finalPayout: '', description: '' }

export default function Schemes() {
  const [tab, setTab] = useState('schemes')
  const [schemes, setSchemes] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const [s, e] = await Promise.all([api.get('/schemes/all', true), api.get('/schemes/enrollments/all', true)])
      setSchemes(s)
      setEnrollments(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post('/schemes', {
        name: form.name,
        depositAmount: Number(form.depositAmount),
        durationMonths: Number(form.durationMonths),
        monthlyPayout: Number(form.monthlyPayout),
        finalPayout: Number(form.finalPayout),
        description: form.description,
      }, true)
      setForm(emptyForm)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(s) {
    await api.put(`/schemes/${s._id}`, { active: !s.active }, true)
    await load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this scheme?')) return
    await api.delete(`/schemes/${id}`, true)
    await load()
  }

  async function confirmDeposit(enrollmentId) {
    setBusyId(enrollmentId)
    try {
      await api.put(`/schemes/enrollments/${enrollmentId}/confirm-deposit`, {}, true)
      await load()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <p className="text-gray-500 text-sm">Loading...</p>

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-4">Savings Schemes</h1>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('schemes')} className={`px-3 py-1.5 text-sm rounded-md ${tab === 'schemes' ? 'bg-gold text-black font-medium' : 'text-gray-400 border border-gold/20'}`}>Schemes</button>
        <button onClick={() => setTab('users')} className={`px-3 py-1.5 text-sm rounded-md ${tab === 'users' ? 'bg-gold text-black font-medium' : 'text-gray-400 border border-gold/20'}`}>Enrolled Users ({enrollments.length})</button>
      </div>

      {tab === 'schemes' && (
        <div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 bg-gold hover:bg-gold-light text-black px-4 py-2 rounded-md text-sm font-medium mb-4">
            {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancel' : 'New Scheme'}
          </button>

          {showForm && (
            <div className="bg-luxe-panel border border-gold/10 rounded-lg p-5 mb-5 max-w-md">
              {error && <div className="bg-blush-from/10 border border-blush-from/30 text-blush-from text-sm px-3 py-2 rounded mb-3">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-3">
                <input name="name" required placeholder="Scheme name e.g. Silver Plan" value={form.name} onChange={handleChange} className="w-full bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 text-sm" />
                <input name="depositAmount" type="number" required placeholder="One-time deposit amount (₹) e.g. 12000" value={form.depositAmount} onChange={handleChange} className="w-full bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 text-sm" />
                <input name="durationMonths" type="number" required placeholder="Duration (months) e.g. 12" value={form.durationMonths} onChange={handleChange} className="w-full bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 text-sm" />
                <input name="monthlyPayout" type="number" required placeholder="Monthly coupon value (₹) e.g. 1000" value={form.monthlyPayout} onChange={handleChange} className="w-full bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 text-sm" />
                <input name="finalPayout" type="number" required placeholder="Last month coupon value (₹) e.g. 1500" value={form.finalPayout} onChange={handleChange} className="w-full bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 text-sm" />
                <textarea name="description" placeholder="Description (optional)" value={form.description} onChange={handleChange} rows={2} className="w-full bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 text-sm" />
                <button type="submit" disabled={saving} className="w-full bg-gold hover:bg-gold-light text-black rounded-md py-2 text-sm font-medium disabled:opacity-60">
                  {saving ? 'Creating...' : 'Create Scheme'}
                </button>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {schemes.map((s) => (
              <div key={s._id} className="bg-luxe-panel border border-gold/10 rounded-lg p-4">
                <h3 className="text-gold font-semibold mb-2">{s.name}</h3>
                <p className="text-xs text-gray-400 mb-1">Deposit: ₹{(s.depositAmount || 0).toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-400 mb-1">₹{s.monthlyPayout || 0}/month × {s.durationMonths - 1} + ₹{s.finalPayout || 0} last month</p>
                <p className="text-xs text-green-400 mb-3">Total coupon value: ₹{((s.monthlyPayout || 0) * (s.durationMonths - 1) + (s.finalPayout || 0)).toLocaleString('en-IN')}</p>
                <div className="flex justify-between items-center">
                  <button onClick={() => toggleActive(s)} className={`text-xs px-2 py-1 rounded-full ${s.active ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                    {s.active ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => handleDelete(s._id)} className="text-blush-from"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {schemes.length === 0 && <p className="text-gray-500 text-sm col-span-full">Koi scheme nahi hai.</p>}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-3">
          {enrollments.map((e) => {
            const redeemedCoupons = e.coupons.filter((c) => c.redeemed)

            return (
              <div key={e._id} className="bg-luxe-panel border border-gold/10 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white text-sm font-medium">{e.user?.name} — {e.scheme?.name}</p>
                    <p className="text-xs text-gray-500">{e.user?.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    e.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                    : e.status === 'active' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    : 'bg-gold/10 text-gold border border-gold/30'
                  }`}>
                    {e.status.replace('_', ' ')}
                  </span>
                </div>

                {!e.depositConfirmed ? (
                  e.depositClaimed ? (
                    <div className="flex items-center justify-between bg-black/30 rounded-md px-3 py-2">
                      <span className="text-xs text-gray-300">
                        Deposit claim: ₹{e.scheme?.depositAmount?.toLocaleString('en-IN')} {e.depositUpiRef ? `(UTR: ${e.depositUpiRef})` : ''}
                      </span>
                      <button
                        onClick={() => confirmDeposit(e._id)}
                        disabled={busyId === e._id}
                        className="text-xs bg-gold text-black px-3 py-1 rounded-full flex items-center gap-1 disabled:opacity-60"
                      >
                        <Check size={12} /> Confirm Deposit
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Customer ne abhi deposit claim nahi ki.</p>
                  )
                ) : (
                  <>
                    <p className="text-xs text-gray-400 mb-2">Coupons redeemed: {redeemedCoupons.length}/{e.coupons.length} (automatically emailed)</p>
                    {redeemedCoupons.length > 0 && (
                      <div className="bg-black/30 rounded-md p-2 space-y-1">
                        {redeemedCoupons.map((c) => (
                          <div key={c.monthNumber} className="flex justify-between text-xs text-gray-300">
                            <span className="font-mono text-gold">{c.couponCode}</span>
                            <span>₹{c.baseAmount} · Month {c.monthNumber}</span>
                            <span className={c.emailSent ? 'text-green-400' : 'text-gray-500'}>{c.emailSent ? 'Emailed' : 'Not emailed'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
          {enrollments.length === 0 && <p className="text-gray-500 text-sm">Koi user enrolled nahi hai.</p>}
        </div>
      )}
    </div>
  )
}
