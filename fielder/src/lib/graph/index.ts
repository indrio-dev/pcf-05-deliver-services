/**
 * Fielder Knowledge Graph
 *
 * Neo4j-based knowledge graph for farm-to-table intelligence.
 * This is the "frontier" where data is discovered, modeled, and inferred.
 * Clean, validated data is then promoted to Supabase for production serving.
 */

// Connection and queries
export {
  getDriver,
  closeDriver,
  runQuery,
  runWriteTransaction,
  runTransaction,
  testConnection,
} from './neo4j'

// Schema management
export {
  setupSchema,
  createConstraints,
  createIndexes,
  getSchemaStats,
  clearAllData,
} from './schema'

// Seed data
export { seedGeography } from './seed-geography'
export { seedCrops } from './seed-crops'
export { seedFarms } from './seed-farms'
export { seedEntities } from './seed-entities'
export { seedInferences } from './seed-inferences'

// Supabase import
export {
  importNutrients,
  importGrowingRegions,
  importCrops,
  importCultivars,
  importRootstocks,
  importHarvestWindows,
  runSupabaseImport,
} from './import-supabase'

// Query layer
export {
  getSimpleStats,
  getAllEntities,
  getEntitiesByRole,
  getEntitiesByState,
  getGrowersOfProduct,
  getProductsWithGrowerCounts,
  getCultivarsForProduct,
  getGrowingRegionsWithCounts,
  getEntitiesInRegion,
  getMultiRoleEntities,
  getD2CRetailers,
  getPackinghouses,
  inferEntityAttributes,
  getCultivarsSuitableForRegion,
} from './queries'
