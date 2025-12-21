const fs = require('fs');
const path = require('path');

// Load current knowledge graph (v2 with perennials)
const kgPath = path.join(__dirname, '../data/research/knowledge-graph-integrated-v2.json');
const kg = JSON.parse(fs.readFileSync(kgPath, 'utf8'));

// Load SeedsNow data
const seedsnowPath = path.join(__dirname, '../data/research/seed-company-seedsnow-zone10.json');
const seedsnow = JSON.parse(fs.readFileSync(seedsnowPath, 'utf8'));

console.log('=== Integrating SeedsNow into Knowledge Graph ===\n');

// Track statistics
let newCultivars = 0;
let newZoneRelationships = 0;
const cropTypeStats = {};
const zoneStats = {};

// Helper to parse crop type from product name/category
function parseCropType(cultivar) {
  const name = cultivar.name.toLowerCase();
  const type = cultivar.productType.toLowerCase();

  // Map product types to crop categories
  if (type.includes('tomato')) return 'tomato';
  if (type.includes('pepper')) return 'pepper';
  if (type.includes('bean')) return 'bean';
  if (type.includes('squash')) return 'squash';
  if (type.includes('lettuce')) return 'lettuce';
  if (type.includes('cucumber')) return 'cucumber';
  if (type.includes('carrot')) return 'carrot';
  if (type.includes('cabbage')) return 'cabbage';
  if (type.includes('watermelon')) return 'watermelon';
  if (type.includes('gourd')) return 'gourd';
  if (type.includes('basil')) return 'basil';
  if (type.includes('garlic')) return 'garlic';
  if (type.includes('sprout')) return 'sprouts';
  if (type.includes('flower') || cultivar.crop === 'flower') return 'flower';

  // Try to parse from name
  if (name.includes('tomato')) return 'tomato';
  if (name.includes('pepper')) return 'pepper';
  if (name.includes('bean')) return 'bean';

  return 'other';
}

// Helper to detect heirloom/heritage intent
function detectHeritageIntent(cultivar) {
  const name = cultivar.name.toLowerCase();
  const tags = cultivar.tags.map(t => t.toLowerCase());

  if (tags.includes('heirloom') || name.includes('heirloom')) {
    return 'heirloom_quality';
  }
  if (name.includes('organic')) {
    return 'organic';
  }
  return 'commercial';
}

// Initialize SeedsNow cultivars collection
if (!kg.entities.seedsnowCultivars) {
  kg.entities.seedsnowCultivars = {};
}

// Process each SeedsNow cultivar
seedsnow.cultivars.forEach((cultivar, idx) => {
  const cropType = parseCropType(cultivar);
  const heritageIntent = detectHeritageIntent(cultivar);

  // Create unique ID
  const id = `seedsnow:${cultivar.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .substring(0, 80)}`;

  // Track stats
  cropTypeStats[cropType] = (cropTypeStats[cropType] || 0) + 1;

  // Extract zones from tags
  const zones = cultivar.tags
    .filter(tag => tag.startsWith('US Zone'))
    .map(tag => tag.replace('US Zone ', '').toLowerCase());

  zones.forEach(z => {
    zoneStats[z] = (zoneStats[z] || 0) + 1;
  });

  // Add to knowledge graph
  kg.entities.seedsnowCultivars[id] = {
    id,
    type: "Cultivar",
    source: "SeedsNow",
    commonName: cultivar.name,
    scientificName: cultivar.scientificName,
    cropType,
    heritageIntent,
    daysToMaturity: cultivar.daysToMaturity,
    zones: zones,
    packSizes: cultivar.packSizes,
    productUrl: cultivar.productUrl,
    productType: cultivar.productType,
    vendor: cultivar.vendor,
    tags: cultivar.tags,
    isOrganic: cultivar.name.toLowerCase().includes('organic'),
    isVegetable: cultivar.crop === 'vegetable',
    isFlower: cultivar.crop === 'flower'
  };

  newCultivars++;
});

// Create zone compatibility relationships
if (!kg.relationships.seedsnowZoneCompatibility) {
  kg.relationships.seedsnowZoneCompatibility = [];
}

