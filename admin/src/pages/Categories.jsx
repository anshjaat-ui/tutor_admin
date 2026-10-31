import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, X } from 'lucide-react'
import { api } from '../api/client'

const COMMON_EMOJIS = ['📱','👗','🏠','📚','💄','⚽','🧸','🛒','📞','💻','👟','🎮','🍔','🚗','⌚','🎧','🛋️','💍','🧴','🎁','📓','🥛','🧈','🥚']

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🛍️')
  const [parent, setParent] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const topLevel = categories.filter((c) => !c.parent)
  const subOf = (id) => categories.filter((c) => c.parent === id)

  async function load() {
    setLoading(true)
    try {
      setCategories(await api.get('/categories'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function startEdit(c) {
    setEditingId(c._id)
    setName(c.name)
    setEmoji(c.emoji)
    setParent(c.parent || '')
  }

  function cancelEdit() {
    setEditingId(null)
    setName('')
    setEmoji('🛍️')
    setParent('')
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = { name, emoji, parent: parent || null }
      if (editingId) {
        await api.put(`/categories/${editingId}`, payload, true)
      } else {
        await api.post('/categories', { ...payload, order: categories.length }, true)
      }
      cancelEdit()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this category? Its subcategories will also be deleted.')) return
    await api.delete(`/categories/${id}`, true)
    await load()
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-1">Categories</h1>
      <p className="text-sm text-gray-500 mb-4">Top-level categories aur unki subcategories yahan manage karo.</p>

      <div className="bg-luxe-panel border border-gold/10 rounded-lg p-5 mb-5 max-w-lg">
        {error && <div className="bg-blush-from/10 border border-blush-from/30 text-blush-from text-sm px-3 py-2 rounded mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <select value={parent} onChange={(e) => setParent(e.target.value)} className="w-full bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 text-sm">
            <option value="">— Top-level category —</option>
            {topLevel.map((c) => (
              <option key={c._id} value={c._id}>Subcategory of: {c.emoji} {c.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="w-16 bg-black/40 border border-gold/30 text-white rounded-md px-2 py-2 text-center text-lg" />
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Name e.g. Notebooks" className="flex-1 bg-black/40 border border-gold/30 text-white rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-wrap gap-1">
            {COMMON_EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setEmoji(e)} className="text-lg hover:scale-125 transition-transform">{e}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-gold hover:bg-gold-light text-black rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60">
              {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </button>
            {editingId && <button type="button" onClick={cancelEdit} className="text-gray-400 text-sm flex items-center gap-1"><X size={14} /> Cancel</button>}
          </div>
        </form>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <div className="space-y-3">
          {topLevel.map((c) => (
            <div key={c._id} className="bg-luxe-panel border border-gold/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 text-white font-medium">
                  <span className="text-xl">{c.emoji}</span> {c.name}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(c)} className="text-gold"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(c._id)} className="text-blush-from"><Trash2 size={14} /></button>
                </div>
              </div>
              {subOf(c._id).length > 0 && (
                <div className="flex flex-wrap gap-2 pl-6">
                  {subOf(c._id).map((sub) => (
                    <span key={sub._id} className="flex items-center gap-1 text-xs bg-black/30 border border-gold/10 text-gray-300 px-2 py-1 rounded-full">
                      {sub.emoji} {sub.name}
                      <button onClick={() => startEdit(sub)} className="text-gold ml-1"><Pencil size={10} /></button>
                      <button onClick={() => handleDelete(sub._id)} className="text-blush-from"><Trash2 size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {topLevel.length === 0 && <p className="text-gray-500 text-sm">Koi category nahi hai. Upar se add karo.</p>}
        </div>
      )}
    </div>
  )
}
