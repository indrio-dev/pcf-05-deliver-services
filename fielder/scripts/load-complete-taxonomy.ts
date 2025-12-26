#!/usr/bin/env tsx

/**
 * Load Complete Farm-to-Table Taxonomy to Neo4j
 *
 * Loads all 9 categories, all subcategories, and all 157 ProductTypes
 * from TypeScript constants to the knowledge graph
 */

import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'
import { PRODUCT_TYPES } from '../src/lib/constants/product-types'

async function main() {
  console.log('='.repeat(80))
  console.log('LOAD COMPLETE FARM-TO-TABLE TAXONOMY')
  console.log('='.repeat(80))
  console.log()
  console.log(`Total ProductTypes to process: ${PRODUCT_TYPES.length}`)
  console.log()

  // Extract unique categories and subcategories
  const categories = new Set<string>()
  const subcategories = new Map<string, string>() // subcategory -> category

  PRODUCT_TYPES.forEach(pt => {
    categories.add(pt.category)
    subcategories.set(pt.subcategory, pt.category)
  })

  console.log(`Categories: ${categories.size}`)
  console.log(`Subcategories: ${subcategories.size}`)
  console.log()

  // =========================================================================
  // STEP 1: Load Categories
  // =========================================================================
  console.log('STEP 1: Loading categories...')
  let categoriesCreated = 0

  for (const category of Array.from(categories).sort()) {
    await runWriteTransaction(`
      MERGE (c:Category {id: $id})
      SET c.name = $name,
          c.displayName = $displayName
    `, {
      id: category,
      name: category,
      displayName: category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    })

    categoriesCreated++
    console.log(`  ✓ ${category}`)
  }

  console.log(`  Completed: ${categoriesCreated} categories`)
  console.log()

  // =========================================================================
  // STEP 2: Load Subcategories and link to Categories
  // =========================================================================
  console.log('STEP 2: Loading subcategories...')
  let subcategoriesCreated = 0

  for (const [subcategory, category] of Array.from(subcategories.entries()).sort()) {
    await runWriteTransaction(`
      MERGE (s:Subcategory {id: $id})
      SET s.name = $name,
          s.displayName = $displayName,
          s.categoryId = $categoryId

      WITH s
      MATCH (c:Category {id: $categoryId})
      MERGE (c)-[:HAS_SUBCATEGORY]->(s)
    `, {
      id: subcategory,
      name: subcategory,
      displayName: subcategory.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      categoryId: category
    })

    subcategoriesCreated++
    if (subcategoriesCreated % 10 === 0) {
      console.log(`  ✓ Created ${subcategoriesCreated}/${subcategories.size} subcategories...`)
    }
  }

  console.log(`  Completed: ${subcategoriesCreated} subcategories`)
  console.log()

  // =========================================================================
  // STEP 3: Load ProductTypes and link to Subcategories
  // =========================================================================
  console.log('STEP 3: Loading ProductTypes...')
  let productTypesCreated = 0

  for (const pt of PRODUCT_TYPES) {
    await runWriteTransaction(`
      MERGE (p:ProductType {id: $id})
      SET p.name = $name,
          p.displayName = $displayName,
          p.description = $description,
          p.category = $category,
          p.subcategory = $subcategory

      // Link to Subcategory
      WITH p
      MATCH (s:Subcategory {id: $subcategory})
      MERGE (s)-[:HAS_PRODUCT_TYPE]->(p)

      // Also link directly to Category for easier querying
      WITH p
      MATCH (c:Category {id: $category})
      MERGE (c)-[:HAS_PRODUCT_TYPE]->(p)
    `, {
      id: pt.id,
      name: pt.name,
      displayName: pt.displayName,
      description: pt.description || '',
      category: pt.category,
      subcategory: pt.subcategory
    })

    productTypesCreated++
    if (productTypesCreated % 20 === 0) {
      console.log(`  ✓ Created ${productTypesCreated}/${PRODUCT_TYPES.length} ProductTypes...`)
    }
  }

  console.log(`  Completed: ${productTypesCreated} ProductTypes`)
  console.log()

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('='.repeat(80))
  console.log('TAXONOMY LOAD COMPLETE')
  console.log('='.repeat(80))
  console.log()
  console.log(`✅ Categories: ${categoriesCreated}`)
  console.log(`✅ Subcategories: ${subcategoriesCreated}`)
  console.log(`✅ ProductTypes: ${productTypesCreated}`)
  console.log()

  // Show breakdown by category
  console.log('Breakdown by Category:')
  console.log('-'.repeat(80))

  const categoryBreakdown = new Map<string, number>()
  PRODUCT_TYPES.forEach(pt => {
    categoryBreakdown.set(pt.category, (categoryBreakdown.get(pt.category) || 0) + 1)
  })

  Array.from(categoryBreakdown.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const display = cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      console.log(`  ${display.padEnd(20)} ${count} product types`)
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
