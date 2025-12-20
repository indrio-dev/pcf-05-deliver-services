import { JournalHeader } from '@/components/JournalHeader'
import { JournalFooter } from '@/components/JournalFooter'

export const metadata = {
  title: 'Field Guide | Fielder',
  description: 'Learn about seasonal produce, quality indicators, and how to find the best local harvests.',
}

export default function FieldGuidePage() {
  return (
    <div className="journal-page">
      <JournalHeader />

      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: 'var(--space-xl) var(--space-lg)',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2rem',
          fontWeight: 400,
          marginBottom: 'var(--space-lg)',
        }}>
          Field Guide
        </h1>

        <p style={{
          fontFamily: 'var(--font-typewriter)',
          fontSize: '0.9375rem',
          lineHeight: 1.7,
          color: 'var(--color-ink-muted)',
        }}>
          Coming soon.
        </p>
      </main>

      <JournalFooter />
    </div>
  )
}
