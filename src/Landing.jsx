import React from 'react'
import './Landing.css'

export default function Landing({ onEnter }) {
  return (
    <main className="minimal-root" role="main">
      <div className="minimal-inner">
        <div className="logo">✦</div>
        <h1 className="big">Chat, faster.</h1>
        <p className="mini">Secure • Realtime</p>
        <button className="enter" onClick={onEnter} aria-label="Enter app">Enter</button>
      </div>
    </main>
  )
}
