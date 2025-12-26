#!/usr/bin/env tsx

/**
 * Check Taxonomy Hierarchy Counts
 *
 * Shows current state of the farm-to-table taxonomy:
 * - Categories
 * - Subcategories
 * - ProductTypes
 * - Varieties
 * - Cultivars
 *
 * Goal: Minimum 5 cultivars per variety across all categories
 */

import { runQuery } from '../src/lib/graph/neo4j'

interface CountResult {
  count: number
}

interface VarietyWithCultivars {
  varietyName: string
  productType: string
  cultivarCount: number
}

async function main() {
  console.log('='.repeat(80))
  console.log('FIELDER TAXONOMY HIERARCHY - CURRENT STATE')
  console.log('='.repeat(80))
  console.log()

  // Level 1: Categories
  const categories = await runQuery<CountResult>(
    'MATCH (c:Category) RETURN count(c) as count'
  )
  console.log(`📦 CATEGORIES: ${categories[0].count}`)

  const categoryList = await runQuery<{ name: string }>(
    'MATCH (c:Category) RETURN c.name as name ORDER BY name'
  )
  categoryList.forEach(c => console.log(`   - ${c.name}`))
  console.log()

  // Level 2: Subcategories
  const subcategories = await runQuery<CountResult>(
    'MATCH (s:Subcategory) RETURN count(s) as count'
  )
  console.log(`📂 SUBCATEGORIES: ${subcategories[0].count}`)

  const subcategoryList = await runQuery<{ name: string, category: string }>(
    `MATCH (s:Subcategory)<-[:HAS_SUBCATEGORY]-(c:Category)
     RETURN s.name as name, c.name as category
     ORDER BY category, name`
  )
  let currentCat = ''
  subcategoryList.forEach(s => {
    if (s.category !== currentCat) {
      console.log(`   ${s.category}:`)
      currentCat = s.category
    }
    console.log(`     - ${s.name}`)
  })
  console.log()

  // Level 3: ProductTypes
  const productTypes = await runQuery<CountResult>(
    'MATCH (p:ProductType) RETURN count(p) as count'
  )
  console.log(`📋 PRODUCT TYPES: ${productTypes[0].count}`)
  console.log()

  // Level 4: Varieties
  const varieties = await runQuery<CountResult>(
    'MATCH (v:Variety) RETURN count(v) as count'
  )
  console.log(`🌱 VARIETIES: ${varieties[0].count}`)
  console.log()

  // Level 5: Cultivars
  const cultivars = await runQuery<CountResult>(
    'MATCH (c:Cultivar) RETURN count(c) as count'
  )
  console.log(`🌿 CULTIVARS: ${cultivars[0].count}`)
  console.log()

  console.log('='.repeat(80))
  console.log('VARIETY → CULTIVAR ANALYSIS')
  console.log('='.repeat(80))
  console.log()

  // Varieties with cultivar counts
  const varietyCounts = await runQuery<VarietyWithCultivars>(
    `MATCH (v:Variety)<-[:BELONGS_TO_VARIETY]-(c:Cultivar)
     MATCH (v)-[:BELONGS_TO_PRODUCT]->(p:ProductType)
     RETURN COALESCE(v.displayName, v.name, v.id) as varietyName, p.id as productType, count(c) as cultivarCount
     ORDER BY cultivarCount DESC, varietyName`
  )

  console.log('Varieties WITH cultivars:')
  console.log('-'.repeat(80))
  varietyCounts.forEach(v => {
    const status = v.cultivarCount >= 5 ? '✅' : '⚠️'
    console.log(`${status} ${v.varietyName} (${v.productType}): ${v.cultivarCount} cultivars`)
  })
  console.log()

  // Varieties WITHOUT cultivars
  const varietiesNoCultivars = await runQuery<{ varietyName: string, productType: string }>(
    `MATCH (v:Variety)
     MATCH (v)-[:BELONGS_TO_PRODUCT]->(p:ProductType)
     WHERE NOT EXISTS((v)<-[:BELONGS_TO_VARIETY]-(:Cultivar))
     RETURN COALESCE(v.displayName, v.name, v.id) as varietyName, p.id as productType
     ORDER BY productType, varietyName`
  )

  if (varietiesNoCultivars.length > 0) {
    console.log('Varieties WITHOUT ANY cultivars:')
    console.log('-'.repeat(80))
    varietiesNoCultivars.forEach(v => {
      console.log(`❌ ${v.varietyName} (${v.productType}): 0 cultivars`)
    })
    console.log()
  }

  // Summary statistics
  console.log('='.repeat(80))
  console.log('SUMMARY')
  console.log('='.repeat(80))

  const withCultivars = varietyCounts.length
  const withoutCultivars = varietiesNoCultivars.length
  const total = withCultivars + withoutCultivars
  const meetingGoal = varietyCounts.filter(v => v.cultivarCount >= 5).length

  console.log()
  console.log(`Total Varieties: ${total}`)
  console.log(`  - With cultivars: ${withCultivars}`)
  console.log(`  - Without cultivars: ${withoutCultivars}`)
  console.log(`  - Meeting goal (≥5 cultivars): ${meetingGoal}`)
  console.log()
  console.log(`📊 Progress: ${meetingGoal}/${total} varieties (${Math.round(meetingGoal/total*100)}%) meet minimum 5 cultivars`)
  console.log()

  // Goal status
  if (meetingGoal === total) {
    console.log('🎉 ALL varieties have minimum 5 cultivars!')
  } else {
    const needed = total - meetingGoal
    console.log(`🎯 GOAL: Add cultivars to ${needed} varieties to reach minimum`)
  }
  console.log()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })
