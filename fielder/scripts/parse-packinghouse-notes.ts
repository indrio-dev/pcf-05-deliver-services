#!/usr/bin/env tsx
/**
 * Parse Packinghouse Notes
 *
 * Extracts structured attributes from freeform notes field:
 * - Founded year
 * - Acreage
 * - Certifications
 * - Scale indicators
 *
 * Usage:
 *   npx tsx scripts/parse-packinghouse-notes.ts
 */

import fs from 'fs'
import path from 'path'

interface PackinghouseRecord {
  name: string
  state: string
  notes?: string
  foundedYear?: number
  acreage?: number
  certifications?: string[]
  scaleIndicators?: string[]
  [key: string]: any
}

// Regex patterns for extraction
const PATTERNS = {
  foundedYear: [
    /(?:since|established|founded|operating since)\s+(\d{4})/i,
    /(\d{4})\s+(?:established|founded)/i,
    /family.*?(?:owned|operated).*?(\d{4})/i,
    /(\d{4}).*?(?:family|established)/i,
  ],
  acreage: [
    /(\d{1,3}(?:,\d{3})*)\+?\s*acres?/i,
    /(\d+)\s*acres/i,
  ],
  certifications: [
    { pattern: /PACA\s+licen[sc]ed?/i, value: 'PACA' },
    { pattern: /GAP\s+certified/i, value: 'GAP' },
    { pattern: /GRASP\s+certified/i, value: 'GRASP' },
    { pattern: /(?:organic\s+certified|certified\s+organic|USDA\s+organic)/i, value: 'USDA_Organic' },
    { pattern: /GlobalG[aA][pP]/i, value: 'GlobalGAP' },
    { pattern: /non-GMO/i, value: 'Non-GMO' },
    { pattern: /kosher/i, value: 'Kosher' },
  ],
  scale: [
    { pattern: /world'?s\s+largest/i, value: 'worlds_largest' },
    { pattern: /largest/i, value: 'largest' },
    { pattern: /premier/i, value: 'premier' },
    { pattern: /leading/i, value: 'leading' },
    { pattern: /major/i, value: 'major' },
  ],
  yearsInBusiness: [
    /(\d+)\+?\s+years?\s+(?:in business|of operation|operating|experience)/i,
    /(?:over|more than)\s+(\d+)\s+years/i,
  ]
}

function extractFoundedYear(notes: string): number | undefined {
  for (const pattern of PATTERNS.foundedYear) {
    const match = notes.match(pattern)
    if (match && match[1]) {
      const year = parseInt(match[1])
      if (year >= 1800 && year <= 2025) {
        return year
      }
    }
  }
  return undefined
}

function extractAcreage(notes: string): number | undefined {
  for (const pattern of PATTERNS.acreage) {
    const match = notes.match(pattern)
    if (match && match[1]) {
      const acreage = parseInt(match[1].replace(/,/g, ''))
      if (acreage > 0 && acreage < 1000000) {  // Sanity check
        return acreage
      }
    }
  }
  return undefined
}

function extractCertifications(notes: string): string[] {
  const certs: string[] = []
  for (const { pattern, value } of PATTERNS.certifications) {
    if (pattern.test(notes)) {
      certs.push(value)
    }
  }
  return certs
}

function extractScaleIndicators(notes: string): string[] {
  const scales: string[] = []
  for (const { pattern, value } of PATTERNS.scale) {
    if (pattern.test(notes)) {
      if (!scales.includes(value)) {
        scales.push(value)
      }
    }
  }
  return scales
}

function extractYearsInBusiness(notes: string): number | undefined {
  for (const pattern of PATTERNS.yearsInBusiness) {
    const match = notes.match(pattern)
    if (match && match[1]) {
      const years = parseInt(match[1])
      if (years > 0 && years < 200) {  // Sanity check
        return years
      }
    }
  }
  return undefined
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║       PARSE PACKINGHOUSE NOTES                         ║')
  console.log('╚════════════════════════════════════════════════════════╝')
  console.log('')

  const inputFile = 'consolidated_packinghouses.json'
  const outputFile = 'consolidated_packinghouses_enriched.json'

  // Load data
  console.log(`📂 Loading ${inputFile}...`)
  const rawData = fs.readFileSync(inputFile, 'utf-8')
  const packinghouses: PackinghouseRecord[] = JSON.parse(rawData)
  console.log(`   Loaded ${packinghouses.length} packinghouses\n`)

  // Parse notes
  console.log('🔍 Extracting structured attributes from notes...\n')

  let stats = {
    total: packinghouses.length,
    withNotes: 0,
    foundedYearExtracted: 0,
    acreageExtracted: 0,
    certificationsExtracted: 0,
    scaleExtracted: 0,
    yearsInBusinessExtracted: 0,
  }

  for (const packer of packinghouses) {
    if (!packer.notes) continue

    stats.withNotes++

    // Extract founded year
    const foundedYear = extractFoundedYear(packer.notes)
    if (foundedYear) {
      packer.foundedYear = foundedYear
      stats.foundedYearExtracted++
    }

    // Extract acreage
    const acreage = extractAcreage(packer.notes)
    if (acreage) {
      packer.acreage = acreage
      stats.acreageExtracted++
    }

    // Extract certifications
    const certs = extractCertifications(packer.notes)
    if (certs.length > 0) {
      packer.certifications = certs
      stats.certificationsExtracted++
    }

    // Extract scale
    const scale = extractScaleIndicators(packer.notes)
    if (scale.length > 0) {
      packer.scaleIndicators = scale
      stats.scaleExtracted++
    }

    // Extract years in business
    const yearsInBusiness = extractYearsInBusiness(packer.notes)
    if (yearsInBusiness) {
      packer.yearsInBusiness = yearsInBusiness
      stats.yearsInBusinessExtracted++
    }
  }

  // Save enriched data
  console.log('💾 Saving enriched data...')
  fs.writeFileSync(outputFile, JSON.stringify(packinghouses, null, 2))
  console.log(`   Saved to ${outputFile}\n`)

  // Report
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║                  EXTRACTION RESULTS                    ║')
  console.log('╠════════════════════════════════════════════════════════╣')
  console.log(`║  Total packinghouses:     ${stats.total.toString().padStart(4)}                       ║`)
  console.log(`║  With notes:              ${stats.withNotes.toString().padStart(4)} (${Math.round(stats.withNotes*100/stats.total)}%)                  ║`)
  console.log('╠════════════════════════════════════════════════════════╣')
  console.log(`║  Founded year:            ${stats.foundedYearExtracted.toString().padStart(4)} (${Math.round(stats.foundedYearExtracted*100/stats.withNotes)}%)                  ║`)
  console.log(`║  Acreage:                 ${stats.acreageExtracted.toString().padStart(4)} (${Math.round(stats.acreageExtracted*100/stats.withNotes)}%)                  ║`)
  console.log(`║  Certifications:          ${stats.certificationsExtracted.toString().padStart(4)} (${Math.round(stats.certificationsExtracted*100/stats.withNotes)}%)                  ║`)
  console.log(`║  Scale indicators:        ${stats.scaleExtracted.toString().padStart(4)} (${Math.round(stats.scaleExtracted*100/stats.withNotes)}%)                  ║`)
  console.log(`║  Years in business:       ${stats.yearsInBusinessExtracted.toString().padStart(4)} (${Math.round(stats.yearsInBusinessExtracted*100/stats.withNotes)}%)                  ║`)
  console.log('╚════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`Total data points extracted: ${stats.foundedYearExtracted + stats.acreageExtracted + stats.certificationsExtracted + stats.scaleExtracted + stats.yearsInBusinessExtracted}`)
  console.log('')
}

main()
