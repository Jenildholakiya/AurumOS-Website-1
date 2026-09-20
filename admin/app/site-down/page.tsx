'use client'

import { useEffect } from 'react'

// Shown on apex `localhost:3000` when the website app (expected on :3001)
// isn't reachable, instead of crashing with AggregateError [ECONNREFUSED].
// Retries automatically every 5s so the site appears on its own once started.
export default function SiteDown() {
  useEffect(() => {
    const t = setInterval(() => window.location.reload(), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#faf7f2',
        color: '#1c1917',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 560,
          margin: 24,
          padding: 40,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 30px rgba(0,0,0,.08)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            margin: '0 auto 20px',
            borderRadius: '50%',
            border: '3px solid #e7e5e4',
            borderTopColor: '#b45309',
            animation: 'aurum-spin 1s linear infinite',
          }}
        />
        <style>{`@keyframes aurum-spin { to { transform: rotate(360deg); } }`}</style>
        <h1 style={{ margin: '0 0 8px', fontSize: 24 }}>Website isn&apos;t running yet</h1>
        <p style={{ color: '#57534e' }}>
          The shop website (port <b>3001</b>) isn&apos;t answering. This page retries
          automatically — start the website and it will appear here on its own.
        </p>
        <code
          style={{
            display: 'block',
            marginTop: 16,
            padding: 12,
            background: '#1c1917',
            color: '#fbbf24',
            borderRadius: 8,
            fontSize: 13,
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
          }}
        >
          {`cd "C:\\Users\\abc\\Desktop\\aurumos"\nnpm run dev -- --port 3001`}
        </code>
        <p style={{ marginTop: 16, fontSize: 14 }}>
          Looking for the admin panel instead? Go to{' '}
          <a style={{ color: '#b45309' }} href="http://admin.localhost:3000/login">
            admin.localhost:3000/login
          </a>
        </p>
      </div>
    </div>
  )
}
