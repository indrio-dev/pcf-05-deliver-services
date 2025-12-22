/**
 * Graph Query Layer
 *
 * Query functions for exploring and analyzing the Fielder Knowledge Graph.
 *
 * Usage:
 *   import { getEntitiesByRole, getSupplyChainPath } from '@/lib/graph/queries'
 */

import { runQuery } from './neo4j'

// =============================================================================
// TYPES
// =============================================================================

export interface EntitySummary {
  id: string
  name: string
  roles: string[]
  stateCode: string
  city?: string
  facilityTypes?: string[]
  retailChannels?: string[]
  b2bChannels?: string[]
  products?: string[]
}

export interface GraphStats {
  nodeLabels: Array<{ label: string; count: number }>
  relationshipTypes: Array<{ type: string; count: number }>
  totalNodes: number
  totalRelationships: number
}

export interface EntityWithProducts {
  entity: EntitySummary
  products: string[]
  regions: string[]
}

// =============================================================================
// GRAPH OVERVIEW QUERIES
// =============================================================================

/**
 * Get comprehensive graph statistics
 */
export async function getGraphStats(): Promise<GraphStats> {
  // Node counts by label
  const labelCounts = await runQuery<{ label: string; count: { low: number } }>(`
    CALL db.labels() YIELD label
    CALL apoc.cypher.run('MATCH (n:\`' + label + '\`) RETURN count(n) as count', {})
    YIELD value
    RETURN label, value.count as count
    ORDER BY value.count DESC
  `)

  // Relationship counts by type
  const relCounts = await runQuery<{ type: string; count: { low: number } }>(`
    CALL db.relationshipTypes() YIELD relationshipType as type
    CALL apoc.cypher.run('MATCH ()-[r:\`' + type + '\`]->() RETURN count(r) as count', {})
    YIELD value
    RETURN type, value.count as count
    ORDER BY value.count DESC
  `)

  // Totals
  const [totals] = await runQuery<{ nodes: { low: number }; rels: { low: number } }>(`
    MATCH (n) WITH count(n) as nodes
    MATCH ()-[r]->()
    RETURN nodes, count(r) as rels
  `)

  return {
    nodeLabels: labelCounts.map(r => ({ label: r.label, count: r.count.low })),
    relationshipTypes: relCounts.map(r => ({ type: r.type, count: r.count.low })),
    totalNodes: totals?.nodes?.low || 0,
    totalRelationships: totals?.rels?.low || 0,
  }
}

/**
 * Get simple graph stats (no APOC dependency)
 */
export async function getSimpleStats(): Promise<{
  entities: number
  growers: number
  packinghouses: number
  retailers: number
  products: number
  regions: number
  relationships: number
}> {
  const [stats] = await runQuery<{
    entities: { low: number }
    growers: { low: number }
    packinghouses: { low: number }
    retailers: { low: number }
    products: { low: number }
    regions: { low: number }
    relationships: { low: number }
  }>(`
    MATCH (e:Entity) WITH count(e) as entities
    MATCH (g:Grower) WITH entities, count(g) as growers
    MATCH (p:Packinghouse) WITH entities, growers, count(p) as packinghouses
    MATCH (r:Retailer) WITH entities, growers, packinghouses, count(r) as retailers
    MATCH (pt:ProductType) WITH entities, growers, packinghouses, retailers, count(pt) as products
    MATCH (gr:GrowingRegion) WITH entities, growers, packinghouses, retailers, products, count(gr) as regions
    MATCH ()-[rel]->()
    RETURN entities, growers, packinghouses, retailers, products, regions, count(rel) as relationships
  `)

  return {
    entities: stats?.entities?.low || 0,
    growers: stats?.growers?.low || 0,
    packinghouses: stats?.packinghouses?.low || 0,
    retailers: stats?.retailers?.low || 0,
    products: stats?.products?.low || 0,
    regions: stats?.regions?.low || 0,
    relationships: stats?.relationships?.low || 0,
  }
}

// =============================================================================
// ENTITY QUERIES
// =============================================================================

/**
 * Get all entities with their roles
 */
