'use client'

import Link from 'next/link'

export function JournalHeader() {
  return (
    <header className="journal-header">
      <div className="journal-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '1.25rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Fielder
            </span>
          </Link>
          <nav className="journal-nav">
            <Link href="/">Browse</Link>
            <Link href="/about">About</Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default JournalHeader
