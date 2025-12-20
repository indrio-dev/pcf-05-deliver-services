import Link from 'next/link'
import { Header } from '@/components/Header'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <Header />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-serif text-4xl text-stone-900 mb-8">About Fielder</h1>

        <div className="prose prose-stone">
          <p className="text-lg text-stone-600 leading-relaxed">
            Fielder helps you discover fresh, locally-grown produce at peak quality.
            We use growing degree day models and real-time weather data to predict
            optimal harvest windows for fruits and vegetables across American growing regions.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-8 mb-4">Our Mission</h2>
          <p className="text-stone-600 leading-relaxed">
            We believe everyone deserves access to produce at its absolute best.
            By connecting consumers with regional harvests at peak ripeness,
            we're building a more transparent, quality-focused food system.
          </p>

          <h2 className="font-serif text-2xl text-stone-900 mt-8 mb-4">How It Works</h2>
          <p className="text-stone-600 leading-relaxed">
            Our prediction models track accumulated growing degree days (GDD) for each
            crop and region, combining historical climate data with current weather
            to estimate harvest timing and peak quality windows.
          </p>
        </div>

        <div className="mt-12">
          <Link
            href="/discover"
            className="inline-flex items-center px-6 py-3 bg-[var(--color-accent)] text-white font-mono text-sm uppercase tracking-wider hover:bg-[var(--color-accent-dark)] transition-colors"
          >
            Discover Fresh Produce
          </Link>
        </div>
      </main>
    </div>
  )
}
