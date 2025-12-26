# Neo4j Browser Queries to See Actual Connectivity

## Why the graph looks "disconnected"

Neo4j Browser limits display to ~300 nodes by default. When you run `MATCH (n) RETURN n LIMIT 100`, you see 100 random nodes and only relationships BETWEEN them - not all their connections to nodes outside the display.

**This makes the graph LOOK disconnected even when it's fully connected.**

---

## Queries to See Actual Connectivity

### 1. Show a Complete Path (State → Entity → Product)

```cypher
MATCH path = (s:State {code: 'NY'})<-[:LOCATED_IN_STATE]-(g:Grower)-[:GROWS]->(pt:ProductType)
RETURN path
LIMIT 25
```

**What this shows:** NY State → NY Growers → Products they grow
**Expected:** Connected chain (not isolated clusters)

---

### 2. Show Single-Farm CSA with Full Context

```cypher
MATCH (g:Grower)
WHERE 'single_farm_csa' IN g.features
WITH g LIMIT 1
MATCH path = (g)-[*1..2]-(connected)
RETURN path
```

**What this shows:** One CSA farm + everything within 2 hops
**Expected:** Farm → State, Farm → Products (if any), Farm → Region (if mapped)

---

### 3. Show Geographic Hierarchy

```cypher
MATCH path = (:Country)-[:CONTAINS_REGION]->(:Region)-[:CONTAINS_STATE]->(:State {code: 'CA'})-[:CONTAINS_GROWING_REGION]->(:GrowingRegion)
RETURN path
```

**What this shows:** US → West Region → California → Growing Regions
**Expected:** Fully connected geographic tree

---

### 4. Show Entity Distribution by Relationship Count

```cypher
MATCH (e:Entity)
WITH e, size((e)--()) as relCount
RETURN 
  CASE
    WHEN relCount = 0 THEN 'Isolated (0 rels)'
    WHEN relCount <= 2 THEN 'Sparse (1-2 rels)'
    WHEN relCount <= 5 THEN 'Connected (3-5 rels)'
    ELSE 'Well-connected (5+ rels)'
  END as connectivity,
  count(e) as entities
ORDER BY connectivity
```

**What this shows:** How many entities have how many relationships
**Expected:** Most should have 2+ (State + Products/Region)

---

### 5. Sample Well-Connected Entities

```cypher
MATCH (e:Entity)
WHERE size((e)--()) >= 3
WITH e LIMIT 5
MATCH path = (e)-[*1]-(connected)
RETURN path
```

**What this shows:** Entities with 3+ relationships and what they connect to
**Expected:** State, Product, Region links visible

---

### 6. Check if USDA Entities are Connected

```cypher
MATCH (e:Entity)
WHERE e.dataSource CONTAINS 'usda'
WITH e LIMIT 10
RETURN e.name, e.stateCode, e.products, 
       exists((e)-[:LOCATED_IN_STATE]->()) as hasState,
       exists((e)-[:GROWS|SELLS]->()) as hasProducts
```

**What this shows:** Whether USDA entities got relationships created
**Expected:** hasState = true, hasProducts depends on if products exist

---

## If You Still See Isolated Clusters

Run this to find truly isolated nodes:

```cypher
MATCH (n)
WHERE NOT (n)--()
RETURN labels(n), count(n)
ORDER BY count(n) DESC
```

**Expected:** Zero or very few isolated nodes

If you see thousands isolated → relationship creation failed during import