export async function getAllEntities(): Promise<EntitySummary[]> {
  const results = await runQuery<{
    e: {
      properties: {
        id: string
        name: string
        stateCode: string
        city?: string
        facilityTypes?: string[]
        retailChannels?: string[]
        b2bChannels?: string[]
      }
    }
    labels: string[]
    products: string[]
  }>(`
    MATCH (e:Entity)
    OPTIONAL MATCH (e)-[:GROWS|SELLS]->(pt:ProductType)
    WITH e, labels(e) as labels, collect(DISTINCT pt.id) as products
    RETURN e, labels, products
    ORDER BY e.name
  `)

  return results.map(r => ({
    id: r.e.properties.id,
    name: r.e.properties.name,
    roles: r.labels.filter(l => ['Grower', 'Packinghouse', 'Retailer'].includes(l)),
    stateCode: r.e.properties.stateCode,
    city: r.e.properties.city,
    facilityTypes: r.e.properties.facilityTypes,
    retailChannels: r.e.properties.retailChannels,
    b2bChannels: r.e.properties.b2bChannels,
    products: r.products,
  }))
}

/**
 * Get entities by role
 */
export async function getEntitiesByRole(
  role: 'Grower' | 'Packinghouse' | 'Retailer'
): Promise<EntitySummary[]> {
  const results = await runQuery<{
    e: {
      properties: {
        id: string
        name: string
        stateCode: string
        city?: string
        facilityTypes?: string[]
        retailChannels?: string[]
        b2bChannels?: string[]
      }
    }
    labels: string[]
    products: string[]
  }>(`
    MATCH (e:Entity:${role})
    OPTIONAL MATCH (e)-[:GROWS|SELLS]->(pt:ProductType)
    WITH e, labels(e) as labels, collect(DISTINCT pt.id) as products
    RETURN e, labels, products
    ORDER BY e.name
  `)

  return results.map(r => ({
    id: r.e.properties.id,
    name: r.e.properties.name,
    roles: r.labels.filter(l => ['Grower', 'Packinghouse', 'Retailer'].includes(l)),
    stateCode: r.e.properties.stateCode,
    city: r.e.properties.city,
    facilityTypes: r.e.properties.facilityTypes,
    retailChannels: r.e.properties.retailChannels,
    b2bChannels: r.e.properties.b2bChannels,
    products: r.products,
  }))
}

/**
 * Get entities by state
 */
export async function getEntitiesByState(stateCode: string): Promise<EntitySummary[]> {
  const results = await runQuery<{
    e: {
      properties: {
        id: string
        name: string
        stateCode: string
        city?: string
        facilityTypes?: string[]
        retailChannels?: string[]
        b2bChannels?: string[]
      }
    }
    labels: string[]
    products: string[]
  }>(`
    MATCH (e:Entity {stateCode: $stateCode})
    OPTIONAL MATCH (e)-[:GROWS|SELLS]->(pt:ProductType)
    WITH e, labels(e) as labels, collect(DISTINCT pt.id) as products
    RETURN e, labels, products
    ORDER BY e.name
  `, { stateCode })

  return results.map(r => ({
    id: r.e.properties.id,
    name: r.e.properties.name,
    roles: r.labels.filter(l => ['Grower', 'Packinghouse', 'Retailer'].includes(l)),
    stateCode: r.e.properties.stateCode,
    city: r.e.properties.city,
    facilityTypes: r.e.properties.facilityTypes,
    retailChannels: r.e.properties.retailChannels,
    b2bChannels: r.e.properties.b2bChannels,
    products: r.products,
  }))
}

/**
 * Get entities that grow a specific product
 */
export async function getGrowersOfProduct(productId: string): Promise<EntitySummary[]> {
  const results = await runQuery<{
    e: {
      properties: {
        id: string
        name: string
        stateCode: string
        city?: string
        facilityTypes?: string[]
        retailChannels?: string[]
      }
    }
    labels: string[]
    region: string | null
  }>(`
    MATCH (e:Entity:Grower)-[:GROWS]->(pt:ProductType {id: $productId})
    OPTIONAL MATCH (e)-[:IN_GROWING_REGION]->(gr:GrowingRegion)
    WITH e, labels(e) as labels, gr.name as region
    RETURN e, labels, region
    ORDER BY e.stateCode, e.name
  `, { productId })

  return results.map(r => ({
    id: r.e.properties.id,
    name: r.e.properties.name,
    roles: r.labels.filter(l => ['Grower', 'Packinghouse', 'Retailer'].includes(l)),
    stateCode: r.e.properties.stateCode,
    city: r.e.properties.city,
    facilityTypes: r.e.properties.facilityTypes,
    retailChannels: r.e.properties.retailChannels,
  }))
}

// =============================================================================
// PRODUCT & TAXONOMY QUERIES
// =============================================================================

/**
 * Get all product types with grower counts
 */
