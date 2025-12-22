/**
 * Fielder Knowledge Graph Schema
 *
 * Defines constraints, indexes, and initial seed data for the graph.
 * Run setupSchema() once to initialize a new database.
 */

import { runWriteTransaction, runQuery } from './neo4j'

// =============================================================================
// CONSTRAINTS
// =============================================================================

const CONSTRAINTS = [
  // Geographic - Political
  'CREATE CONSTRAINT country_code IF NOT EXISTS FOR (n:Country) REQUIRE n.code IS UNIQUE',
  'CREATE CONSTRAINT region_id IF NOT EXISTS FOR (n:Region) REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT state_code IF NOT EXISTS FOR (n:State) REQUIRE n.code IS UNIQUE',
  'CREATE CONSTRAINT county_fips IF NOT EXISTS FOR (n:County) REQUIRE n.fips IS UNIQUE',
  'CREATE CONSTRAINT city_id IF NOT EXISTS FOR (n:City) REQUIRE n.id IS UNIQUE',

  // Geographic - Agricultural
  'CREATE CONSTRAINT growing_region_id IF NOT EXISTS FOR (n:GrowingRegion) REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT soil_zone_id IF NOT EXISTS FOR (n:SoilZone) REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT usda_zone_id IF NOT EXISTS FOR (n:USDAZone) REQUIRE n.zone IS UNIQUE',

  // Crop Taxonomy
  'CREATE CONSTRAINT category_id IF NOT EXISTS FOR (n:Category) REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT subcategory_id IF NOT EXISTS FOR (n:Subcategory) REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT product_type_id IF NOT EXISTS FOR (n:ProductType) REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT variety_id IF NOT EXISTS FOR (n:Variety) REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT cultivar_id IF NOT EXISTS FOR (n:Cultivar) REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT rootstock_id IF NOT EXISTS FOR (n:Rootstock) REQUIRE n.id IS UNIQUE',

  // Entities (multi-role: Entity can also have :Grower, :Packinghouse, :Distributor, :Retailer labels)
  'CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (n:Entity) REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT product_id IF NOT EXISTS FOR (n:Product) REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT measurement_id IF NOT EXISTS FOR (n:Measurement) REQUIRE n.id IS UNIQUE',

  // Legacy - keep for backward compatibility during migration
  'CREATE CONSTRAINT farm_id IF NOT EXISTS FOR (n:Farm) REQUIRE n.id IS UNIQUE',

  // Nutrients
  'CREATE CONSTRAINT nutrient_id IF NOT EXISTS FOR (n:Nutrient) REQUIRE n.id IS UNIQUE',

  // Reference Data
  'CREATE CONSTRAINT certification_id IF NOT EXISTS FOR (n:Certification) REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT data_source_id IF NOT EXISTS FOR (n:DataSource) REQUIRE n.id IS UNIQUE',
]

// =============================================================================
// INDEXES
// =============================================================================

const INDEXES = [
  // Geographic lookups
  'CREATE INDEX state_name IF NOT EXISTS FOR (n:State) ON (n.name)',
  'CREATE INDEX county_name IF NOT EXISTS FOR (n:County) ON (n.name)',
  'CREATE INDEX city_name_state IF NOT EXISTS FOR (n:City) ON (n.name, n.state)',
  'CREATE INDEX growing_region_name IF NOT EXISTS FOR (n:GrowingRegion) ON (n.name)',

  // Entity lookups (multi-role supply chain entities)
  'CREATE INDEX entity_name IF NOT EXISTS FOR (n:Entity) ON (n.name)',
  'CREATE INDEX entity_state IF NOT EXISTS FOR (n:Entity) ON (n.stateCode)',
  'CREATE INDEX entity_verification IF NOT EXISTS FOR (n:Entity) ON (n.verificationLevel)',

  // Legacy Farm lookups (backward compatibility)
  'CREATE INDEX farm_name IF NOT EXISTS FOR (n:Farm) ON (n.name)',
  'CREATE INDEX farm_state IF NOT EXISTS FOR (n:Farm) ON (n.state)',
  'CREATE INDEX farm_verification IF NOT EXISTS FOR (n:Farm) ON (n.verificationLevel)',

  // Crop lookups
  'CREATE INDEX cultivar_name IF NOT EXISTS FOR (n:Cultivar) ON (n.name)',
  'CREATE INDEX cultivar_lifecycle IF NOT EXISTS FOR (n:Cultivar) ON (n.lifecycle)',

  // Measurement lookups
  'CREATE INDEX measurement_date IF NOT EXISTS FOR (n:Measurement) ON (n.measurementDate)',

  // Full-text search (for discovery)
  'CREATE FULLTEXT INDEX entity_search IF NOT EXISTS FOR (n:Entity) ON EACH [n.name, n.city, n.stateCode]',
  'CREATE FULLTEXT INDEX farm_search IF NOT EXISTS FOR (n:Farm) ON EACH [n.name, n.city, n.state]',
  'CREATE FULLTEXT INDEX cultivar_search IF NOT EXISTS FOR (n:Cultivar) ON EACH [n.name, n.tradeName]',
]

// =============================================================================
// SETUP FUNCTIONS
// =============================================================================

/**
 * Create all constraints.
 */
export async function createConstraints(): Promise<void> {
  console.log('Creating constraints...')
  for (const constraint of CONSTRAINTS) {
    try {
      await runWriteTransaction(constraint)
      console.log(`  ✓ ${constraint.split(' ')[2]}`)
    } catch (error) {
      // Constraint might already exist
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log(`  - ${constraint.split(' ')[2]} (exists)`)
      } else {
        console.error(`  ✗ ${constraint.split(' ')[2]}:`, error)
      }
    }
  }
}

/**
 * Create all indexes.
 */
export async function createIndexes(): Promise<void> {
  console.log('Creating indexes...')
  for (const index of INDEXES) {
    try {
      await runWriteTransaction(index)
      console.log(`  ✓ ${index.split(' ')[2]}`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log(`  - ${index.split(' ')[2]} (exists)`)
      } else {
        console.error(`  ✗ ${index.split(' ')[2]}:`, error)
      }
    }
  }
}

/**
 * Set up the complete schema (constraints + indexes).
 */
export async function setupSchema(): Promise<void> {
  console.log('Setting up Fielder Knowledge Graph schema...\n')
  await createConstraints()
  console.log('')
  await createIndexes()
  console.log('\nSchema setup complete.')
}

/**
 * Get schema statistics.
 */
export async function getSchemaStats(): Promise<{
  nodeLabels: string[]
  relationshipTypes: string[]
  nodeCount: number
  relationshipCount: number
}> {
  const [labels] = await runQuery<{ labels: string[] }>(
    'CALL db.labels() YIELD label RETURN collect(label) as labels'
  )

  const [relTypes] = await runQuery<{ types: string[] }>(
    'CALL db.relationshipTypes() YIELD relationshipType RETURN collect(relationshipType) as types'
  )

  const [counts] = await runQuery<{ nodes: number; rels: number }>(
    `MATCH (n) WITH count(n) as nodes
     MATCH ()-[r]->() WITH nodes, count(r) as rels
     RETURN nodes, rels`
  )

  return {
    nodeLabels: labels?.labels || [],
    relationshipTypes: relTypes?.types || [],
    nodeCount: counts?.nodes || 0,
    relationshipCount: counts?.rels || 0,
  }
}

/**
 * Clear all data (DANGEROUS - use only in development).
 */
export async function clearAllData(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot clear data in production')
  }

  console.log('Clearing all data...')
  await runWriteTransaction('MATCH (n) DETACH DELETE n')
  console.log('All data cleared.')
}
