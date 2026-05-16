import { useEffect, useState } from 'react'
import { request } from './api'
import './App.css'

const emptyLogin = { email: '', password: '' }
const emptySignup = { name: '', email: '', password: '', address: '' }
const emptyStore = { name: '', email: '', address: '', ownerId: '' }
const emptyUser = { name: '', email: '', password: '', address: '', role: 'user' }

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [stores, setStores] = useState([])
  const [myRatings, setMyRatings] = useState({})
  const [ownerStores, setOwnerStores] = useState([])
  const [users, setUsers] = useState([])
  const [summary, setSummary] = useState({ users: 0, stores: 0, ratings: 0 })
  const [loginForm, setLoginForm] = useState(emptyLogin)
  const [signupForm, setSignupForm] = useState(emptySignup)
  const [storeForm, setStoreForm] = useState(emptyStore)
  const [userForm, setUserForm] = useState(emptyUser)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      return
    }

    request('/auth/me')
      .then((me) => {
        setUser(me)
        localStorage.setItem('user', JSON.stringify(me))
      })
      .catch(() => {
        handleLogout()
      })
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    if (user.role === 'user') {
      loadUserView(search)
    }

    if (user.role === 'admin') {
      loadAdminView()
    }

    if (user.role === 'store_owner') {
      loadOwnerView()
    }
  }, [user, search])

  async function loadUserView(currentSearch) {
    try {
      setError('')
      const suffix = currentSearch ? `?search=${encodeURIComponent(currentSearch)}` : ''
      const [storeData, ratingData] = await Promise.all([
        request(`/stores${suffix}`),
        request('/ratings/mine'),
      ])

      setStores(storeData)
      const nextRatings = {}
      ratingData.forEach((item) => {
        nextRatings[item.store_id] = item.rating
      })
      setMyRatings(nextRatings)
    } catch (err) {
      setError(err.message)
    }
  }

  async function loadAdminView() {
    try {
      setError('')
      const [summaryData, userData, storeData] = await Promise.all([
        request('/users/summary'),
        request('/users'),
        request('/stores'),
      ])

      setSummary(summaryData)
      setUsers(userData)
      setStores(storeData)
    } catch (err) {
      setError(err.message)
    }
  }

  async function loadOwnerView() {
    try {
      setError('')
      const data = await request('/stores/owner')
      setOwnerStores(data)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleLogin(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')

    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      })

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      setLoginForm(emptyLogin)
      setMode('login')
      setMessage('Logged in successfully')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSignup(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')

    try {
      await request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupForm),
      })

      setSignupForm(emptySignup)
      setMode('login')
      setMessage('Account created. You can log in now.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitRating(storeId, rating) {
    try {
      await request('/ratings', {
        method: 'POST',
        body: JSON.stringify({ storeId, rating }),
      })

      setMessage('Rating saved')
      loadUserView(search)
    } catch (err) {
      setError(err.message)
    }
  }

  async function createStore(event) {
    event.preventDefault()

    try {
      await request('/stores', {
        method: 'POST',
        body: JSON.stringify(storeForm),
      })

      setStoreForm(emptyStore)
      setMessage('Store added')
      loadAdminView()
    } catch (err) {
      setError(err.message)
    }
  }

  async function createUser(event) {
    event.preventDefault()

    try {
      await request('/users', {
        method: 'POST',
        body: JSON.stringify(userForm),
      })

      setUserForm(emptyUser)
      setMessage('User added')
      loadAdminView()
    } catch (err) {
      setError(err.message)
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setStores([])
    setMyRatings({})
    setOwnerStores([])
    setUsers([])
    setSummary({ users: 0, stores: 0, ratings: 0 })
    setMessage('')
    setError('')
  }

  if (!user) {
    return (
      <main className="page auth-page">
        <section className="hero card">
          <p className="eyebrow">Store Rating App</p>
          <h1>Simple ratings for stores, users, and owners.</h1>
          <p className="lead">
            A small beginner-friendly full stack app with React, Express, and PostgreSQL.
          </p>
          <div className="demo-box">
            <p><strong>Demo logins</strong></p>
            <p>Admin: admin@example.com / Admin@123</p>
            <p>Owner: owner@example.com / Owner@123</p>
            <p>User: user@example.com / User@123</p>
          </div>
        </section>

        <section className="card auth-card">
          <div className="tab-row">
            <button type="button" className={mode === 'login' ? 'tab active' : 'tab'} onClick={() => setMode('login')}>
              Login
            </button>
            <button type="button" className={mode === 'signup' ? 'tab active' : 'tab'} onClick={() => setMode('signup')}>
              Sign up
            </button>
          </div>

          {error ? <p className="notice error">{error}</p> : null}
          {message ? <p className="notice success">{message}</p> : null}

          {mode === 'login' ? (
            <form className="form" onSubmit={handleLogin}>
              <label>
                Email
                <input
                  value={loginForm.email}
                  onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                  type="email"
                  required
                />
              </label>
              <label>
                Password
                <input
                  value={loginForm.password}
                  onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                  type="password"
                  required
                />
              </label>
              <button className="primary" type="submit" disabled={busy}>
                {busy ? 'Please wait...' : 'Login'}
              </button>
            </form>
          ) : (
            <form className="form" onSubmit={handleSignup}>
              <label>
                Name
                <input
                  value={signupForm.name}
                  onChange={(event) => setSignupForm({ ...signupForm, name: event.target.value })}
                  type="text"
                  required
                />
              </label>
              <label>
                Email
                <input
                  value={signupForm.email}
                  onChange={(event) => setSignupForm({ ...signupForm, email: event.target.value })}
                  type="email"
                  required
                />
              </label>
              <label>
                Password
                <input
                  value={signupForm.password}
                  onChange={(event) => setSignupForm({ ...signupForm, password: event.target.value })}
                  type="password"
                  required
                />
              </label>
              <label>
                Address
                <input
                  value={signupForm.address}
                  onChange={(event) => setSignupForm({ ...signupForm, address: event.target.value })}
                  type="text"
                />
              </label>
              <button className="primary" type="submit" disabled={busy}>
                {busy ? 'Please wait...' : 'Create account'}
              </button>
            </form>
          )}
        </section>
      </main>
    )
  }

  return (
    <main className="page app-page">
      <header className="topbar card">
        <div>
          <p className="eyebrow">Store Rating App</p>
          <h2>Hello, {user.name}</h2>
          <p className="muted">Role: {user.role.replace('_', ' ')}</p>
        </div>
        <button type="button" className="secondary" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {error ? <p className="notice error">{error}</p> : null}
      {message ? <p className="notice success">{message}</p> : null}

      {user.role === 'user' ? (
        <section className="stack">
          <div className="card form-card">
            <div className="section-head">
              <h3>Stores</h3>
              <input
                className="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search stores"
              />
            </div>

            <div className="store-list">
              {stores.map((store) => (
                <article className="store-item" key={store.id}>
                  <div>
                    <h4>{store.name}</h4>
                    <p className="muted">{store.address || 'No address yet'}</p>
                    <p className="muted">Average rating: {store.avg_rating}</p>
                  </div>

                  <div className="rating-row">
                    <span className="muted">Your rating:</span>
                    <strong>{myRatings[store.id] || 'none'}</strong>
                    <div className="buttons">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={myRatings[store.id] === value ? 'star active' : 'star'}
                          onClick={() => submitRating(store.id, value)}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {user.role === 'admin' ? (
        <section className="stack">
          <div className="stats">
            <div className="card stat">
              <span>Total users</span>
              <strong>{summary.users}</strong>
            </div>
            <div className="card stat">
              <span>Total stores</span>
              <strong>{summary.stores}</strong>
            </div>
            <div className="card stat">
              <span>Total ratings</span>
              <strong>{summary.ratings}</strong>
            </div>
          </div>

          <div className="two-col">
            <form className="card form-card" onSubmit={createStore}>
              <h3>Add store</h3>
              <label>
                Name
                <input value={storeForm.name} onChange={(event) => setStoreForm({ ...storeForm, name: event.target.value })} required />
              </label>
              <label>
                Email
                <input value={storeForm.email} onChange={(event) => setStoreForm({ ...storeForm, email: event.target.value })} />
              </label>
              <label>
                Address
                <input value={storeForm.address} onChange={(event) => setStoreForm({ ...storeForm, address: event.target.value })} />
              </label>
              <label>
                Owner id
                <input value={storeForm.ownerId} onChange={(event) => setStoreForm({ ...storeForm, ownerId: event.target.value })} />
              </label>
              <button className="primary" type="submit">Save store</button>
            </form>

            <form className="card form-card" onSubmit={createUser}>
              <h3>Add user</h3>
              <label>
                Name
                <input value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} required />
              </label>
              <label>
                Email
                <input value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} required />
              </label>
              <label>
                Password
                <input value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} required />
              </label>
              <label>
                Address
                <input value={userForm.address} onChange={(event) => setUserForm({ ...userForm, address: event.target.value })} />
              </label>
              <label>
                Role
                <select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}>
                  <option value="user">user</option>
                  <option value="store_owner">store_owner</option>
                  <option value="admin">admin</option>
                </select>
              </label>
              <button className="primary" type="submit">Save user</button>
            </form>
          </div>

          <div className="card table-card">
            <h3>Stores</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Average</th>
                    <th>Ratings</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr key={store.id}>
                      <td>{store.name}</td>
                      <td>{store.address}</td>
                      <td>{store.avg_rating}</td>
                      <td>{store.rating_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Users</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.email}</td>
                      <td>{item.address}</td>
                      <td>{item.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {user.role === 'store_owner' ? (
        <section className="card table-card">
          <h3>Your stores</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Average</th>
                  <th>Ratings</th>
                </tr>
              </thead>
              <tbody>
                {ownerStores.map((store) => (
                  <tr key={store.id}>
                    <td>{store.name}</td>
                    <td>{store.address}</td>
                    <td>{store.avg_rating}</td>
                    <td>{store.rating_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  )
}

export default App
