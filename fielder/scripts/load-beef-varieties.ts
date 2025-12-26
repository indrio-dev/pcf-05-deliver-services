#!/usr/bin/env tsx

/**
 * Load Beef Varieties and Breeds
 *
 * Creates the beef taxonomy:
 * Meat → Red Meat → Beef → [Breed Varieties] → [Specific Breeds/Crosses]
 *
 * For beef:
 * - Variety = Breed family (Angus, Wagyu, Heritage, etc.)
 * - Cultivar = Specific breed or breed cross (Black Angus, American Wagyu, etc.)
 */

import { runWriteTransaction, closeDriver } from '../src/lib/graph/index'

interface Variety {
  id: string
  productId: string
  displayName: string
  description: string
}

interface Cultivar {
  id: string
  varietyId: string
  productId: string
  displayName: string
  description: string
  heritageIntent?: string
  omegaBaseline?: string
  notes?: string
}

// ========================================================================
// BEEF VARIETIES (Breed Families)
// ========================================================================

const BEEF_VARIETIES: Variety[] = [
  {
    id: 'angus',
    productId: 'beef',
    displayName: 'Angus',
    description: 'Most popular beef breed in US, known for marbling and quality'
  },
  {
    id: 'wagyu',
    productId: 'beef',
    displayName: 'Wagyu',
    description: 'Japanese breed, extreme marbling, premium positioning'
  },
  {
    id: 'hereford',
    productId: 'beef',
    displayName: 'Hereford',
    description: 'Heritage breed, hardy, efficient grazers'
  },
  {
    id: 'continental',
    productId: 'beef',
    displayName: 'Continental Breeds',
    description: 'European breeds: Charolais, Limousin, Simmental - lean, muscular'
  },
  {
    id: 'heritage_beef',
    productId: 'beef',
    displayName: 'Heritage Breeds',
    description: 'Traditional breeds: Galloway, Devon, Highland, Longhorn'
  },
  {
    id: 'composite',
    productId: 'beef',
    displayName: 'Composite Breeds',
    description: 'Developed breeds: Brangus, Beefmaster, Santa Gertrudis'
  }
]

// ========================================================================
// BEEF CULTIVARS (Specific Breeds and Crosses)
// ========================================================================

