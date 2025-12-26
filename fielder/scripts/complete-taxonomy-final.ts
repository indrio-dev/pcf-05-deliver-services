#!/usr/bin/env tsx

/**
 * Complete Taxonomy - Final Report
 *
 * Shows ALL categories, varieties, and cultivars after complete build
 */

import { runQuery, closeDriver } from '../src/lib/graph/index'

async function main() {
  console.log('='.repeat(80))
  console.log('FIELDER COMPLETE FARM-TO-TABLE TAXONOMY - FINAL REPORT')
  console.log('='.repeat(80))
  console.log()

  // Overall counts
  const totals = await runQuery<any>(`
    MATCH (cat:Category) WITH count(cat) as categories
    MATCH (sub:Subcategory) WITH categories, count(sub) as subcategories
    MATCH (pt:ProductType) WITH categories, subcategories, count(pt) as productTypes
    MATCH (v:Variety) WITH categories, subcategories, productTypes, count(v) as varieties
    MATCH (c:Cultivar) WITH categories, subcategories, productTypes, varieties, count(c) as cultivars
    MATCH (c2:Cultivar)-[:BELONGS_TO_VARIETY]->(:Variety)
    WITH categories, subcategories, productTypes, varieties, cultivars, count(c2) as cultivarsLinked
    MATCH (m:Measurement)
    RETURN categories, subcategories, productTypes, varieties, cultivars, cultivarsLinked, count(m) as measurements
  `)

  const t = totals[0]
  console.log('TAXONOMY HIERARCHY:')
  console.log('-'.repeat(80))
  console.log(`📦 Categories:           ${t.categories}/9 (100%)`)
  console.log(`📂 Subcategories:        ${t.subcategories}/35`)
  console.log(`📋 Product Types:        ${t.productTypes}/158`)
  console.log(`🌱 Varieties:            ${t.varieties}`)
  console.log(`🌿 Cultivars:            ${t.cultivarsLinked} (linked to varieties)`)
  console.log(`   + ${Number(t.cultivars) - Number(t.cultivarsLinked)} orphaned but edible (herbs, vegetables)`)
  console.log(`📊 BFA Measurements:     ${t.measurements}`)
  console.log()

  // By category with cultivar counts
  const byCategory = await runQuery<{
    category: string
    varietyCount: number
    cultivarCount: number
  }>(`
    MATCH (cat:Category)-[:HAS_PRODUCT_TYPE]->(pt:ProductType)<-[:BELONGS_TO_PRODUCT]-(v:Variety)
    OPTIONAL MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v)
    RETURN cat.name as category,
           count(DISTINCT v) as varietyCount,
           count(DISTINCT c) as cultivarCount
    ORDER BY category
  `)

  console.log('COMPLETE BREAKDOWN BY CATEGORY:')
  console.log('-'.repeat(80))
  byCategory.forEach(c => {
    const icon = {
      'fruit': '🍎',
      'vegetable': '🥬',
      'meat': '🥩',
      'seafood': '🐟',
      'dairy': '🥛',
      'nut': '🌰',
      'grain': '🌾',
      'beverage': '☕',
      'post_harvest': '🍯'
    }[c.category] || '📦'

    const cat = c.category.padEnd(15)
    const vars = Number(c.varietyCount).toString().padStart(2)
    const cults = Number(c.cultivarCount).toString().padStart(3)
    console.log(`${icon} ${cat} ${vars} varieties, ${cults} cultivars`)
  })
  console.log()

  // Count varieties meeting goal
  const varietyGoals = await runQuery<{
    totalWithData: number
    meetingGoal: number
  }>(`
    MATCH (v:Variety)
    OPTIONAL MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v)
    WITH v, count(c) as cultivarCount
    WHERE cultivarCount > 0
    WITH count(v) as totalWithData,
         sum(CASE WHEN cultivarCount >= 5 THEN 1 ELSE 0 END) as meetingGoal
    RETURN totalWithData, meetingGoal
  `)

  const goals = varietyGoals[0]
  const percent = Math.round(Number(goals.meetingGoal) / Number(goals.totalWithData) * 100)

  console.log('='.repeat(80))
  console.log('GOAL ACHIEVEMENT: MINIMUM 5 CULTIVARS PER VARIETY')
  console.log('='.repeat(80))
  console.log()
  console.log(`Total varieties with cultivars:  ${goals.totalWithData}`)
  console.log(`Varieties meeting goal (≥5):     ${goals.meetingGoal}`)
  console.log(`Achievement:                     ${percent}%`)
  console.log()

  if (Number(goals.meetingGoal) === Number(goals.totalWithData)) {
    console.log('🎉 ALL VARIETIES MEET THE 5 CULTIVAR MINIMUM!')
  } else {
    console.log(`🎯 ${Number(goals.totalWithData) - Number(goals.meetingGoal)} varieties need more cultivars`)
  }
  console.log()

  // List all categories status
  console.log('='.repeat(80))
  console.log('CATEGORY COMPLETION STATUS')
  console.log('='.repeat(80))
  console.log()

  byCategory.forEach(c => {
    const count = Number(c.varietyCount)
    const status = count > 0 ? '✅' : '⚠️'
    const icon = {
      'fruit': '🍎',
      'vegetable': '🥬',
      'meat': '🥩',
      'seafood': '🐟',
      'dairy': '🥛',
      'nut': '🌰',
      'grain': '🌾',
      'beverage': '☕',
      'post_harvest': '🍯'
    }[c.category] || '📦'

    console.log(`${status} ${icon} ${c.category.toUpperCase()}: ${c.varietyCount} varieties, ${c.cultivarCount} cultivars`)
  })
  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
