# Neo4j Browser Diagnostic Queries for BFA Linking

**Run these in Neo4j Aura Browser to diagnose the issue:**

---

## Query 1: Check if cultivars exist

```cypher
MATCH (c:Cultivar)
RETURN c.productId, count(c) as count
ORDER BY count DESC
LIMIT 20
```

**Expected:** Should show cultivars with productId values
**Looking for:** carrot, potato, beet, kale, etc.

---

## Query 2: Check BFA measurements

```cypher
MATCH (m:BFAMeasurement)
RETURN m.species, count(m) as count
ORDER BY count DESC
LIMIT 20
```

**Expected:** Should show 561 carrots, 651 potatoes, etc.

---

## Query 3: Check if carrot cultivar exists specifically

```cypher
MATCH (c:Cultivar)
WHERE c.productId = 'carrot'
   OR toLower(c.displayName) CONTAINS 'carrot'
   OR toLower(c.name) CONTAINS 'carrot'
RETURN c.id, c.productId, c.displayName, c.name
```

**Expected:** Should return at least 1 carrot cultivar
**If returns 0:** That's the problem - cultivars don't exist for vegetables!

---

## Query 4: Test creating ONE relationship manually

```cypher
// First, create a carrot cultivar if doesn't exist
MERGE (c:Cultivar {id: 'carrot_generic'})
SET c.productId = 'carrot',
    c.displayName = 'Carrot',
    c.category = 'vegetable',
    c.source = 'bfa_placeholder'

WITH c

// Then link ONE carrot measurement
MATCH (m:BFAMeasurement {species: 'carrot'})
WHERE NOT (m)-[:MEASURED_FROM]->()

WITH m, c LIMIT 1

CREATE (m)-[:MEASURED_FROM]->(c)
RETURN m.id, c.id
```

**Expected:** Should create 1 relationship
**If succeeds:** Database works fine, just need to create vegetable cultivars
**If fails:** Tell me the error message

---

## Query 5: Check existing BFA relationships

```cypher
MATCH (m:BFAMeasurement)-[r]->()
RETURN type(r) as relType, count(r) as count
ORDER BY count DESC
```

**Expected:** Should show HAS_PRACTICE: 1537
**Looking for:** Any MEASURED_FROM relationships

---

## Query 6: Check if Zone 10 cultivars have productId

```cypher
MATCH (c:Cultivar)
WHERE c.source = 'seedsnow_zone10'
RETURN c.productId, count(c) as count
ORDER BY count DESC
LIMIT 10
```

**Expected:** Zone 10 cultivars might have different productId values

---

## What to Report Back:

1. **Query 3 result:** Does carrot cultivar exist? (This is likely the issue)
2. **Query 4 result:** Does manual link creation work?
3. **Any error messages** you see

**My hypothesis:** Fruit cultivars exist (orange, apple) but vegetable cultivars (carrot, potato) don't exist in graph, so there's nothing to link TO.

**If Query 3 returns 0 carrots:** That's the problem - need to create vegetable cultivars first!
