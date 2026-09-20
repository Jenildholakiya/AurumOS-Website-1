'use client'

// Last-resort safety net: if anything above the layout throws (e.g. a proxy
// blip to the website on :3001), show a friendly screen with a retry button
// instead of a blank page or a raw AggregateError stack.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isConnRefused =
    /ECONNREFUSED|Failed to fetch|fetch failed/i.test(error?.message || '')
  return (
    <html lang="en">
      <body
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
        <div style={{ maxWidth: 520, margin: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22 }}>
            {isConnRefused ? 'Website isn’t running yet' : 'Something went wrong'}
          </h1>
          <p style={{ color: '#57534e' }}>
            {isConnRefused
              ? 'The shop website (port 3001) isn’t answering. Start it, then retry.'
              : error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 12,
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#b45309',
              color: '#fff',
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
