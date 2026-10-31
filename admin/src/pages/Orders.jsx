import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { api } from '../api/client'
import OrderTracker from '../components/OrderTracker'

const statusOptions = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']

const paymentLabels = {
  qr: 'QR Code',
  upi: 'UPI',
  cod: 'Cash on Delivery',
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  async function loadOrders() {
    setLoading(true)
    try {
      setOrders(await api.get('/orders', true))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [])

  async function changeStatus(id, status) {
    setBusyId(id)
    try {
      await api.put(`/orders/${id}/status`, { status }, true)
      await loadOrders()
    } finally {
      setBusyId(null)
    }
  }

  async function confirmPayment(id) {
    setBusyId(id)
    try {
      await api.put(`/orders/${id}/confirm-payment`, {}, true)
      await loadOrders()
    } finally {
      setBusyId(null)
    }
  }

  function addressToMapUrl(addr) {
    const query = `${addr.line1}, ${addr.line2 || ''}, ${addr.city}, ${addr.state} ${addr.pincode}`
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }

  const filteredOrders = orders.filter((o) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'paid' && o.isPaid) ||
      (filter === 'unpaid' && !o.isPaid) ||
      (filter === 'cod' && o.paymentMethod === 'cod') ||
      (filter === 'online' && o.paymentMethod !== 'cod') ||
      o.status === filter
    const matchesSearch =
      !search ||
      o._id.includes(search) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) return <p className="text-gray-500 text-sm">Loading orders...</p>

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-xl font-bold text-white">Orders ({filteredOrders.length})</h1>
        <div className="flex flex-wrap gap-2">
          <input
            placeholder="Search by name, email, order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-1.5 text-sm w-64"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-black/40 border border-gold/30 text-white rounded-md px-3 py-1.5 text-sm">
            <option value="all">All orders</option>
            <option value="unpaid">Payment pending</option>
            <option value="paid">Paid</option>
            <option value="cod">COD orders</option>
            <option value="online">QR/UPI orders</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 && <p className="text-gray-500 text-sm">Koi order match nahi hua.</p>}

      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <div key={order._id} className="bg-luxe-panel border border-gold/10 rounded-lg p-4">
            <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
              <div>
                <p className="text-sm font-medium text-white">Order #{order._id.slice(-8)}</p>
                <p className="text-xs text-gray-500">{order.user?.name} · {order.user?.email}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">₹{order.totalPrice.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            <div className="text-sm mb-2 text-gray-400">
              {order.items.map((item) => (
                <div key={item.product}>{item.name} × {item.qty}</div>
              ))}
            </div>

            {order.shippingAddress && (
              <div className="text-xs text-gray-400 bg-black/30 rounded-md p-2 mb-2 flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p>{order.shippingAddress.fullName} · {order.shippingAddress.phone}</p>
                  <p>{order.shippingAddress.line1}, {order.shippingAddress.line2} {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                  <a href={addressToMapUrl(order.shippingAddress)} target="_blank" rel="noreferrer" className="text-gold hover:underline">
                    View on Google Maps →
                  </a>
                </div>
              </div>
            )}

            {order.isPaid && <OrderTracker status={order.status} />}

            <div className="flex flex-wrap items-center gap-3 border-t border-gold/10 pt-3">
              <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                {paymentLabels[order.paymentMethod] || order.paymentMethod}
              </span>

              <span className={`text-xs px-2 py-1 rounded-full ${order.isPaid ? 'bg-green-500/10 text-green-400 border border-green-500/30' : order.paymentClaimed ? 'bg-gold/10 text-gold border border-gold/30' : 'bg-blush-from/10 text-blush-from border border-blush-from/30'}`}>
                {order.isPaid ? 'Paid' : order.paymentClaimed ? 'Payment claimed' : order.paymentMethod === 'cod' ? 'Pay on delivery' : 'Not paid'}
              </span>

              {order.upiRef && <span className="text-xs text-gray-500">UTR: {order.upiRef}</span>}

              {!order.isPaid && order.paymentClaimed && (
                <button
                  onClick={() => confirmPayment(order._id)}
                  disabled={busyId === order._id}
                  className="text-xs bg-gold text-black px-3 py-1 rounded-full disabled:opacity-60"
                >
                  {busyId === order._id ? 'Confirming...' : 'Confirm Payment'}
                </button>
              )}

              <select
                value={order.status}
                onChange={(e) => changeStatus(order._id, e.target.value)}
                disabled={busyId === order._id}
                className="text-xs bg-black/40 border border-gold/30 text-white rounded px-2 py-1 ml-auto"
              >
                {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