export async function getProductsWithGrowerCounts(): Promise<Array<{
  id: string
  name: string
  category: string
  growerCount: number
}>> {
  const results = await runQuery<{
    pt: { properties: { id: string; name: string } }
    category: string
    growerCount: { low: number }
  }>(`
    MATCH (pt:ProductType)
    OPTIONAL MATCH (e:Grower)-[:GROWS]->(pt)
    OPTIONAL MATCH (pt)<-[:HAS_PRODUCT_TYPE]-(sc:Subcategory)<-[:HAS_SUBCATEGORY]-(c:Category)
    WITH pt, c.name as category, count(DISTINCT e) as growerCount
    RETURN pt, category, growerCount
    ORDER BY growerCount DESC, pt.name
  `)

  return results.map(r => ({
    id: r.pt.properties.id,
    name: r.pt.properties.name,
    category: r.category || 'Unknown',
    growerCount: r.growerCount.low,
  }))
}

/**
 * Get cultivars for a product type
 */
export async function getCultivarsForProduct(productId: string): Promise<Array<{
  id: string
  name: string
  brixBaseline?: number
  heritageIntent?: string
}>> {
  const results = await runQuery<{
    c: {
      properties: {
        id: string
        name: string
        brixBaseline?: number
        heritageIntent?: string
      }
    }
  }>(`
    MATCH (pt:ProductType {id: $productId})-[:HAS_VARIETY]->(v:Variety)-[:HAS_CULTIVAR]->(c:Cultivar)
    RETURN c
    ORDER BY c.name
  `, { productId })

  return results.map(r => ({
    id: r.c.properties.id,
    name: r.c.properties.name,
    brixBaseline: r.c.properties.brixBaseline,
    heritageIntent: r.c.properties.heritageIntent,
  }))
}

// =============================================================================
// GEOGRAPHIC QUERIES
// =============================================================================

/**
 * Get growing regions with entity counts
 */
export async function getGrowingRegionsWithCounts(): Promise<Array<{
  id: string
  name: string
  stateCode: string
  entityCount: number
  products: string[]
}>> {
  const results = await runQuery<{
    gr: { properties: { id: string; name: string } }
    stateCode: string
    entityCount: { low: number }
    products: string[]
  }>(`
    MATCH (gr:GrowingRegion)
    OPTIONAL MATCH (gr)<-[:CONTAINS_GROWING_REGION]-(s:State)
    OPTIONAL MATCH (e:Entity)-[:IN_GROWING_REGION]->(gr)
    OPTIONAL MATCH (e)-[:GROWS]->(pt:ProductType)
    WITH gr, s.code as stateCode, count(DISTINCT e) as entityCount, collect(DISTINCT pt.name) as products
    RETURN gr, stateCode, entityCount, products
    ORDER BY entityCount DESC
  `)

  return results.map(r => ({
    id: r.gr.properties.id,
    name: r.gr.properties.name,
    stateCode: r.stateCode || 'Unknown',
    entityCount: r.entityCount.low,
    products: r.products.filter(p => p),
  }))
}

/**
 * Get entities in a growing region
 */
export async function getEntitiesInRegion(regionId: string): Promise<EntitySummary[]> {
  const results = await runQuery<{
    e: {
      properties: {
        id: string
        name: string
        stateCode: string
        city?: string
        facilityTypes?: string[]
        retailChannels?: string[]
      }
    }
    labels: string[]
    products: string[]
  }>(`
    MATCH (e:Entity)-[:IN_GROWING_REGION]->(gr:GrowingRegion {id: $regionId})
    OPTIONAL MATCH (e)-[:GROWS|SELLS]->(pt:ProductType)
    WITH e, labels(e) as labels, collect(DISTINCT pt.id) as products
    RETURN e, labels, products
    ORDER BY e.name
  `, { regionId })

  return results.map(r => ({
    id: r.e.properties.id,
    name: r.e.properties.name,
    roles: r.labels.filter(l => ['Grower', 'Packinghouse', 'Retailer'].includes(l)),
    stateCode: r.e.properties.stateCode,
    city: r.e.properties.city,
    facilityTypes: r.e.properties.facilityTypes,
    retailChannels: r.e.properties.retailChannels,
    products: r.products,
  }))
}

// =============================================================================
// SUPPLY CHAIN QUERIES
// =============================================================================

/**
 * Get multi-role entities (entities with 2+ roles)
 */
