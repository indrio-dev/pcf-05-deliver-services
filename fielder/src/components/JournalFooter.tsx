'use client'

import Link from 'next/link'

export function JournalFooter() {
  return (
    <footer className="journal-footer">
      <div className="journal-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <span>Fielder</span>
          <nav className="journal-nav">
            <Link href="/field-guide">Field Guide</Link>
            <Link href="/about">About</Link>
          </nav>
        </div>
        <p style={{ marginTop: 'var(--space-md)', fontSize: '0.8125rem' }}>
          &copy; {new Date().getFullYear()} Fielder. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default JournalFooter
