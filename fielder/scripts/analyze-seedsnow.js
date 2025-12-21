const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/research/seed-company-seedsnow-zone10.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('=== SeedsNow Zone 10 Collection Analysis ===\n');
console.log(`Total cultivars: ${data.totalCultivars}`);

// Crop type breakdown
const cropTypes = {};
data.cultivars.forEach(c => {
  cropTypes[c.crop] = (cropTypes[c.crop] || 0) + 1;
});
console.log('\nCrop Types:');
Object.entries(cropTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`  ${type}: ${count} (${(count/data.totalCultivars*100).toFixed(1)}%)`);
});

// Scientific names
const withScientificName = data.cultivars.filter(c => c.scientificName).length;
console.log(`\nScientific names: ${withScientificName} (${(withScientificName/data.totalCultivars*100).toFixed(1)}%)`);

// Days to maturity
const withDTM = data.cultivars.filter(c => c.daysToMaturity).length;
console.log(`Days to maturity data: ${withDTM} (${(withDTM/data.totalCultivars*100).toFixed(1)}%)`);

// Zone coverage
const zonesSet = new Set();
data.cultivars.forEach(c => {
  c.tags.forEach(tag => {
    if (tag.startsWith('US Zone')) {
      zonesSet.add(tag);
    }
  });
});
console.log(`\nZone tags found: ${Array.from(zonesSet).sort().join(', ')}`);

// Product types
const productTypes = {};
data.cultivars.forEach(c => {
  const type = c.productType || 'Unknown';
  productTypes[type] = (productTypes[type] || 0) + 1;
});
console.log(`\nTop 15 Product Categories:`);
Object.entries(productTypes).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

// Sample cultivars with full data
console.log('\n\nSample cultivars with scientific names:');
data.cultivars.filter(c => c.scientificName).slice(0, 5).forEach(c => {
  console.log(`\n  ${c.name}`);
  console.log(`    Scientific: ${c.scientificName}`);
  console.log(`    Category: ${c.productType}`);
  console.log(`    Packs: ${c.packSizes.length} options`);
});

// Florida-specific check (Zone 10-11)
const zone11 = data.cultivars.filter(c => c.tags.includes('US Zone 11'));
console.log(`\n\n=== Florida Relevance (Zones 10-11) ===`);
console.log(`Zone 10 compatible: ${data.totalCultivars} (100% - filtered by this zone)`);
console.log(`Zone 11 compatible: ${zone11.length} (${(zone11.length/data.totalCultivars*100).toFixed(1)}%)`);

// Organic
const organic = data.cultivars.filter(c => c.name.toLowerCase().includes('organic'));
console.log(`\nOrganic cultivars: ${organic.length} (${(organic.length/data.totalCultivars*100).toFixed(1)}%)`);

// Heirloom
const heirloom = data.cultivars.filter(c =>
  c.tags.some(t => t.toLowerCase().includes('heirloom')) ||
  c.name.toLowerCase().includes('heirloom')
);
console.log(`Heirloom cultivars: ${heirloom.length} (${(heirloom.length/data.totalCultivars*100).toFixed(1)}%)`);