Object.entries(kg.entities.seedsnowCultivars).forEach(([id, cultivar]) => {
  cultivar.zones.forEach(zone => {
    // Map to zone entity (strip a/b suffix)
    const zoneNum = zone.replace(/[ab]/, '');

    kg.relationships.seedsnowZoneCompatibility.push({
      from: id,
      to: `zone:${zoneNum}`,
      type: "GROWS_IN_ZONE",
      details: {
        zone: zone,
        source: "SeedsNow",
        confidence: 0.95,
        dataType: "zone_compatibility"
      }
    });

    newZoneRelationships++;
  });
});

// Add SeedsNow as a data source
kg.entities.dataSources.seedsnow = {
  id: "source:seedsnow",
  type: "DataSource",
  name: "SeedsNow",
  category: "seed_company",
  confidence: 0.95,
  lastUpdated: seedsnow.collectionDate,
  totalCultivars: seedsnow.totalCultivars,
  organization: "SeedsNow",
  url: seedsnow.url,
  notes: "Zone-organized seed company with 600+ cultivars. Zone compatibility verified, zone-specific timing data limited.",
  dataAvailable: {
    zoneCompatibility: true,
    cultivarNames: true,
    scientificNames: "partial",
    daysToMaturity: "minimal",
    packSizes: true,
    pricing: true
  }
};

// Update metadata
kg.metadata.version = "3.0.0";
kg.metadata.lastUpdated = "2025-12-21";
kg.metadata.description = "Integrated knowledge graph: annual vegetables (state calendars, extension research, seed companies) + perennial crops (food forest) + SeedsNow zone compatibility (621 cultivars)";
kg.metadata.totalEntities = kg.metadata.totalEntities + newCultivars;
kg.metadata.seedsnowCultivarCount = newCultivars;
kg.metadata.dataSourceCount = Object.keys(kg.entities.dataSources).length;

// Add SeedsNow integration notes
if (!kg.integrationNotes) {
  kg.integrationNotes = [];
}

kg.integrationNotes.push({
  version: "3.0.0",
  date: "2025-12-21",
  integration: "SeedsNow Zone 10 Collection",
  summary: `Added ${newCultivars} cultivars with zone compatibility data from SeedsNow`,
  highlights: [
    "621 cultivars with USDA zone compatibility",
    "558 vegetables + 63 flowers",
    "93.4% compatible with Zone 11 (Florida)",
    "Zone-first organization matches USDA system",
    "15.9x increase in cultivar coverage over previous seed companies"
  ],
  dataQuality: {
    zoneCompatibility: "100%",
    scientificNames: "14.3%",
    daysToMaturity: "0.5%",
    pricing: "100%"
  },
  cropTypeBreakdown: cropTypeStats,
  zoneDistribution: Object.keys(zoneStats).length + " zones covered"
});

// Save updated knowledge graph
const outputPath = path.join(__dirname, '../data/research/knowledge-graph-integrated-v3.json');
fs.writeFileSync(outputPath, JSON.stringify(kg, null, 2));

console.log('✅ SeedsNow integration complete!\n');
console.log('Statistics:');
console.log(`  New cultivars added: ${newCultivars}`);
console.log(`  New zone relationships: ${newZoneRelationships}`);
console.log(`  Total entities: ${kg.metadata.totalEntities}`);
console.log(`  Data sources: ${kg.metadata.dataSourceCount}`);

console.log('\nCrop Type Breakdown:');
Object.entries(cropTypeStats)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([crop, count]) => {
    console.log(`  ${crop}: ${count}`);
  });

console.log('\nZone Coverage:');
Object.entries(zoneStats)
  .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  .forEach(([zone, count]) => {
    console.log(`  Zone ${zone}: ${count} cultivars`);
  });

console.log(`\n✅ Saved to: data/research/knowledge-graph-integrated-v3.json`);
console.log(`\nKnowledge Graph Evolution:`);
console.log(`  v1.0: Annual vegetables (156 entities)`);
console.log(`  v2.0: + Perennials (377 entities) = 533 total`);
console.log(`  v3.0: + SeedsNow (621 entities) = ${kg.metadata.totalEntities} total`);
