const fs = require('fs');
const path = require('path');

// Load existing knowledge graph
const kgPath = path.join(__dirname, '../data/research/knowledge-graph-integrated.json');
const kg = JSON.parse(fs.readFileSync(kgPath, 'utf8'));

// Load perennial data
const perennialsPath = path.join(__dirname, '../data/research/food-forest-perennials.json');
const perennials = JSON.parse(fs.readFileSync(perennialsPath, 'utf8'));

// Add new entity type for perennials
kg.schema.entityTypes.PerennialCrop = {
  description: "Perennial food plant organized by permaculture layer with zone compatibility",
  attributes: ["commonName", "scientificName", "layer", "zones", "growingGuide", "isTreeCrop", "isShrub"]
};

// Add new relationship type
kg.schema.relationshipTypes.GROWS_IN_ZONE = "PerennialCrop → Zone (perennial can grow in specific zone)";
kg.schema.relationshipTypes.COMPLEMENTS = "PerennialCrop ↔ Cultivar (perennial trees complement seasonal vegetables)";

// Create perennialCrops entity collection
kg.entities.perennialCrops = {};

// Add perennials to knowledge graph
let perennialCount = 0;
const floridaZones = ['8a', '8b', '9a', '9b', '10a', '10b', '11a', '11b'];
let floridaSuitableCount = 0;

// Layer statistics
const layerStats = {};

