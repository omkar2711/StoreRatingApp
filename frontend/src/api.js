const API_URLS = [
  import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  'http://localhost:5000/api',
]

export async function request(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let lastError = null

  for (const baseUrl of API_URLS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
      })

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        lastError = new Error('Unexpected response from the API')
        continue
      }

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message || 'Request failed')
      }

      return data
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('Request failed')
}
