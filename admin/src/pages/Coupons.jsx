import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { api } from '../api/client'

const emptyForm = {
  code: '', discountType: 'percent', discountValue: '',
  minOrderValue: '', maxDiscount: '', usageLimit: '', expiresAt: '',
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setCoupons(await api.get('/coupons', true))
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
      const payload = {
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue) || 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        expiresAt: form.expiresAt || undefined,
      }
      await api.post('/coupons', payload, true)
      setForm(emptyForm)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(c) {
    await api.put(`/coupons/${c._id}`, { active: !c.active }, true)
    await load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this coupon?')) return
    await api.delete(`/coupons/${id}`, true)
    await load()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-white">Coupons ({coupons.length})</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 bg-gold hover:bg-gold-light text-black px-4 py-2 rounded-md text-sm font-medium">
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Cancel' : 'New Coupon'}
        </button>
      </div>

      {showForm && (
        <div className="bg-luxe-panel border border-gold/10 rounded-lg p-5 mb-5">
          {error && <div className="bg-blush-from/10 border border-blush-from/30 text-blush-from text-sm px-3 py-2 rounded mb-3">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-sm">
            <input name="code" required placeholder="Coupon code e.g. WELCOME10" value={form.code} onChange={handleChange} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 col-span-2" />
            <select name="discountType" value={form.discountType} onChange={handleChange} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2">
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat (₹)</option>
            </select>
            <input name="discountValue" type="number" required placeholder={form.discountType === 'percent' ? 'e.g. 10' : 'e.g. 100'} value={form.discountValue} onChange={handleChange} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2" />
            <input name="minOrderValue" type="number" placeholder="Min order value (₹)" value={form.minOrderValue} onChange={handleChange} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2" />
            {form.discountType === 'percent' && (
              <input name="maxDiscount" type="number" placeholder="Max discount cap (₹, optional)" value={form.maxDiscount} onChange={handleChange} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2" />
            )}
            <input name="usageLimit" type="number" placeholder="Usage limit (optional)" value={form.usageLimit} onChange={handleChange} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2" />
            <input name="expiresAt" type="date" value={form.expiresAt} onChange={handleChange} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2" />

            <button type="submit" disabled={saving} className="col-span-2 bg-gold hover:bg-gold-light text-black rounded-md py-2 text-sm font-medium disabled:opacity-60">
              {saving ? 'Creating...' : 'Create Coupon'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <div className="bg-luxe-panel border border-gold/10 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/30 text-left text-gray-400">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Min Order</th>
                <th className="p-3">Used</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id} className="border-t border-gold/10">
                  <td className="p-3 font-medium text-gold">{c.code}</td>
                  <td className="p-3 text-gray-300">{c.discountType === 'percent' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                  <td className="p-3 text-gray-300">₹{c.minOrderValue}</td>
                  <td className="p-3 text-gray-300">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleActive(c)}
                      className={`text-xs px-2 py-1 rounded-full ${c.active ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}
                    >
                      {c.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-3">
                    <button onClick={() => handleDelete(c._id)} className="text-blush-from hover:underline flex items-center gap-1"><Trash2 size={14} /> Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && <p className="p-4 text-gray-500 text-sm">Koi coupon nahi hai.</p>}
        </div>
      )}
    </div>
  )
}
