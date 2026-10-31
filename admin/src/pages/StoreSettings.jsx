import { useEffect, useState } from 'react'
import { Upload } from 'lucide-react'
import { api } from '../api/client'

export default function StoreSettings() {
  const [tab, setTab] = useState('payment')
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/settings').then((data) => { setForm(data); setLoading(false) })
  }, [])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value })
  }

  async function handleQrUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await api.upload('/upload', file)
      setForm({ ...form, qrCodeImage: result.url })
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')
    try {
      await api.put('/settings', form, true)
      setMessage('Saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) return <p className="text-gray-500 text-sm">Loading...</p>

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-white mb-4">Store Settings</h1>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('payment')} className={`px-3 py-1.5 text-sm rounded-md ${tab === 'payment' ? 'bg-gold text-black font-medium' : 'text-gray-400 border border-gold/20'}`}>Payment</button>
        <button onClick={() => setTab('delivery')} className={`px-3 py-1.5 text-sm rounded-md ${tab === 'delivery' ? 'bg-gold text-black font-medium' : 'text-gray-400 border border-gold/20'}`}>Delivery</button>
      </div>

      {message && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-3 py-2 rounded mb-4">{message}</div>}

      {tab === 'payment' && (
        <div className="bg-luxe-panel border border-gold/10 rounded-lg p-5 space-y-4">
          <div>
            <label className="text-sm text-gray-300 block mb-1">UPI ID</label>
            <input name="upiId" value={form.upiId} onChange={handleChange} placeholder="yourname@okaxis" className="w-full bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-300 block mb-1">Display Name (shown to customer)</label>
            <input name="upiName" value={form.upiName} onChange={handleChange} placeholder="Teotia Shopprix" className="w-full bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-300 block mb-1">QR Code Image (optional — agar khali chhodoge, UPI ID se QR auto-generate hoga)</label>
            {form.qrCodeImage && <img src={form.qrCodeImage} alt="QR" className="w-32 h-32 object-contain bg-white rounded mb-2" />}
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer border border-dashed border-gold/30 rounded-md px-3 py-2 w-fit">
              <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload QR image'}
              <input type="file" accept="image/*" onChange={handleQrUpload} disabled={uploading} className="hidden" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" name="qrUpiEnabled" checked={form.qrUpiEnabled} onChange={handleChange} /> Enable QR/UPI payment
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" name="codEnabled" checked={form.codEnabled} onChange={handleChange} /> Enable Cash on Delivery
          </label>
        </div>
      )}

      {tab === 'delivery' && (
        <div className="bg-luxe-panel border border-gold/10 rounded-lg p-5 space-y-4">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" name="deliveryEnabled" checked={form.deliveryEnabled} onChange={handleChange} /> Restrict delivery by distance
          </label>
          <div>
            <label className="text-sm text-gray-300 block mb-1">Store Address (for reference)</label>
            <input name="baseAddressText" value={form.baseAddressText} onChange={handleChange} className="w-full bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-300 block mb-1">Latitude</label>
              <input name="baseLat" type="number" step="any" value={form.baseLat} onChange={handleChange} className="w-full bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-gray-300 block mb-1">Longitude</label>
              <input name="baseLng" type="number" step="any" value={form.baseLng} onChange={handleChange} className="w-full bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Google Maps pe apni dukaan search karo → right-click → coordinates pe click karke copy karo (jaise "27.4924, 77.6737").
          </p>
          <div>
            <label className="text-sm text-gray-300 block mb-1">Delivery Radius (km)</label>
            <input name="radiusKm" type="number" value={form.radiusKm} onChange={handleChange} className="w-full bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 text-sm" />
          </div>
        </div>
      )}

      <button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-gold hover:bg-gold-light text-black rounded-md py-2 text-sm font-semibold disabled:opacity-60">
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}
