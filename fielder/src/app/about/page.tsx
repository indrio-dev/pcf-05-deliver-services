import Link from 'next/link'
import { JournalHeader } from '@/components/JournalHeader'
import { JournalFooter } from '@/components/JournalFooter'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--color-manila)]">
      <JournalHeader />

      <main className="mx-auto max-w-[var(--journal-max-width)] px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-typewriter text-3xl text-stone-800 mb-8 border-b-2 border-stone-300 pb-4">About Fielder</h1>

        <div className="space-y-8 font-typewriter text-stone-700 leading-relaxed">
          <p className="text-lg">
            Fielder helps you discover fresh, locally-grown produce at peak quality.
            We use growing degree day models and real-time weather data to predict
            optimal harvest windows for fruits and vegetables across American growing regions.
          </p>

          <section>
            <h2 className="text-xl text-stone-800 mb-3 uppercase tracking-wider">Our Mission</h2>
            <p>
              We believe everyone deserves access to produce at its absolute best.
              By connecting consumers with regional harvests at peak ripeness,
              we're building a more transparent, quality-focused food system.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-stone-800 mb-3 uppercase tracking-wider">How It Works</h2>
            <p>
              Our prediction models track accumulated growing degree days (GDD) for each
              crop and region, combining historical climate data with current weather
              to estimate harvest timing and peak quality windows.
            </p>
          </section>
        </div>

        <div className="mt-12">
          <Link
            href="/discover"
            className="inline-flex items-center px-6 py-3 border-2 border-stone-800 text-stone-800 font-typewriter text-sm uppercase tracking-wider hover:bg-stone-800 hover:text-[var(--color-manila)] transition-colors"
          >
            Discover Fresh Produce →
          </Link>
        </div>
      </main>

      <JournalFooter />
    </div>
  )
}