const BEEF_CULTIVARS: Cultivar[] = [
  // ========================================================================
  // ANGUS (6 cultivars)
  // ========================================================================
  {
    id: 'black_angus',
    varietyId: 'angus',
    productId: 'beef',
    displayName: 'Black Angus',
    description: 'Classic Angus, black coat, excellent marbling',
    heritageIntent: 'heirloom_quality',
    omegaBaseline: '10-20:1 (feedlot-finished typical)',
    notes: 'Aberdeen Angus from Scotland, most popular US beef breed'
  },
  {
    id: 'red_angus',
    varietyId: 'angus',
    productId: 'beef',
    displayName: 'Red Angus',
    description: 'Red coat, same quality as Black Angus',
    heritageIntent: 'heirloom_quality',
    omegaBaseline: '10-20:1 (feedlot-finished typical)',
    notes: 'Red recessive gene, same Aberdeen origin'
  },
  {
    id: 'certified_angus',
    varietyId: 'angus',
    productId: 'beef',
    displayName: 'Certified Angus Beef',
    description: 'Top 1/3 of Angus, premium marbling standards',
    omegaBaseline: '12-20:1 (extended feedlot for marbling)',
    notes: 'Brand program, not a breed - quality tier within Angus'
  },
  {
    id: 'lowline_angus',
    varietyId: 'angus',
    productId: 'beef',
    displayName: 'Lowline Angus',
    description: 'Miniature Angus, 60% size, efficient grazers',
    heritageIntent: 'modern_flavor',
    omegaBaseline: '8-15:1 (smaller frame, less grain needed)',
    notes: 'Australian development, grass-fed friendly'
  },
  {
    id: 'angus_cross',
    varietyId: 'angus',
    productId: 'beef',
    displayName: 'Angus Cross',
    description: 'Angus crossed with other breeds for hybrid vigor',
    omegaBaseline: '10-18:1 (varies by cross and feeding)',
    notes: 'Common commercial crosses: Angus×Hereford, Angus×Continental'
  },
  {
    id: 'angus_dairy_cross',
    varietyId: 'angus',
    productId: 'beef',
    displayName: 'Angus × Dairy Cross',
    description: 'Angus bull on dairy cow, leaner beef',
    omegaBaseline: '12-20:1 (dairy genetics, feedlot typical)',
    notes: 'Common in commodity beef, Holstein×Angus most common'
  },

  // ========================================================================
  // WAGYU (6 cultivars)
  // ========================================================================
  {
    id: 'japanese_black',
    varietyId: 'wagyu',
    productId: 'beef',
    displayName: 'Japanese Black (Kuroge)',
    description: 'Original Wagyu, extreme marbling, 24-36mo finish',
    heritageIntent: 'true_heritage',
    omegaBaseline: '20-26:1 (12+ months feedlot for marbling)',
    notes: 'A5 grading, extended grain feeding, WORST omega profile'
  },
  {
    id: 'american_wagyu',
    varietyId: 'wagyu',
    productId: 'beef',
    displayName: 'American Wagyu',
    description: 'Wagyu×Angus cross, high marbling, US-raised',
    heritageIntent: 'modern_flavor',
    omegaBaseline: '15-26:1 (depends on feedlot duration)',
    notes: 'Snake River Farms model: 12+ months grain = 26:1, Everglades model: pasture + supplement = 4-6:1'
  },
  {
    id: 'fullblood_wagyu',
    varietyId: 'wagyu',
    productId: 'beef',
    displayName: 'Fullblood Wagyu',
    description: '100% Wagyu genetics, premium marbling',
    heritageIntent: 'true_heritage',
    omegaBaseline: '22-26:1 (extended feedlot typical)',
    notes: 'No crossbreeding, purebred Japanese genetics'
  },
  {
    id: 'wagyu_f1',
    varietyId: 'wagyu',
    productId: 'beef',
    displayName: 'Wagyu F1 Cross',
    description: '50% Wagyu, first generation cross',
    omegaBaseline: '12-20:1 (depends on feeding)',
    notes: 'Most common American Wagyu, 50/50 cross'
  },
  {
    id: 'wagyu_purebred',
    varietyId: 'wagyu',
    productId: 'beef',
    displayName: 'Purebred Wagyu',
    description: '93.75%+ Wagyu genetics, premium marbling',
    omegaBaseline: '18-24:1 (extended finishing typical)',
    notes: 'Multiple generations of crossbreeding back to Wagyu'
  },
  {
    id: 'kobe_style',
    varietyId: 'wagyu',
    productId: 'beef',
    displayName: 'Kobe-Style Wagyu',
    description: 'US-raised mimicking Kobe protocols',
    omegaBaseline: '22-26:1 (long grain finish for marbling)',
    notes: 'Cannot legally be "Kobe" (requires Hyogo prefecture), but similar genetics/feeding'
  },

  // ========================================================================
  // HEREFORD (5 cultivars)
  // ========================================================================
  {
    id: 'hereford_traditional',
    varietyId: 'hereford',
    productId: 'beef',
    displayName: 'Traditional Hereford',
    description: 'Horned, red with white face, hardy grazers',
    heritageIntent: 'heirloom_quality',
    omegaBaseline: '10-18:1 (efficient on grass, typical feedlot finish)',
    notes: 'English origin 1700s, Herefordshire'
  },
  {
    id: 'polled_hereford',
    varietyId: 'hereford',
    productId: 'beef',
    displayName: 'Polled Hereford',
    description: 'Naturally hornless, red with white face',
    heritageIntent: 'heirloom_quality',
    omegaBaseline: '10-18:1 (typical feedlot finish)',
    notes: 'Genetic mutation for hornless, easier handling'
  },
  {
    id: 'miniature_hereford',
    varietyId: 'hereford',
    productId: 'beef',
    displayName: 'Miniature Hereford',
    description: 'Smaller frame, efficient grazers, same quality',
    heritageIntent: 'modern_flavor',
    omegaBaseline: '8-15:1 (smaller frame, less grain needed)',
    notes: 'Bred down for small farms, grass-fed friendly'
  },
  {
    id: 'hereford_cross',
    varietyId: 'hereford',
    productId: 'beef',
    displayName: 'Hereford Cross',
    description: 'Hereford crossed with Angus or Continental',
    omegaBaseline: '10-18:1 (typical commercial)',
    notes: 'Common crosses: Hereford×Angus (Black Baldy), Hereford×Continental'
  },
  {
    id: 'miniature_polled_hereford',
    varietyId: 'hereford',
    productId: 'beef',
    displayName: 'Miniature Polled Hereford',
    description: 'Hornless miniature, ideal for small farms',
    omegaBaseline: '8-14:1 (grass-fed suitable)',
    notes: 'Combines polled and miniature traits'
  },

  // ========================================================================
  // CONTINENTAL (5 cultivars)
  // ========================================================================
  {
    id: 'charolais',
    varietyId: 'continental',
    productId: 'beef',
    displayName: 'Charolais',
    description: 'French breed, very lean, muscular, white/cream color',
    heritageIntent: 'true_heritage',
    omegaBaseline: '10-18:1 (lean, typical feedlot)',
    notes: 'France, Charolles region, prized for lean meat'
  },
  {
    id: 'limousin',
    varietyId: 'continental',
    productId: 'beef',
    displayName: 'Limousin',
    description: 'French breed, lean, high cutability, rust/gold color',
    heritageIntent: 'true_heritage',
    omegaBaseline: '10-18:1 (very lean, feedlot typical)',
    notes: 'France, Limousin region, 70%+ lean carcass'
  },
  {
    id: 'simmental',
    varietyId: 'continental',
    productId: 'beef',
    displayName: 'Simmental',
    description: 'Swiss breed, large frame, good marbling for Continental',
    heritageIntent: 'true_heritage',
    omegaBaseline: '12-20:1 (dual-purpose genetics)',
    notes: 'Switzerland, dual-purpose (milk+meat) origin'
  },
  {
    id: 'gelbvieh',
    varietyId: 'continental',
    productId: 'beef',
    displayName: 'Gelbvieh',
    description: 'German breed, red/gold, maternal traits',
    heritageIntent: 'true_heritage',
    omegaBaseline: '10-18:1 (feedlot typical)',
    notes: 'Bavaria, gentle temperament, good mothers'
  },
  {
    id: 'chianina',
    varietyId: 'continental',
    productId: 'beef',
    displayName: 'Chianina',
    description: 'Italian breed, tallest cattle, very lean',
    heritageIntent: 'true_heritage',
    omegaBaseline: '8-15:1 (extremely lean)',
    notes: 'Italy, Chiana Valley, white, ancient breed'
  },

  // ========================================================================
  // HERITAGE (6 cultivars)
  // ========================================================================
  {
    id: 'galloway',
    varietyId: 'heritage_beef',
    productId: 'beef',
    displayName: 'Galloway',
    description: 'Scottish heritage, belted coat, grass-fed ideal',
    heritageIntent: 'true_heritage',
    omegaBaseline: '2-4:1 (naturally grass-finished, low omega)',
    notes: 'Scotland, cold-hardy, thrives on grass, superior omega profile'
  },
  {
    id: 'belted_galloway',
    varietyId: 'heritage_beef',
    productId: 'beef',
    displayName: 'Belted Galloway',
    description: 'White belt on black, iconic appearance, grass-fed',
    heritageIntent: 'true_heritage',
    omegaBaseline: '2-4:1 (grass-optimized genetics)',
    notes: '"Oreo cow", same Galloway genetics + belt marking'
  },
  {
    id: 'devon',
    varietyId: 'heritage_beef',
    productId: 'beef',
    displayName: 'Devon (Red Ruby)',
    description: 'English heritage, deep red, exceptional beef flavor',
    heritageIntent: 'true_heritage',
    omegaBaseline: '3-6:1 (grass-fed suitable)',
    notes: 'Devon, England, triple-purpose (beef, milk, oxen), colonial America'
  },
  {
    id: 'highland',
    varietyId: 'heritage_beef',
    productId: 'beef',
    displayName: 'Scottish Highland',
    description: 'Long-horned, shaggy coat, grass-fed specialist',
    heritageIntent: 'true_heritage',
    omegaBaseline: '2-5:1 (naturally grass-finished)',
    notes: 'Scottish Highlands, cold-hardy, browse and graze'
  },
  {
    id: 'texas_longhorn',
    varietyId: 'heritage_beef',
    productId: 'beef',
    displayName: 'Texas Longhorn',
    description: 'American heritage, very lean, grass-efficient',
    heritageIntent: 'true_heritage',
    omegaBaseline: '3-6:1 (naturally lean, grass-fed)',
    notes: 'Spanish origin, American West icon, drought-hardy'
  },
  {
    id: 'ancient_white_park',
    varietyId: 'heritage_beef',
    productId: 'beef',
    displayName: 'Ancient White Park',
    description: 'Rare British breed, white with black points',
    heritageIntent: 'true_heritage',
    omegaBaseline: '2-4:1 (grass-finished heritage)',
    notes: 'Britain, medieval origin, critically rare'
  },

  // ========================================================================
  // COMPOSITE (5 cultivars)
  // ========================================================================
  {
    id: 'brangus',
    varietyId: 'composite',
    productId: 'beef',
    displayName: 'Brangus',
    description: 'Angus×Brahman, heat-tolerant, hybrid vigor',
    heritageIntent: 'modern_flavor',
    omegaBaseline: '10-18:1 (commercial feedlot typical)',
    notes: '3/8 Brahman, 5/8 Angus, heat/insect resistant'
  },
  {
    id: 'beefmaster',
    varietyId: 'composite',
    productId: 'beef',
    displayName: 'Beefmaster',
    description: 'Hereford×Shorthorn×Brahman, Texas development',
    heritageIntent: 'modern_flavor',
    omegaBaseline: '10-18:1 (commercial)',
    notes: 'Texas, 1930s Lasater Ranch, heat-tolerant'
  },
  {
    id: 'santa_gertrudis',
    varietyId: 'composite',
    productId: 'beef',
    displayName: 'Santa Gertrudis',
    description: 'Shorthorn×Brahman, red, heat-hardy',
    heritageIntent: 'modern_flavor',
    omegaBaseline: '10-18:1 (commercial)',
    notes: 'King Ranch Texas, first US breed, 3/8 Brahman'
  },
  {
    id: 'braford',
    varietyId: 'composite',
    productId: 'beef',
    displayName: 'Braford',
    description: 'Hereford×Brahman, heat-tolerant, docile',
    omegaBaseline: '10-18:1 (commercial)',
    notes: 'Australia/US, combines Hereford quality + Brahman hardiness'
  },
  {
    id: 'red_brangus',
    varietyId: 'composite',
    productId: 'beef',
    displayName: 'Red Brangus',
    description: 'Red Angus×Brahman, heat-tolerant',
    omegaBaseline: '10-18:1 (commercial)',
    notes: 'Red version of Brangus, Gulf Coast popular'
  }
]