perennials.plants.forEach((plant, idx) => {
  const id = `perennial:${plant.commonName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

  // Track layer stats
  layerStats[plant.layer] = (layerStats[plant.layer] || 0) + 1;

  // Check if suitable for Florida
  const floridaCompatible = plant.zones.some(z =>
    floridaZones.includes(z.toLowerCase())
  );

  if (floridaCompatible) {
    floridaSuitableCount++;
  }

  kg.entities.perennialCrops[id] = {
    id,
    type: "PerennialCrop",
    commonName: plant.commonName,
    scientificName: plant.scientificName,
    layer: plant.layer,
    zones: plant.zones.map(z => z.toLowerCase()),
    growingGuide: plant.growingGuide,
    floridaCompatible,

    // Classify by layer
    isTreeCrop: ['Canopy Layer', 'Understory Layer'].includes(plant.layer),
    isShrub: plant.layer === 'Shrub Layer',
    isHerbaceous: plant.layer === 'Herbaceous Layer',
    isVine: plant.layer === 'Vertical Layer',
    isGroundcover: plant.layer === 'Groundcover Layer',
    isRootCrop: plant.layer === 'Rhizosphere Layer',
    isAquatic: plant.layer === 'Aquatic Layer',
    isFungal: plant.layer === 'Fungal Layer'
  };

  perennialCount++;
});

// Update metadata
kg.metadata.version = "2.0.0";
kg.metadata.lastUpdated = "2025-12-20";
kg.metadata.description = "Integrated knowledge graph combining annual vegetables (state calendars, extension research, seed companies, farms) with perennial crops (food forest permaculture layers, zone compatibility)";
kg.metadata.totalEntities = 156 + perennialCount;
kg.metadata.perennialCropCount = perennialCount;
kg.metadata.floridaSuitablePerennials = floridaSuitableCount;
kg.metadata.annualVegetableCount = 156;
kg.metadata.permacultureLayers = Object.keys(layerStats).length;
kg.metadata.layerBreakdown = layerStats;

// Add data source
if (!kg.entities.dataSources) {
  kg.entities.dataSources = {};
}

kg.entities.dataSources.food_forest = {
  id: "source:food_forest",
  type: "DataSource",
  name: "Food Forest Plant Options",
  category: "perennial_crops",
  confidence: 0.90,
  lastUpdated: "2025-12-20",
  totalSpecies: perennialCount,
  organization: "Permaculture Design",
  notes: "Perennial food crops organized by 9 permaculture layers with USDA zone compatibility"
};

// Initialize relationships object if needed
if (!kg.relationships) {
  kg.relationships = {};
}

// Create new relationship collection for perennial zone compatibility
kg.relationships.perennialZoneCompatibility = [];

// Add zone compatibility relationships for Florida perennials
Object.entries(kg.entities.perennialCrops).forEach(([id, plant]) => {
  if (plant.floridaCompatible) {
    plant.zones.forEach(zone => {
      if (floridaZones.includes(zone)) {
        // Link to zone entity
        const zoneNum = zone.replace(/[ab]/, '');
        kg.relationships.perennialZoneCompatibility.push({
          from: id,
          to: `zone:${zoneNum}`,
          type: "GROWS_IN_ZONE",
          details: {
            subzone: zone,
            layer: plant.layer,
            confidence: 0.90
          }
        });
      }
    });
  }
});

const newRelationshipCount = kg.relationships.perennialZoneCompatibility.length;

// Add integration examples showing how perennials complement annual vegetables
kg.integrationExamples = [
  {
    title: "Zone 10 Year-Round Food System",
    description: "Combining perennial tree crops with seasonal vegetables for continuous production",
    components: [
      {
        type: "Perennial Canopy",
        examples: ["Avocado Tree", "Mango Tree", "Lychee Tree"],
        zones: ["10a", "10b"],
        benefit: "Year-round fruit production, permanent carbon sequestration"
      },
      {
        type: "Annual Vegetables",
        examples: ["Cherokee Purple Tomato", "Florida-adapted crops"],
        zones: ["10a", "10b"],
        seasons: ["Fall planting (Aug-Sep)", "Winter harvest (Nov-Apr)"],
        benefit: "Seasonal rotation, high nutrition density"
      },
      {
        type: "Integration Strategy",
        description: "Perennial trees provide shade, nitrogen fixing, and soil building while annual vegetables rotate in understory for peak seasonal nutrition. This creates a regenerative system where perennials improve soil over time, reducing inputs needed for annuals."
      }
    ]
  },
  {
    title: "Florida Citrus Belt (Zones 9-10) - Commercial Integration",
    description: "Commercial citrus orchards with understory vegetables for diversified income",
    perennials: ["Sweet Orange", "Grapefruit", "Meyer Lemon"],
    annuals: ["Tomatoes (fall)", "Strawberries (winter)", "Peppers (spring)"],
    zones: ["9a", "9b", "10a", "10b"],
    benefit: "Maximize land use efficiency, diversify farm income, improve soil health, extend harvest season"
  },
  {
    title: "Subtropical Food Forest (Zone 9-11) - Layered Design",
    description: "Nine-layer permaculture design providing continuous food production",
    layers: {
      canopy: "Avocado, Mango, Macadamia Nut (20+ ft)",
      understory: "Citrus, Lychee, Longan (10-20 ft)",
      shrub: "Blueberry, Fig, Blackberry (2-10 ft)",
      herbaceous: "Tomatoes, Peppers, Eggplant (annuals, seasonally rotated)",
      vertical: "Passion Fruit, Grape, Chayote (climbing vines)",
      groundcover: "Strawberry, Sweet Potato (soil protection)",
      rhizosphere: "Ginger, Turmeric, Cassava (root crops)",
      aquatic: "Taro, Watercress (if water feature present)",
      fungal: "Shiitake, Oyster mushrooms (on logs/stumps)"
    },
    benefit: "Maximum production per square foot, natural pest control, soil regeneration, microclimate creation"
  }
];

// Save updated knowledge graph
const outputPath = path.join(__dirname, '../data/research/knowledge-graph-integrated-v2.json');
fs.writeFileSync(outputPath, JSON.stringify(kg, null, 2));

console.log('\n✅ Knowledge graph integration complete!');
console.log(`\nStatistics:`);
console.log(`  Total entities: ${kg.metadata.totalEntities}`);
console.log(`    - Annual vegetables: ${kg.metadata.annualVegetableCount}`);
console.log(`    - Perennial crops: ${kg.metadata.perennialCropCount}`);
console.log(`  Florida-suitable perennials: ${floridaSuitableCount}`);
console.log(`  Relationship collections: ${Object.keys(kg.relationships).length}`);
console.log(`    - Added ${newRelationshipCount} perennial zone compatibility relationships`);
console.log(`\nPermaculture Layer Breakdown:`);
Object.entries(layerStats).forEach(([layer, count]) => {
  console.log(`  ${layer}: ${count} plants`);
});
console.log(`\n✅ Saved to: data/research/knowledge-graph-integrated-v2.json`);
