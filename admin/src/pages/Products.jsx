import { useEffect, useState } from 'react'
import { Pencil, Trash2, Plus, X, Upload } from 'lucide-react'
import { api } from '../api/client'

const emptyForm = {
  name: '', description: '', category: '', subcategory: '', brand: '',
  price: '', mrp: '', stock: '', images: '', hasSizes: false, sizes: '',
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState([])

  function suggestedSizes(category, subcategory = '') {
    const text = `${category || ''} ${subcategory || ''}`.toLowerCase()
    if (/(under\s*garment|innerwear|underwear)/.test(text)) return ['S', 'M', 'L', 'XL', 'XXL']
    if (/(garment|clothing|shirt|t-?shirt|jeans|trouser|pant|dress|kurti|saree)/.test(text)) return ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    if (/(shoe|sandal|sandel|slipper|footwear)/.test(text)) return ['5', '6', '7', '8', '9', '10']
    return []
  }

  async function loadProducts() {
    setLoading(true)
    try {
      const data = await api.get('/products?page=1')
      let all = data.products
      for (let p = 2; p <= data.pages; p++) {
        const next = await api.get(`/products?page=${p}`)
        all = all.concat(next.products)
      }
      setProducts(all)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    api.get('/categories').then(setCategories).catch(() => setCategories([]))
  }, [])

  function openAddForm() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
    setError('')
  }

  function openEditForm(p) {
    setForm({
      name: p.name, description: p.description, category: p.category, subcategory: p.subcategory || '',
      brand: p.brand || '', price: p.price, mrp: p.mrp, stock: p.stock,
      images: (p.images || []).join(', '),
      hasSizes: Boolean(p.hasSizes || p.sizes?.length),
      sizes: (p.sizes || []).join(', '),
    })
    setEditingId(p._id)
    setShowForm(true)
    setError('')
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const result = await api.upload('/upload', file)
      const existing = form.images ? form.images.split(',').map((s) => s.trim()).filter(Boolean) : []
      setForm({ ...form, images: [...existing, result.url].join(', ') })
    } catch (err) {
      setError(err.message + ' — image URL manually paste kar sakte ho neeche ke box mein.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const sizes = form.hasSizes
      ? form.sizes.split(',').map((s) => s.trim()).filter(Boolean)
      : []
    if (form.hasSizes && sizes.length === 0) {
      setError('Size option enabled hai, kam se kam 1 size add karo.')
      setSaving(false)
      return
    }

    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      subcategory: form.subcategory || undefined,
      brand: form.brand,
      price: Number(form.price),
      mrp: Number(form.mrp),
      stock: Number(form.stock),
      images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
      hasSizes: Boolean(form.hasSizes),
      sizes,
    }

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload, true)
      } else {
        await api.post('/products', payload, true)
      }
      setShowForm(false)
      await loadProducts()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Ye product delete karna hai?')) return
    await api.delete(`/products/${id}`, true)
    await loadProducts()
  }

  function toggleSelect(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleSelectAll() {
    setSelected(selected.length === products.length ? [] : products.map((p) => p._id))
  }

  async function bulkDelete() {
    if (!confirm(`${selected.length} products delete karne hain?`)) return
    await Promise.all(selected.map((id) => api.delete(`/products/${id}`, true)))
    setSelected([])
    await loadProducts()
  }

  const previewImages = form.images ? form.images.split(',').map((s) => s.trim()).filter(Boolean) : []

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-white">Products ({products.length})</h1>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <button onClick={bulkDelete} className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              <Trash2 size={16} /> Delete Selected ({selected.length})
            </button>
          )}
          <button onClick={openAddForm} className="flex items-center gap-1 bg-gold hover:bg-gold-light text-black px-4 py-2 rounded-md text-sm font-medium">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-luxe-panel border border-gold/10 rounded-lg p-5 mb-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-medium text-white">{editingId ? 'Edit Product' : 'New Product'}</h2>
            <button onClick={() => setShowForm(false)}><X size={18} /></button>
          </div>

          {error && <div className="bg-blush-from/10 border border-blush-from/30 text-blush-from text-sm px-3 py-2 rounded mb-3">{error}</div>}

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-sm">
            <input name="name" required placeholder="Product name" value={form.name} onChange={handleChange} className="border bg-black/40 border-gold/30 text-white rounded-md px-3 py-2 col-span-2" />
            <textarea name="description" required placeholder="Description" value={form.description} onChange={handleChange} className="border bg-black/40 border-gold/30 text-white rounded-md px-3 py-2 col-span-2" rows={2} />
            <select name="category" required value={form.category} onChange={(e) => {
              const category = e.target.value
              const defaults = suggestedSizes(category)
              setForm({
                ...form,
                category,
                subcategory: '',
                ...(defaults.length ? { hasSizes: true, sizes: defaults.join(', ') } : {}),
              })
            }} className="border bg-black/40 border-gold/30 text-white rounded-md px-3 py-2">
              <option value="">Select category</option>
              {categories.filter((c) => !c.parent).map((c) => (
                <option key={c._id} value={c.name}>{c.emoji} {c.name}</option>
              ))}
            </select>

            {(() => {
              const selectedCat = categories.find((c) => !c.parent && c.name === form.category)
              const subOptions = selectedCat ? categories.filter((c) => c.parent === selectedCat._id) : []
              if (subOptions.length === 0) return null
              return (
                <select name="subcategory" value={form.subcategory} onChange={(e) => {
                  const subcategory = e.target.value
                  const defaults = suggestedSizes(form.category, subcategory)
                  setForm({
                    ...form,
                    subcategory,
                    ...(defaults.length && (!form.sizes || !form.hasSizes) ? { hasSizes: true, sizes: defaults.join(', ') } : {}),
                  })
                }} className="border bg-black/40 border-gold/30 text-white rounded-md px-3 py-2">
                  <option value="">Subcategory (optional)</option>
                  {subOptions.map((s) => (
                    <option key={s._id} value={s.name}>{s.emoji} {s.name}</option>
                  ))}
                </select>
              )
            })()}
            <input name="brand" placeholder="Brand" value={form.brand} onChange={handleChange} className="border bg-black/40 border-gold/30 text-white rounded-md px-3 py-2" />
            <input name="price" type="number" required placeholder="Price (₹)" value={form.price} onChange={handleChange} className="border bg-black/40 border-gold/30 text-white rounded-md px-3 py-2" />
            <input name="mrp" type="number" required placeholder="MRP (₹)" value={form.mrp} onChange={handleChange} className="border bg-black/40 border-gold/30 text-white rounded-md px-3 py-2" />
            <input name="stock" type="number" required placeholder="Stock quantity" value={form.stock} onChange={handleChange} className="border bg-black/40 border-gold/30 text-white rounded-md px-3 py-2 col-span-2" />

            <div className="col-span-2 border border-gold/20 rounded-md p-3 bg-black/20">
              <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasSizes}
                  onChange={(e) => {
                    const checked = e.target.checked
                    const defaults = suggestedSizes(form.category, form.subcategory)
                    setForm({
                      ...form,
                      hasSizes: checked,
                      sizes: checked && !form.sizes && defaults.length ? defaults.join(', ') : form.sizes,
                    })
                  }}
                />
                <span>Enable size option for this product</span>
              </label>
              {form.hasSizes && (
                <div className="mt-2">
                  <input
                    name="sizes"
                    value={form.sizes}
                    onChange={handleChange}
                    placeholder="Sizes comma-separated: S, M, L, XL / 5, 6, 7, 8"
                    className="border bg-black/40 border-gold/30 text-white rounded-md px-3 py-2 w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Admin yahin se sizes add/remove/edit kar sakta hai. Garments/under garments ke liye letter sizes, shoes/sandals ke liye numeric sizes suggested hain.</p>
                </div>
              )}
            </div>

            <div className="col-span-2 border border-dashed border-gold/30 rounded-md p-3">
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer mb-2">
                <Upload size={16} />
                {uploading ? 'Uploading...' : 'Upload image from computer'}
                <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
              </label>
              <input
                name="images"
                required={previewImages.length === 0}
                placeholder="Ya image URL(s) paste karo, comma-separated"
                value={form.images}
                onChange={handleChange}
                className="border bg-black/40 border-gold/30 text-white rounded-md px-3 py-2 w-full"
              />
              {previewImages.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {previewImages.map((url, i) => (
                    <img key={i} src={url} alt="preview" className="w-14 h-14 object-cover rounded border" />
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={saving} className="col-span-2 bg-gold hover:bg-gold-light text-black rounded-md py-2 text-sm font-medium disabled:opacity-60">
              {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
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
                <th className="p-3"><input type="checkbox" checked={selected.length === products.length && products.length > 0} onChange={toggleSelectAll} /></th>
                <th className="p-3">Image</th>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Sizes</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-t border-gold/10">
                  <td className="p-3"><input type="checkbox" checked={selected.includes(p._id)} onChange={() => toggleSelect(p._id)} /></td>
                  <td className="p-3"><img src={p.images?.[0]} alt={p.name} className="w-12 h-12 object-contain bg-white rounded p-1" /></td>
                  <td className="p-3 max-w-xs text-gray-200">{p.name}</td>
                  <td className="p-3 text-gray-300">{p.category}</td>
                  <td className="p-3 text-gray-300">₹{p.price.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-gray-300">{p.stock}</td>
                  <td className="p-3 text-gray-300">{p.hasSizes && p.sizes?.length ? p.sizes.join(', ') : '—'}</td>
                  <td className="p-3 flex gap-3">
                    <button onClick={() => openEditForm(p)} className="text-gold hover:underline flex items-center gap-1"><Pencil size={14} /> Edit</button>
                    <button onClick={() => handleDelete(p._id)} className="text-blush-from hover:underline flex items-center gap-1"><Trash2 size={14} /> Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <p className="p-4 text-gray-500 text-sm">Koi product nahi hai.</p>}
        </div>
      )}
    </div>
  )
}
