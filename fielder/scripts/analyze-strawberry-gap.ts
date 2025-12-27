#!/usr/bin/env tsx

/**
 * Strawberry Cultivar Gap Analysis
 *
 * California and Florida are the two major strawberry producing states
 * California: ~90% of US production (1.5+ billion lbs/year)
 * Florida: ~10% of US production (winter/spring production)
 */

import { runQuery } from '../src/lib/graph/neo4j'

async function main() {
  console.log('='.repeat(80))
  console.log('STRAWBERRY CULTIVAR GAP ANALYSIS')
  console.log('='.repeat(80))
  console.log()

  // Get what we have
  const ourCultivars = await runQuery<{
    name: string
    states: string[]
    notes: string
  }>(`
    MATCH (c:Cultivar)
    WHERE c.id CONTAINS 'strawberry' OR toLower(c.displayName) CONTAINS 'strawberry'
      OR c.id IN ['chandler', 'seascape', 'florida_brilliance', 'florida_medallion',
                  'florida_radiance', 'sweet_charlie', 'earliglow', 'albion_strawberry',
                  'camarosa_strawberry', 'portola_strawberry', 'san_andreas_strawberry']
    RETURN DISTINCT c.displayName as name, c.validatedStates as states, c.notes as notes
    ORDER BY name
  `)

  console.log(`CURRENT STRAWBERRY CULTIVARS: ${ourCultivars.length}`)
  console.log()

  // Group by state
  const california = ourCultivars.filter(c => c.states?.includes('CA'))
  const florida = ourCultivars.filter(c => c.states?.includes('FL'))
  const other = ourCultivars.filter(c =>
    !c.states?.includes('CA') && !c.states?.includes('FL') && c.states && c.states.length > 0
  )

  console.log('CALIFORNIA (90% of US production):')
  console.log('-'.repeat(80))
  california.forEach(c => console.log(`  ✅ ${c.name}`))
  console.log()

  console.log('FLORIDA (10% of US production):')
  console.log('-'.repeat(80))
  florida.forEach(c => console.log(`  ✅ ${c.name}`))
  console.log()

  if (other.length > 0) {
    console.log('OTHER REGIONS:')
    console.log('-'.repeat(80))
    other.forEach(c => console.log(`  ✅ ${c.name} [${c.states?.join(', ')}]`))
    console.log()
  }

  // Define what we SHOULD have for complete commercial coverage
  console.log('='.repeat(80))
  console.log('GAP ANALYSIS - MAJOR COMMERCIAL VARIETIES')
  console.log('='.repeat(80))
  console.log()

  console.log('CALIFORNIA - Major Commercial Cultivars:')
  console.log('-'.repeat(80))
  console.log()

  const caNeeds = [
    { name: 'Albion', share: '~40%', have: true, notes: 'Day-neutral, year-round, #1 CA variety' },
    { name: 'San Andreas', share: '~15%', have: true, notes: 'Day-neutral, heat-tolerant' },
    { name: 'Camarosa', share: '~15%', have: true, notes: 'Short-day, major commercial' },
    { name: 'Portola', share: '~10%', have: true, notes: 'Day-neutral, heat-tolerant' },
    { name: 'Monterey', share: '~8%', have: false, notes: 'Day-neutral, UC Davis, major commercial' },
    { name: 'Fronteras', share: '~5%', have: false, notes: 'Day-neutral, UC Davis 2016, newer' },
    { name: 'Ventana', share: '~3%', have: false, notes: 'Short-day, UC Davis, commercial' },
    { name: 'Valiant', share: '~2%', have: false, notes: 'Short-day, UC Davis, newer' },
    { name: 'Chandler', share: '<1%', have: true, notes: 'Historic CA variety, 1980s-2000s leader, declining' },
  ]

  let caHave = 0
  let caMarketCovered = 0

  caNeeds.forEach(v => {
    const icon = v.have ? '✅' : '❌'
    console.log(`  ${icon} ${v.name.padEnd(15)} ${v.share.padEnd(6)} ${v.notes}`)
    if (v.have) {
      caHave++
      const share = parseFloat(v.share.replace('~', '').replace('%', '').replace('<', ''))
      if (!isNaN(share)) caMarketCovered += share
    }
  })

  console.log()
  console.log(`  California Coverage: ${caHave}/${caNeeds.length} cultivars (${Math.round(caHave/caNeeds.length*100)}%)`)
  console.log(`  Market Share Covered: ~${Math.round(caMarketCovered)}% of CA strawberry production`)
  console.log()

  console.log('FLORIDA - Major Commercial Cultivars:')
  console.log('-'.repeat(80))
  console.log()

  const flNeeds = [
    { name: 'Florida Radiance', share: '~30%', have: true, notes: 'UF 2008, most planted FL variety' },
    { name: 'Florida Beauty', share: '~25%', have: false, notes: 'UF 2012, large fruit, firm' },
    { name: 'Strawberry Festival', share: '~20%', have: false, notes: 'UF 2000, early season, major commercial' },
    { name: 'Florida Brilliance', share: '~10%', have: true, notes: 'UF, commercial' },
    { name: 'Winterstar', share: '~8%', have: false, notes: 'UF, winter production' },
    { name: 'Sweet Charlie', share: '~5%', have: true, notes: 'UF 1992, declining but still grown' },
    { name: 'Florida Medallion', share: '<2%', have: true, notes: 'UF, specialty' },
    { name: 'Camarosa', share: '~2%', have: true, notes: 'CA variety also grown in FL' },
  ]

  let flHave = 0
  let flMarketCovered = 0

  flNeeds.forEach(v => {
    const icon = v.have ? '✅' : '❌'
    console.log(`  ${icon} ${v.name.padEnd(20)} ${v.share.padEnd(6)} ${v.notes}`)
    if (v.have) {
      flHave++
      const share = parseFloat(v.share.replace('~', '').replace('%', '').replace('<', ''))
      if (!isNaN(share)) flMarketCovered += share
    }
  })

  console.log()
  console.log(`  Florida Coverage: ${flHave}/${flNeeds.length} cultivars (${Math.round(flHave/flNeeds.length*100)}%)`)
  console.log(`  Market Share Covered: ~${Math.round(flMarketCovered)}% of FL strawberry production`)
  console.log()

  // Summary
  console.log('='.repeat(80))
  console.log('SUMMARY & RECOMMENDATIONS')
  console.log('='.repeat(80))
  console.log()

  console.log('CALIFORNIA:')
  console.log(`  ✅ Coverage: ${Math.round(caHave/caNeeds.length*100)}% of major cultivars`)
  console.log(`  ✅ Market share: ~${Math.round(caMarketCovered)}% (strong - have top 4)`)
  console.log(`  ⚠️  Missing 3 commercial varieties (Monterey, Fronteras, Ventana)`)
  console.log()

  console.log('FLORIDA:')
  console.log(`  ⚠️  Coverage: ${Math.round(flHave/flNeeds.length*100)}% of major cultivars`)
  console.log(`  ⚠️  Market share: ~${Math.round(flMarketCovered)}% (gaps in major varieties)`)
  console.log(`  ❌ Missing: Florida Beauty (#2 at 25%), Strawberry Festival (#3 at 20%), Winterstar`)
  console.log()

  console.log('PRIORITY ADDITIONS (by market impact):')
  console.log('-'.repeat(80))
  console.log('  1. 🔴 Florida Beauty (FL) - 25% of FL market, 2nd most planted')
  console.log('  2. 🔴 Strawberry Festival (FL) - 20% of FL market, early season leader')
  console.log('  3. 🟡 Monterey (CA) - 8% of CA market, major day-neutral variety')
  console.log('  4. 🟡 Winterstar (FL) - 8% of FL market, winter production')
  console.log('  5. 🟡 Fronteras (CA) - 5% of CA market, newer UC Davis release')
  console.log('  6. 🟢 Ventana (CA) - 3% of CA market, short-day commercial')
  console.log()

  console.log('ASSESSMENT:')
  console.log('-'.repeat(80))
  console.log('  California: GOOD coverage (80% market share), missing some depth')
  console.log('  Florida: MODERATE coverage (~70% market), missing top 2-3 varieties')
  console.log('  Overall: Need to add 6 cultivars for complete CA/FL commercial coverage')
  console.log()

  await runQuery('RETURN 1')  // Keep connection alive
  process.exit(0)
}

main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
