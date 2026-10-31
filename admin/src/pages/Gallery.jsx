import { useEffect, useState } from 'react'
import { Plus, Trash2, X, Upload, Pencil, Image as ImageIcon, Video } from 'lucide-react'
import { api } from '../api/client'

const emptyForm = { category: 'news', type: 'image', title: '', description: '', url: '', order: 0, active: true }

export default function Gallery() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try { setItems(await api.get('/gallery/all/list', true)) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
    setShowForm(true)
  }

  function openEdit(item) {
    setForm({ category: item.category, type: item.type, title: item.title || '', description: item.description || '', url: item.url, order: item.order || 0, active: item.active })
    setEditingId(item._id)
    setError('')
    setShowForm(true)
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    if (name === 'category') {
      const nextType = value === 'videos' ? 'video' : 'image'
      setForm(prev => ({ ...prev, category: value, type: nextType, url: editingId ? prev.url : '' }))
      return
    }
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    const expectedVideo = form.category === 'videos'
    if (expectedVideo && !file.type.startsWith('video/')) {
      setError('Videos category mein sirf video file upload karo.')
      e.target.value = ''
      return
    }
    if (!expectedVideo && !file.type.startsWith('image/')) {
      setError('News/Photos category mein sirf image file upload karo.')
      e.target.value = ''
      return
    }

    setUploading(true)
    setError('')
    try {
      const result = await api.upload('/upload', file)
      setForm(prev => ({ ...prev, type: result.resourceType === 'video' ? 'video' : 'image', url: result.url }))
    } catch (err) { setError(err.message) }
    finally { setUploading(false); e.target.value = '' }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingId) await api.put(`/gallery/${editingId}`, form, true)
      else await api.post('/gallery', form, true)
      setShowForm(false)
      await load()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function toggleActive(item) {
    try { await api.put(`/gallery/${item._id}`, { active: !item.active }, true); await load() }
    catch (err) { setError(err.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this gallery item?')) return
    try { await api.delete(`/gallery/${id}`, true); await load() }
    catch (err) { setError(err.message) }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Gallery ({items.length})</h1>
          <p className="text-xs text-gray-500 mt-1">News, Photos aur Videos yahin se manage karo.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1 bg-gold hover:bg-gold-light text-black px-4 py-2 rounded-md text-sm font-medium">
          <Plus size={16} /> Add Gallery Item
        </button>
      </div>

      {showForm && (
        <div className="bg-luxe-panel border border-gold/10 rounded-lg p-5 mb-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-medium text-white">{editingId ? 'Edit Gallery Item' : 'Add Gallery Item'}</h2>
            <button onClick={() => setShowForm(false)}><X size={18} /></button>
          </div>
          {error && <div className="bg-blush-from/10 border border-blush-from/30 text-blush-from text-sm px-3 py-2 rounded mb-3">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-sm">
            <select name="category" value={form.category} onChange={handleChange} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2">
              <option value="news">News</option>
              <option value="photos">Photos</option>
              <option value="videos">Videos</option>
            </select>
            <div className="bg-black/20 border border-gold/20 rounded-md px-3 py-2 text-xs text-gray-400">
              {form.category === 'videos' ? 'Videos category: admin apne device se video upload kare.' : 'News/Photos category: admin apne device se image upload kare.'}
            </div>

            <label className="col-span-2 flex items-center gap-2 text-sm text-gray-300 cursor-pointer border border-dashed border-gold/30 rounded-md px-3 py-3 hover:border-gold/60">
              <Upload size={15} /> {uploading ? 'Uploading...' : form.category === 'videos' ? 'Upload video from device' : 'Upload image from device'}
              <input type="file" accept={form.category === 'videos' ? 'video/*' : 'image/*'} onChange={handleFileUpload} disabled={uploading} className="hidden" />
            </label>

            {form.url && form.type === 'image' && <img src={form.url} alt="preview" className="col-span-2 max-h-64 w-full object-contain bg-black/20 rounded" />}
            {form.url && form.type === 'video' && <video src={form.url} controls playsInline className="col-span-2 max-h-64 w-full bg-black/20 rounded" />}

            <input name="title" placeholder="Title" value={form.title} onChange={handleChange} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 col-span-2" />
            <textarea name="description" placeholder="Description (optional)" value={form.description} onChange={handleChange} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 col-span-2 min-h-20" />
            <input name="order" type="number" placeholder="Order" value={form.order} onChange={handleChange} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2" />
            <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" name="active" checked={form.active} onChange={handleChange} /> Active</label>
            <button type="submit" disabled={saving || uploading} className="col-span-2 bg-gold hover:bg-gold-light text-black rounded-md py-2 text-sm font-medium disabled:opacity-60">
              {saving ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
            </button>
          </form>
        </div>
      )}

      {error && !showForm && <div className="bg-blush-from/10 border border-blush-from/30 text-blush-from text-sm px-3 py-2 rounded mb-3">{error}</div>}

      {loading ? <p className="text-gray-500 text-sm">Loading...</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(item => (
            <div key={item._id} className="bg-luxe-panel border border-gold/10 rounded-lg p-3">
              {item.type === 'image' ? <img src={item.url} alt={item.title} className="w-full h-40 object-contain bg-black/20 rounded mb-2" /> : <video src={item.url} className="w-full h-40 object-contain bg-black/20 rounded mb-2" controls />}
              <div className="flex items-center gap-2 text-xs text-gold mb-1">{item.type === 'image' ? <ImageIcon size={13} /> : <Video size={13} />} {item.category}</div>
              <p className="text-sm text-white truncate">{item.title || '(no title)'}</p>
              <div className="flex justify-between items-center mt-2">
                <button onClick={() => toggleActive(item)} className={`text-xs px-2 py-1 rounded-full ${item.active ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}>{item.active ? 'Active' : 'Inactive'}</button>
                <div className="flex gap-3"><button onClick={() => openEdit(item)} className="text-gold"><Pencil size={14} /></button><button onClick={() => handleDelete(item._id)} className="text-blush-from"><Trash2 size={14} /></button></div>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-gray-500 text-sm col-span-full">Abhi koi gallery item nahi hai.</p>}
        </div>
      )}
    </div>
  )
}