export async function getMultiRoleEntities(): Promise<Array<{
  entity: EntitySummary
  roleCount: number
}>> {
  const results = await runQuery<{
    e: {
      properties: {
        id: string
        name: string
        stateCode: string
        city?: string
        facilityTypes?: string[]
        retailChannels?: string[]
        b2bChannels?: string[]
      }
    }
    labels: string[]
    products: string[]
    roleCount: { low: number }
  }>(`
    MATCH (e:Entity)
    WITH e, labels(e) as allLabels
    WITH e, allLabels,
         size([l IN allLabels WHERE l IN ['Grower', 'Packinghouse', 'Retailer']]) as roleCount
    WHERE roleCount >= 2
    OPTIONAL MATCH (e)-[:GROWS|SELLS]->(pt:ProductType)
    WITH e, allLabels, roleCount, collect(DISTINCT pt.id) as products
    RETURN e, allLabels as labels, products, roleCount
    ORDER BY roleCount DESC, e.name
  `)

  return results.map(r => ({
    entity: {
      id: r.e.properties.id,
      name: r.e.properties.name,
      roles: r.labels.filter(l => ['Grower', 'Packinghouse', 'Retailer'].includes(l)),
      stateCode: r.e.properties.stateCode,
      city: r.e.properties.city,
      facilityTypes: r.e.properties.facilityTypes,
      retailChannels: r.e.properties.retailChannels,
      b2bChannels: r.e.properties.b2bChannels,
      products: r.products,
    },
    roleCount: r.roleCount.low,
  }))
}

/**
 * Get D2C retailers (entities with d2c retail channel)
 */
export async function getD2CRetailers(): Promise<EntitySummary[]> {
  const results = await runQuery<{
    e: {
      properties: {
        id: string
        name: string
        stateCode: string
        city?: string
        facilityTypes?: string[]
        retailChannels?: string[]
      }
    }
    labels: string[]
    products: string[]
  }>(`
    MATCH (e:Entity:Retailer)
    WHERE 'd2c' IN e.retailChannels
    OPTIONAL MATCH (e)-[:GROWS|SELLS]->(pt:ProductType)
    WITH e, labels(e) as labels, collect(DISTINCT pt.id) as products
    RETURN e, labels, products
    ORDER BY e.name
  `)

  return results.map(r => ({
    id: r.e.properties.id,
    name: r.e.properties.name,
    roles: r.labels.filter(l => ['Grower', 'Packinghouse', 'Retailer'].includes(l)),
    stateCode: r.e.properties.stateCode,
    city: r.e.properties.city,
    facilityTypes: r.e.properties.facilityTypes,
    retailChannels: r.e.properties.retailChannels,
    products: r.products,
  }))
}

/**
 * Get packinghouses with their facility types and channels
 */
export async function getPackinghouses(): Promise<Array<{
  entity: EntitySummary
  facilityTypes: string[]
  b2bChannels: string[]
  sellsToDistributors: boolean
  sellsToRetailers: boolean
}>> {
  const results = await runQuery<{
    e: {
      properties: {
        id: string
        name: string
        stateCode: string
        city?: string
        facilityTypes?: string[]
        retailChannels?: string[]
        b2bChannels?: string[]
      }
    }
    labels: string[]
    products: string[]
  }>(`
    MATCH (e:Entity:Packinghouse)
    OPTIONAL MATCH (e)-[:GROWS|SELLS]->(pt:ProductType)
    WITH e, labels(e) as labels, collect(DISTINCT pt.id) as products
    RETURN e, labels, products
    ORDER BY e.name
  `)

  return results.map(r => ({
    entity: {
      id: r.e.properties.id,
      name: r.e.properties.name,
      roles: r.labels.filter(l => ['Grower', 'Packinghouse', 'Retailer'].includes(l)),
      stateCode: r.e.properties.stateCode,
      city: r.e.properties.city,
      facilityTypes: r.e.properties.facilityTypes,
      retailChannels: r.e.properties.retailChannels,
      b2bChannels: r.e.properties.b2bChannels,
      products: r.products,
    },
    facilityTypes: r.e.properties.facilityTypes || [],
    b2bChannels: r.e.properties.b2bChannels || [],
    sellsToDistributors: (r.e.properties.b2bChannels || []).includes('to_distributors'),
    sellsToRetailers: (r.e.properties.b2bChannels || []).includes('to_retailers'),
  }))
}

// =============================================================================
// INFERENCE QUERIES
// =============================================================================

/**
 * Find what can be inferred about an entity
 */
