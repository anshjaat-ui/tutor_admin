const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function getToken() {
  return localStorage.getItem('admin_token')
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Something went wrong')
  return data
}

// File upload ke liye alag function - JSON nahi, FormData bhejta hai
async function uploadFile(path, file) {
  const token = getToken()
  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Upload failed')
  return data
}

export const api = {
  get: (path, auth = false) => request(path, { method: 'GET', auth }),
  post: (path, body, auth = false) => request(path, { method: 'POST', body, auth }),
  put: (path, body, auth = false) => request(path, { method: 'PUT', body, auth }),
  patch: (path, body, auth = false) => request(path, { method: 'PATCH', body, auth }),
  delete: (path, auth = false) => request(path, { method: 'DELETE', auth }),
  upload: (path, file) => uploadFile(path, file),
}
