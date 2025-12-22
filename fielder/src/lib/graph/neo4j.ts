/**
 * Neo4j Connection Client
 *
 * Provides connection to the Fielder Knowledge Graph.
 * The graph is the "frontier" for data discovery and inference,
 * while Supabase serves as the production "storefront".
 *
 * Usage:
 *   import { neo4j, runQuery } from '@/lib/graph/neo4j'
 *
 *   const result = await runQuery(
 *     'MATCH (f:Farm) RETURN f LIMIT 10',
 *     {}
 *   )
 */

import neo4jDriver, { Driver, Session, Result } from 'neo4j-driver'

// =============================================================================
// CONFIGURATION
// =============================================================================

const NEO4J_URI = process.env.NEO4J_URI
const NEO4J_USERNAME = process.env.NEO4J_USERNAME
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j'

// Validate environment variables
function validateConfig(): void {
  if (!NEO4J_URI) throw new Error('NEO4J_URI environment variable is not set')
  if (!NEO4J_USERNAME) throw new Error('NEO4J_USERNAME environment variable is not set')
  if (!NEO4J_PASSWORD) throw new Error('NEO4J_PASSWORD environment variable is not set')
}

// =============================================================================
// DRIVER SINGLETON
// =============================================================================

let driver: Driver | null = null

/**
 * Get or create the Neo4j driver instance.
 * Uses singleton pattern to reuse connections.
 */
export function getDriver(): Driver {
  if (!driver) {
    validateConfig()
    driver = neo4jDriver.driver(
      NEO4J_URI!,
      neo4jDriver.auth.basic(NEO4J_USERNAME!, NEO4J_PASSWORD!),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
      }
    )
  }
  return driver
}

/**
 * Close the driver connection.
 * Call this when shutting down the application.
 */
export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close()
    driver = null
  }
}

// =============================================================================
// QUERY HELPERS
// =============================================================================

/**
 * Run a Cypher query and return the result.
 */
export async function runQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {},
  database?: string
): Promise<T[]> {
  const session = getDriver().session({
    database: database || NEO4J_DATABASE,
  })

  try {
    const result = await session.run(cypher, params)
    return result.records.map(record => record.toObject() as T)
  } finally {
    await session.close()
  }
}

/**
 * Run a write transaction (for mutations).
 */
export async function runWriteTransaction<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {},
  database?: string
): Promise<T[]> {
  const session = getDriver().session({
    database: database || NEO4J_DATABASE,
  })

  try {
    const result = await session.executeWrite(async tx => {
      return await tx.run(cypher, params)
    })
    return result.records.map(record => record.toObject() as T)
  } finally {
    await session.close()
  }
}

/**
 * Run multiple queries in a single transaction.
 */
export async function runTransaction<T = Record<string, unknown>>(
  queries: Array<{ cypher: string; params?: Record<string, unknown> }>,
  database?: string
): Promise<T[][]> {
  const session = getDriver().session({
    database: database || NEO4J_DATABASE,
  })

  try {
    const results = await session.executeWrite(async tx => {
      const allResults: Result[] = []
      for (const query of queries) {
        const result = await tx.run(query.cypher, query.params || {})
        allResults.push(result)
      }
      return allResults
    })

    return results.map(result =>
      result.records.map(record => record.toObject() as T)
    )
  } finally {
    await session.close()
  }
}

// =============================================================================
// CONNECTION TEST
// =============================================================================

/**
 * Test the database connection.
 * Returns server info if successful.
 */
export async function testConnection(): Promise<{
  connected: boolean
  serverVersion?: string
  database?: string
  error?: string
}> {
  try {
    const result = await runQuery<{ version: string }>(
      'CALL dbms.components() YIELD name, versions RETURN versions[0] AS version'
    )
    return {
      connected: true,
      serverVersion: result[0]?.version,
      database: NEO4J_DATABASE,
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { neo4jDriver }
export type { Driver, Session, Result }
