/**
 * Ark of Taste Import Parser
 *
 * Parses the Slow Food USA Ark of Taste CSV and prepares it for import into Fielder
 */

import fs from 'fs'
import path from 'path'

interface ArkEntry {
  name: string
  primaryRegion: string
  category: string
  description: string
  photographer: string
}

interface ParsedArk {
  total: number
  byCategory: Record<string, number>
  byRegion: Record<string, number>
  produceEntries: ArkEntry[]  // Fruits, vegetables, legumes, grains
  livestockEntries: ArkEntry[]
  otherEntries: ArkEntry[]
}

// Simple CSV parser (handles quoted fields with commas)
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current.trim())

  return fields
}

function parseArkCSV(csvPath: string): ParsedArk {
  const content = fs.readFileSync(csvPath, 'utf-8')
  const lines = content.split('\n')

  // Remove BOM if present
  const header = lines[0].replace(/^\uFEFF/, '')
  const headerFields = parseCSVLine(header)

  const entries: ArkEntry[] = []
  const byCategory: Record<string, number> = {}
  const byRegion: Record<string, number> = {}

  // Parse data lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const fields = parseCSVLine(line)
    if (fields.length < 5) continue  // Skip incomplete lines

    const entry: ArkEntry = {
      name: fields[0],
      primaryRegion: fields[1],
      category: fields[2],
      description: fields[3],
      photographer: fields[4]
    }

    entries.push(entry)

    // Count by category
    byCategory[entry.category] = (byCategory[entry.category] || 0) + 1

    // Count by region
    byRegion[entry.primaryRegion] = (byRegion[entry.primaryRegion] || 0) + 1
  }

  // Categorize entries
  const produceCategories = [
    'Fruits and Preserves',
    'Vegetables',
    'Legumes',
    'Grains and Flours',
    'Nuts and Seeds'
  ]

  const livestockCategories = [
    'Livestock and Rare Breeds',
    'Dairy',
    'Fish and seafood'
  ]

  const produceEntries = entries.filter(e =>
    produceCategories.some(cat => e.category.includes(cat))
  )

  const livestockEntries = entries.filter(e =>
    livestockCategories.some(cat => e.category.includes(cat))
  )

  const otherEntries = entries.filter(e =>
    !produceCategories.some(cat => e.category.includes(cat)) &&
    !livestockCategories.some(cat => e.category.includes(cat))
  )

  return {
    total: entries.length,
    byCategory,
    byRegion,
    produceEntries,
    livestockEntries,
    otherEntries
  }
}

// Main execution
const csvPath = '/mnt/c/Users/abrow/Downloads/Gallery Slides View.csv'
const parsed = parseArkCSV(csvPath)

console.log('=== ARK OF TASTE ANALYSIS ===\n')
console.log(`Total entries: ${parsed.total}\n`)

console.log('By Category:')
Object.entries(parsed.byCategory)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 15)
  .forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`)
  })

console.log('\nBy Region:')
Object.entries(parsed.byRegion)
  .sort(([, a], [, b]) => b - a)
  .forEach(([region, count]) => {
    console.log(`  ${region}: ${count}`)
  })

console.log(`\nProduce entries (Fielder priority): ${parsed.produceEntries.length}`)
console.log(`Livestock entries: ${parsed.livestockEntries.length}`)
console.log(`Other entries: ${parsed.otherEntries.length}`)

// Sample produce entries
console.log('\n=== SAMPLE PRODUCE ENTRIES ===\n')
parsed.produceEntries.slice(0, 10).forEach(entry => {
  console.log(`${entry.name} (${entry.primaryRegion})`)
  console.log(`  Category: ${entry.category}`)
  console.log(`  Description: ${entry.description.substring(0, 150)}...`)
  console.log()
})

// Export to JSON for further processing
const outputPath = path.join(__dirname, 'ark-of-taste-parsed.json')
fs.writeFileSync(
  outputPath,
  JSON.stringify(parsed, null, 2),
  'utf-8'
)

console.log(`\nExported parsed data to: ${outputPath}`)