export async function inferEntityAttributes(entityId: string): Promise<{
  entity: EntitySummary | null
  inferences: Array<{
    type: string
    source: string
    inference: string
  }>
}> {
  // Get entity
  const [entityResult] = await runQuery<{
    e: {
      properties: {
        id: string
        name: string
        stateCode: string
        city?: string
        facilityTypes?: string[]
        retailChannels?: string[]
        b2bChannels?: string[]
        features?: string[]
        certifications?: string[]
      }
    }
    labels: string[]
    products: string[]
    region: string | null
    zone: string | null
  }>(`
    MATCH (e:Entity {id: $entityId})
    OPTIONAL MATCH (e)-[:GROWS|SELLS]->(pt:ProductType)
    OPTIONAL MATCH (e)-[:IN_GROWING_REGION]->(gr:GrowingRegion)
    OPTIONAL MATCH (gr)-[:TYPICALLY_IN_ZONE]->(z:USDAZone)
    WITH e, labels(e) as labels, collect(DISTINCT pt.id) as products, gr.name as region, z.id as zone
    RETURN e, labels, products, region, zone
  `, { entityId })

  if (!entityResult) {
    return { entity: null, inferences: [] }
  }

  const entity: EntitySummary = {
    id: entityResult.e.properties.id,
    name: entityResult.e.properties.name,
    roles: entityResult.labels.filter(l => ['Grower', 'Packinghouse', 'Retailer'].includes(l)),
    stateCode: entityResult.e.properties.stateCode,
    city: entityResult.e.properties.city,
    facilityTypes: entityResult.e.properties.facilityTypes,
    retailChannels: entityResult.e.properties.retailChannels,
    b2bChannels: entityResult.e.properties.b2bChannels,
    products: entityResult.products,
  }

  const inferences: Array<{ type: string; source: string; inference: string }> = []

  // Role-based inferences
  if (entity.roles.includes('Grower')) {
    inferences.push({
      type: 'knowledge',
      source: 'Grower role',
      inference: 'Has direct farm-level SHARE knowledge',
    })
  }

  if (entity.roles.includes('Packinghouse')) {
    inferences.push({
      type: 'knowledge',
      source: 'Packinghouse role',
      inference: 'Knows source farms and handles B2B relationships',
    })
  }

  // Facility type inferences
  const facilityTypes = entityResult.e.properties.facilityTypes || []
  if (facilityTypes.includes('gift_repack')) {
    inferences.push({
      type: 'supply_chain',
      source: 'gift_repack facility',
      inference: 'Sources from wet packinghouses, assembles D2C gift boxes',
    })
  }

  if (facilityTypes.includes('wet_packinghouse')) {
    inferences.push({
      type: 'supply_chain',
      source: 'wet_packinghouse facility',
      inference: 'Full processing capability (wash, grade, wax, pack)',
    })
  }

  // Channel inferences
  const retailChannels = entityResult.e.properties.retailChannels || []
  if (retailChannels.includes('d2c')) {
    inferences.push({
      type: 'market',
      source: 'd2c channel',
      inference: 'Sells direct to consumers (e-commerce, catalog, call center)',
    })
  }

  // Geographic inferences
  if (entityResult.region) {
    inferences.push({
      type: 'geographic',
      source: `Growing region: ${entityResult.region}`,
      inference: `Operates in ${entityResult.region} growing region`,
    })
  }

  if (entityResult.zone) {
    inferences.push({
      type: 'climate',
      source: `USDA Zone: ${entityResult.zone}`,
      inference: `Climate zone ${entityResult.zone} - affects cultivar suitability`,
    })
  }

  // Feature inferences
  const features = entityResult.e.properties.features || []
  if (features.includes('sources_from_growers')) {
    inferences.push({
      type: 'supply_chain',
      source: 'sources_from_growers feature',
      inference: 'Aggregates from multiple grower sources',
    })
  }

  return { entity, inferences }
}

/**
 * Find cultivars suitable for a region
 */
export async function getCultivarsSuitableForRegion(regionId: string): Promise<Array<{
  cultivar: { id: string; name: string; brixBaseline?: number }
  productType: string
  reason: string
}>> {
  const results = await runQuery<{
    c: { properties: { id: string; name: string; brixBaseline?: number } }
    pt: { properties: { name: string } }
    zone: string
  }>(`
    MATCH (gr:GrowingRegion {id: $regionId})-[:TYPICALLY_IN_ZONE]->(z:USDAZone)
    MATCH (c:Cultivar)-[:SUITABLE_FOR_ZONE]->(z)
    MATCH (v:Variety)-[:HAS_CULTIVAR]->(c)
    MATCH (pt:ProductType)-[:HAS_VARIETY]->(v)
    RETURN c, pt, z.id as zone
    ORDER BY pt.name, c.name
  `, { regionId })

  return results.map(r => ({
    cultivar: {
      id: r.c.properties.id,
      name: r.c.properties.name,
      brixBaseline: r.c.properties.brixBaseline,
    },
    productType: r.pt.properties.name,
    reason: `Suitable for USDA Zone ${r.zone}`,
  }))
}