async function main() {
  console.log('='.repeat(80))
  console.log('LOAD BEEF VARIETIES AND BREEDS')
  console.log('='.repeat(80))
  console.log()
  console.log(`Varieties to create: ${BEEF_VARIETIES.length}`)
  console.log(`Cultivars to create: ${BEEF_CULTIVARS.length}`)
  console.log()

  // =========================================================================
  // STEP 1: Create Variety nodes
  // =========================================================================
  console.log('STEP 1: Creating beef varieties (breed families)...')
  let varietiesCreated = 0

  for (const variety of BEEF_VARIETIES) {
    await runWriteTransaction(`
      MERGE (v:Variety {id: $id})
      SET v.productId = $productId,
          v.displayName = $displayName,
          v.description = $description,
          v.source = 'typescript'

      // Link to ProductType (Beef)
      WITH v
      MATCH (p:ProductType {id: $productId})
      MERGE (v)-[:BELONGS_TO_PRODUCT]->(p)
    `, {
      id: variety.id,
      productId: variety.productId,
      displayName: variety.displayName,
      description: variety.description
    })

    varietiesCreated++
    console.log(`  ✓ ${variety.displayName}`)
  }

  console.log(`  Completed: ${varietiesCreated} varieties`)
  console.log()

  // =========================================================================
  // STEP 2: Create Cultivar nodes and link to Varieties
  // =========================================================================
  console.log('STEP 2: Creating beef cultivars (specific breeds)...')
  let cultivarsCreated = 0

  for (const cultivar of BEEF_CULTIVARS) {
    await runWriteTransaction(`
      CREATE (c:Cultivar {
        id: $id,
        productId: $productId,
        displayName: $displayName,
        name: $displayName,
        varietyId: $varietyId,
        description: $description,
        source: 'typescript_beef',
        modelType: 'parent'
      })

      // Add optional fields
      SET c.heritageIntent = $heritageIntent,
          c.omegaBaseline = $omegaBaseline,
          c.notes = $notes

      // Link to Variety
      WITH c
      MATCH (v:Variety {id: $varietyId})
      MERGE (c)-[:BELONGS_TO_VARIETY]->(v)

      // Link to ProductType
      WITH c
      MATCH (p:ProductType {id: $productId})
      MERGE (c)-[:IS_A]->(p)

      RETURN c.displayName as name
    `, {
      id: cultivar.id,
      productId: cultivar.productId,
      varietyId: cultivar.varietyId,
      displayName: cultivar.displayName,
      description: cultivar.description,
      heritageIntent: cultivar.heritageIntent || null,
      omegaBaseline: cultivar.omegaBaseline || null,
      notes: cultivar.notes || null
    })

    cultivarsCreated++
    if (cultivarsCreated % 5 === 0) {
      console.log(`  ✓ Created ${cultivarsCreated}/${BEEF_CULTIVARS.length} cultivars...`)
    }
  }

  console.log(`  Completed: ${cultivarsCreated} cultivars`)
  console.log()

  // =========================================================================
  // VERIFICATION
  // =========================================================================
  console.log('='.repeat(80))
  console.log('VERIFICATION')
  console.log('='.repeat(80))
  console.log()

  for (const variety of BEEF_VARIETIES) {
    const count = await runWriteTransaction<{ count: number }>(`
      MATCH (c:Cultivar)-[:BELONGS_TO_VARIETY]->(v:Variety {id: $varietyId})
      RETURN count(c) as count
    `, { varietyId: variety.id })

    const status = Number(count[0].count) >= 5 ? '✅' : '⚠️'
    console.log(`${status} ${variety.displayName}: ${count[0].count} cultivars`)
  }

  console.log()

  await closeDriver()
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
