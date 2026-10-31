import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, X, Upload, Pencil } from 'lucide-react'
import { api } from '../api/client'

const emptyForm = { type: 'image', url: '', heading: '', subheading: '', order: 0, active: true }

export default function Banners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [cropSource, setCropSource] = useState(null)
  const [cropZoom, setCropZoom] = useState(1)
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStartRef = useRef(null)
  const cropImageRef = useRef(null)

  async function load() {
    setLoading(true)
    try {
      setBanners(await api.get('/banners/all', true))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
    setError('')
  }

  function openEdit(b) {
    setForm({ type: b.type, url: b.url, heading: b.heading || '', subheading: b.subheading || '', order: b.order, active: b.active })
    setEditingId(b._id)
    setShowForm(true)
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (form.type === 'video') {
      setError('Video upload seedha yahan se nahi hota — video file ka hosted URL paste karo (Cloudinary/YouTube-direct-mp4 link).')
      e.target.value = ''
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = () => {
      setCropSource(reader.result)
      setCropZoom(1)
      setCropPos({ x: 0, y: 0 })
    }
    reader.onerror = () => setError('Image read nahi ho paayi.')
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function startCropDrag(e) {
    e.preventDefault()
    setDragging(true)
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      x: cropPos.x,
      y: cropPos.y,
    }
  }

  function moveCrop(e) {
    if (!dragging || !dragStartRef.current) return
    const dx = e.clientX - dragStartRef.current.clientX
    const dy = e.clientY - dragStartRef.current.clientY
    setCropPos({ x: dragStartRef.current.x + dx, y: dragStartRef.current.y + dy })
  }

  function endCropDrag() {
    setDragging(false)
    dragStartRef.current = null
  }

  async function confirmCrop() {
    if (!cropSource || !cropImageRef.current) return
    setUploading(true)
    setError('')
    try {
      const img = cropImageRef.current
      const frameW = 1200
      const frameH = 375
      const canvas = document.createElement('canvas')
      canvas.width = frameW
      canvas.height = frameH
      const ctx = canvas.getContext('2d')

      const scale = frameW / img.naturalWidth
      const baseW = img.naturalWidth * scale
      const baseH = img.naturalHeight * scale
      const renderedW = baseW * cropZoom
      const renderedH = baseH * cropZoom
      const drawX = (frameW - renderedW) / 2 + cropPos.x
      const drawY = (frameH - renderedH) / 2 + cropPos.y

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, frameW, frameH)
      ctx.drawImage(img, drawX, drawY, renderedW, renderedH)

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92))
      if (!blob) throw new Error('Crop create nahi ho paaya.')
      const file = new File([blob], 'banner-cropped.jpg', { type: 'image/jpeg' })
      const result = await api.upload('/upload', file)
      setForm(prev => ({ ...prev, url: result.url }))
      setCropSource(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editingId) {
        await api.put(`/banners/${editingId}`, form, true)
      } else {
        await api.post('/banners', form, true)
      }
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(b) {
    await api.put(`/banners/${b._id}`, { active: !b.active }, true)
    await load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this banner?')) return
    await api.delete(`/banners/${id}`, true)
    await load()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-white">Homepage Banners ({banners.length})</h1>
        <button onClick={openAdd} className="flex items-center gap-1 bg-gold hover:bg-gold-light text-black px-4 py-2 rounded-md text-sm font-medium">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {cropSource && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-luxe-panel border border-gold/20 rounded-xl p-4 sm:p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="font-bold text-white">Adjust Banner Image</h2>
                <p className="text-xs text-gray-400 mt-1">Grid ke andar jo area dikhega, wahi homepage banner mein show hoga. Image ko drag karo aur zoom adjust karo.</p>
              </div>
              <button onClick={() => setCropSource(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>

            <div
              className="relative w-full aspect-[16/5] max-h-[62vh] overflow-hidden rounded-lg bg-black select-none touch-none"
              onPointerDown={startCropDrag}
              onPointerMove={moveCrop}
              onPointerUp={endCropDrag}
              onPointerCancel={endCropDrag}
              onPointerLeave={endCropDrag}
            >
              <img
                ref={cropImageRef}
                src={cropSource}
                alt="Crop preview"
                draggable="false"
                className="absolute left-1/2 top-1/2 max-w-none pointer-events-none"
                style={{
                  width: `${Math.max(100, 100 * cropZoom)}%`,
                  transform: `translate(calc(-50% + ${cropPos.x}px), calc(-50% + ${cropPos.y}px))`,
                }}
              />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border border-white/35" />)}
                </div>
                <div className="absolute inset-0 border-2 border-white/80 rounded-lg" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
              <label className="flex-1 text-xs text-gray-300">
                Zoom
                <input type="range" min="1" max="2.5" step="0.01" value={cropZoom} onChange={e => setCropZoom(Number(e.target.value))} className="w-full mt-2" />
              </label>
              <div className="flex gap-2">
                <button onClick={() => setCropSource(null)} className="px-4 py-2 rounded-md border border-white/10 text-gray-300 text-sm">Cancel</button>
                <button onClick={confirmCrop} disabled={uploading} className="px-4 py-2 rounded-md bg-gold text-black text-sm font-semibold disabled:opacity-60">{uploading ? 'Uploading...' : 'Use This Banner'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-luxe-panel border border-gold/10 rounded-lg p-5 mb-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-medium text-white">{editingId ? 'Edit Banner' : 'New Banner'}</h2>
            <button onClick={() => setShowForm(false)}><X size={18} /></button>
          </div>
          {error && <div className="bg-blush-from/10 border border-blush-from/30 text-blush-from text-sm px-3 py-2 rounded mb-3">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-sm">
            <select name="type" value={form.type} onChange={handleChange} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 col-span-2">
              <option value="image">Image</option>
              <option value="video">Video (autoplay, muted, loop)</option>
            </select>

            {form.type === 'image' && (
              <label className="col-span-2 flex items-center gap-2 text-sm text-gray-400 cursor-pointer border border-dashed border-gold/30 rounded-md px-3 py-2">
                <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload image'}
                <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
              </label>
            )}
            <input name="url" required placeholder="Image/video URL" value={form.url} onChange={handleChange} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 col-span-2" />
            {form.url && form.type === 'image' && <img src={form.url} alt="preview" className="col-span-2 w-full h-auto max-h-none object-contain bg-black/20 rounded" />}

            <input name="heading" placeholder="Heading (optional)" value={form.heading} onChange={handleChange} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 col-span-2" />
            <input name="subheading" placeholder="Subheading (optional)" value={form.subheading} onChange={handleChange} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 col-span-2" />
            <input name="order" type="number" placeholder="Order (0 = first)" value={form.order} onChange={handleChange} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2" />
            <label className="flex items-center gap-2 text-gray-300">
              <input type="checkbox" name="active" checked={form.active} onChange={handleChange} /> Active
            </label>

            <button type="submit" disabled={saving} className="col-span-2 bg-gold hover:bg-gold-light text-black rounded-md py-2 text-sm font-medium disabled:opacity-60">
              {saving ? 'Saving...' : editingId ? 'Update Banner' : 'Create Banner'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {banners.map((b) => (
            <div key={b._id} className="bg-luxe-panel border border-gold/10 rounded-lg p-3">
              {b.type === 'image' ? (
                <img src={b.url} alt="" className="w-full h-32 object-cover rounded mb-2" />
              ) : (
                <video src={b.url} className="w-full h-32 object-cover rounded mb-2" muted />
              )}
              <p className="text-sm text-white truncate">{b.heading || '(no heading)'}</p>
              <div className="flex justify-between items-center mt-2">
                <button onClick={() => toggleActive(b)} className={`text-xs px-2 py-1 rounded-full ${b.active ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                  {b.active ? 'Active' : 'Inactive'}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(b)} className="text-gold"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(b._id)} className="text-blush-from"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
          {banners.length === 0 && <p className="text-gray-500 text-sm col-span-full">Koi banner nahi hai.</p>}
        </div>
      )}
    </div>
  )
}
