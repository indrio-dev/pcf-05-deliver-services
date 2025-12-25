# Measurement Ingestion Process - Building Training Dataset

**Purpose:** Systematic process to ingest ANY measurement data as SHARE training data

---

## Process (Every Time You Provide Data)

### Step 1: Extract Inputs (Before Seeing Actual Brix)

**From source (URL/PDF/Wrike/CSV):**
```
Required:
- Cultivar/variety name
- Location (region/county/state)
- Date measured
- Optional but valuable:
  - Rootstock
  - Tree age (or planting year)
  - Growing practices
  - Soil data
```

**Example from Georgia doc:**
```
Variety: Sugar Belle Mandarin
Rootstock: US-897
Date planted: 2018
Date measured: 2021-12-15
Location: Valdosta, GA (Lowndes County)
[Don't look at Brix yet!]
```

---

### Step 2: PREDICT Using SHARE Model (Blind)

**Calculate:**
```
1. Tree age: 2021 - 2018 = 3 years
2. GDD to Dec 15: ~5,274 GDD (from bloom)
3. Rootstock modifier: US-897 = +0.2°Bx (estimated)
4. Age modifier: 3 years = -0.5°Bx (young)
5. Timing: December = mid-season for mandarins

SHARE Prediction: 13.2°Bx
```

**THIS IS DONE BEFORE KNOWING ACTUAL!**

---

### Step 3: Extract Actual Measurement

**From source:**
```
Actual Brix: 13.3°Bx
Actual Acid: 1.78%
Actual Ratio: 7.5
```

---

### Step 4: Calculate Error

```
Predicted: 13.2°Bx
Actual: 13.3°Bx
Error: 0.1°Bx (0.8%)

Assessment: ✅ Excellent prediction
```

---

### Step 5: Save to Graph as Training Data

**Create Measurement node:**
```cypher
CREATE (m:Measurement:ValidationMeasurement {
  id: 'ga_sugar_belle_us897_20211215',
  source: 'georgia_uga_2021',

  // Inputs (what we knew before)
  variety: 'Sugar Belle Mandarin',
  cultivar: 'Sugar Belle',
  rootstock: 'US-897',
  treeAgeYears: 3,
  datePlanted: '2018',
  dateMeasured: '2021-12-15',
  location: 'Valdosta, GA',
  county: 'Lowndes',
  state: 'GA',

  // GDD calculations
  estimatedGDD: 5274,
  bloomDate: '2021-02-25',
  daysFromBloom: 293,

  // SHARE predictions (before actual)
  predictedBrix: 13.2,
  predictedAcid: 1.5,
  predictedRatio: 8.8,

  // Actual measurements
  actualBrix: 13.3,
  actualAcid: 1.78,
  actualRatio: 7.5,

  // Error analysis
  brixError: 0.1,
  brixErrorPct: 0.8,

  // Model improvement
  modelVersion: 'v1.0',
  validated: true,

  // Metadata
  dataSource: 'UGA Extension Circular 1275',
  confidence: 'high',
  sampleSize: 5
})

// Link to Cultivar
MATCH (c:Cultivar)
WHERE toLower(c.displayName) CONTAINS 'sugar belle'
MERGE (m)-[:VALIDATES_CULTIVAR]->(c)

// Link to Region
MATCH (r:GrowingRegion)
WHERE r.state = 'GA'
  AND (r.displayName CONTAINS 'Valdosta' OR r.counties CONTAINS 'Lowndes')
MERGE (m)-[:FROM_REGION]->(r)
```

**THIS creates usable training data!**

---

## What This Enables (Over Time)

**Query 1: Model accuracy by cultivar**
```cypher
MATCH (m:ValidationMeasurement)-[:VALIDATES_CULTIVAR]->(c:Cultivar)
RETURN c.displayName,
       count(m) as measurements,
       avg(abs(m.brixError)) as avgError,
       stdDev(m.brixError) as errorStdDev
ORDER BY measurements DESC
```

**Shows:** Which cultivars we predict well vs poorly

---

**Query 2: Model improvement over time**
```cypher
MATCH (m:ValidationMeasurement)
WHERE m.dateMeasured >= '2021-01-01'
WITH m
ORDER BY m.dateMeasured
WITH collect(m) as measurements
UNWIND range(0, size(measurements)-1) as i
WITH measurements[i] as m, i
RETURN date(m.dateMeasured) as date,
       avg(abs(m.brixError)) as avgError
```

**Shows:** Is model getting better as we add data?

---

**Query 3: Regional bias detection**
```cypher
MATCH (m:ValidationMeasurement)-[:FROM_REGION]->(r:GrowingRegion)
RETURN r.displayName,
       avg(m.brixError) as avgBiasError,
       count(m) as samples
ORDER BY samples DESC
```

**Shows:** Do we consistently over/under-predict certain regions?

---

**Query 4: Rootstock effect validation**
```cypher
MATCH (m:ValidationMeasurement)
WHERE m.rootstock IS NOT NULL
RETURN m.rootstock,
       avg(m.actualBrix) as avgBrix,
       count(m) as samples
ORDER BY avgBrix DESC
```

**Shows:** Actual rootstock effects from real data

---

## Systematic Ingestion Template

**When you paste URL/data:**

**I will:**
1. Extract all inputs (variety, location, age, rootstock, date)
2. Calculate GDD and make SHARE prediction
3. Extract actual measurements
4. Calculate errors
5. Create Measurement node with BOTH predicted + actual
6. Link to Cultivar/Variety/Region
7. Report: "Predicted X, Actual Y, Error Z, Saved to graph"

**Over time:**
- Hundreds of measurements accumulate
- Model refines from real data
- Can retrain genetic ceilings, rootstock modifiers, age effects
- Evidence-based continuous improvement

**This is the RIGHT approach - accumulate training data!**

Ready to commit this ingestion process documentation?