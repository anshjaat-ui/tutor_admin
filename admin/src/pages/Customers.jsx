import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Customers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/users', true).then(setUsers).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500 text-sm">Loading customers...</p>

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-4">Customers ({users.length})</h1>

      <div className="bg-luxe-panel border border-gold/10 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/30 text-left text-gray-400">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Saved Addresses</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-gold/10">
                <td className="p-3 font-medium text-white">{u.name}</td>
                <td className="p-3 text-gray-400">{u.email}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="p-3 text-gray-500">{u.addresses?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-4 text-gray-500 text-sm">Koi customer nahi hai.</p>}
      </div>
    </div>
  )
}
