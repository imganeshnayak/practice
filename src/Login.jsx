import React, { useState } from 'react'
import './App.css'

export default function Login({ onLogin, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Provide email and password')
      return
    }

    // Simple client-side check: compare with stored registration
    try {
      const raw = localStorage.getItem('practice_current_user')
      if (raw) {
        const user = JSON.parse(raw)
        if (user.email === email.trim()) {
          // login success
          if (onLogin) onLogin({ id: user.id || null, name: user.name || 'User', email: user.email })
          return
        }
      }
    } catch (err) {
      // ignore
    }

    setError("No account found with this email. Please register first.")
  }

  return (
    <div className="registration-container">
      <h3>Login</h3>
      <form className="registration-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>

        <label>
          Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" />
        </label>

        {error && <div className="error">{error}</div>}

        <div className="form-actions">
          <button type="submit">Sign in</button>
          <button type="button" className="secondary" onClick={onClose}>Back</button>
        </div>
      </form>
    </div>
  )
}
