/**
 * =============================================================================
 * AGRICULTURAL PRACTICE DEFINITIONS
 * =============================================================================
 *
 * Farm-to-table food labeling is confusing by design. Terms like "cage free",
 * "natural", and "Product of USA" sound meaningful but often aren't.
 *
 * This reference table provides:
 * 1. What each term legally means (or doesn't)
 * 2. What it practically means for the animal/product
 * 3. Whether it's meaningful, regulated, or marketing
 * 4. How it maps to SHARE principles
 *
 * Fielder uses this to be transparent about what we source and why.
 *
 * =============================================================================
 * KEY SCIENTIFIC REFERENCES
 * =============================================================================
 *
 * AMES, B.N., PROFET, M., & GOLD, L.S. (1990)
 * "Dietary pesticides (99.99% all natural)"
 * Proceedings of the National Academy of Sciences, 87(19), 7777-7781.
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC54831/
 *
 * Key findings:
 * - 99.99% (by weight) of pesticides in diet are NATURAL (plant-produced)
 * - Of 52 natural pesticides tested, ~50% are rodent carcinogens
 * - Natural and synthetic chemicals equally likely to be carcinogenic
 * - Synthetic pesticide residues pose "negligible comparative hazards"
 *
 * This research informs Fielder's position that:
 * - Organic's focus on avoiding synthetic pesticides is scientifically weak
 * - Natural ≠ safe, synthetic ≠ dangerous (both are dose-dependent)
 * - Primary nutrition (Brix) matters more than pesticide source
 * - Many "secondary nutrients" organic touts ARE the natural pesticides
 */

export type DefinitionCategory =
  | 'animal_welfare'
  | 'feeding_practice'
  | 'origin_labeling'
  | 'certification'
  | 'production_method'
  | 'environmental'

export type MeaningfulnessLevel =
  | 'meaningful'        // Actually indicates better quality/practices
  | 'somewhat_meaningful' // Has some standards but loopholes exist
  | 'marketing'         // Mostly marketing, minimal real requirements
  | 'misleading'        // Actively misleading consumers
  | 'unregulated'       // No legal definition or enforcement

export type RegulatoryStatus =
  | 'usda_regulated'    // USDA defines and enforces
  | 'fda_regulated'     // FDA defines and enforces
  | 'third_party_certified' // Private certification body
  | 'self_certified'    // Producer makes the claim, no verification
  | 'no_legal_definition' // Term has no legal meaning

export interface AgriculturalDefinition {
  id: string
  term: string
  category: DefinitionCategory

  // What it means
  legalDefinition: string          // What the law says (if anything)
  practicalReality: string         // What it actually means in practice
  loopholes?: string[]             // Known loopholes or issues

  // Assessment
  meaningfulness: MeaningfulnessLevel
  regulatoryStatus: RegulatoryStatus
  enforcementLevel: 'strong' | 'weak' | 'none'

  // SHARE mapping
  shareRelevance: ('S' | 'H' | 'A' | 'R' | 'E')[]  // Which SHARE principles it relates to
  qualityImpact: string            // How it affects product quality

  // Fielder stance
  fielderAccepts: boolean          // Do we accept products with just this claim?
  fielderRequires?: string[]       // What additional verification we require
  fielderNotes: string             // Our perspective on this term

  // Consumer guidance
  consumerTakeaway: string         // Plain English for consumers
  betterAlternatives?: string[]    // Terms that mean more
}

// =============================================================================
// ANIMAL WELFARE TERMS
// =============================================================================

export const ANIMAL_WELFARE_DEFINITIONS: AgriculturalDefinition[] = [
  {
    id: 'cage_free',
    term: 'Cage Free',
    category: 'animal_welfare',
    legalDefinition: 'Hens are not kept in battery cages. No outdoor access required.',
    practicalReality: 'Birds may still be packed in overcrowded barns with no outdoor access, natural light, or room to move. Just no individual cages.',
    loopholes: [
      'No space requirements per bird',
      'No outdoor access required',
      'No natural light required',
      'Beak trimming still allowed',
    ],
    meaningfulness: 'somewhat_meaningful',
    regulatoryStatus: 'usda_regulated',
    enforcementLevel: 'weak',
    shareRelevance: ['A'],
    qualityImpact: 'Minimal impact on egg nutrition. Slightly better than battery cages.',
    fielderAccepts: false,
    fielderRequires: ['pasture_raised', 'outdoor_access'],
    fielderNotes: 'Cage free is the bare minimum. We require pasture-raised for eggs.',
    consumerTakeaway: 'Better than battery cages, but birds may still live in crowded barns with no outdoor access.',
    betterAlternatives: ['pasture_raised', 'certified_humane_pasture_raised'],
  },
  {
    id: 'free_range',
    term: 'Free Range',
    category: 'animal_welfare',
    legalDefinition: 'Birds have "access to the outdoors". No specification on duration, space, or quality of outdoor area.',
    practicalReality: 'Often means a small door to a concrete patio that birds rarely use. Could be 5 minutes of access per day to a tiny space.',
    loopholes: [
      'No minimum time outdoors',
      'No minimum outdoor space',
      'Outdoor area can be concrete/dirt',
      '"Access" can be a small door most birds never find',
    ],
    meaningfulness: 'marketing',
    regulatoryStatus: 'usda_regulated',
    enforcementLevel: 'weak',
    shareRelevance: ['A'],
    qualityImpact: 'Minimal to no impact on nutrition if birds never actually go outside.',
    fielderAccepts: false,
    fielderRequires: ['pasture_raised', 'verified_outdoor_time'],
    fielderNotes: 'Free range is largely meaningless. The outdoor "access" is often a joke.',
    consumerTakeaway: 'Sounds good but usually means very little. Birds may never actually go outside.',
    betterAlternatives: ['pasture_raised', 'certified_humane_pasture_raised'],
  },
  {
    id: 'pasture_raised',
    term: 'Pasture Raised',
    category: 'animal_welfare',
    legalDefinition: 'No USDA legal definition. When certified (e.g., Certified Humane), requires 108 sq ft per bird outdoors and meaningful outdoor time.',
    practicalReality: 'When properly implemented: birds live on rotating pastures, eat insects/grubs, get exercise and sunlight. Significant welfare and nutrition improvement.',
    loopholes: [
      'No legal definition without certification',
      'Uncertified claims are unverified',
    ],
    meaningfulness: 'meaningful',
    regulatoryStatus: 'third_party_certified',
    enforcementLevel: 'strong',
    shareRelevance: ['A', 'E'],
    qualityImpact: 'Significantly higher Omega-3, Vitamin D, Vitamin E in eggs. Better fatty acid profile in meat.',
    fielderAccepts: true,
    fielderRequires: ['third_party_certification_or_farm_verification'],
    fielderNotes: 'This is our baseline for eggs and poultry. Must be certified or farm-verified.',
    consumerTakeaway: 'When certified, this is meaningful. Birds actually live outdoors on pasture. Look for certification.',
    betterAlternatives: ['certified_humane_pasture_raised', 'animal_welfare_approved'],
  },
  {
    id: 'certified_humane',
    term: 'Certified Humane',
    category: 'animal_welfare',
    legalDefinition: 'Third-party certification by Humane Farm Animal Care with specific space, enrichment, and handling standards.',
    practicalReality: 'Meaningful standards with regular farm audits. Different tiers exist (Cage Free, Free Range, Pasture Raised).',
    meaningfulness: 'meaningful',
    regulatoryStatus: 'third_party_certified',
    enforcementLevel: 'strong',
    shareRelevance: ['A'],
    qualityImpact: 'Varies by tier. Certified Humane Pasture Raised has the highest standards.',
    fielderAccepts: true,
    fielderNotes: 'We accept Certified Humane Pasture Raised tier. Lower tiers (cage free, free range) still insufficient.',
    consumerTakeaway: 'Legitimate certification with real standards. Check which tier - Pasture Raised is best.',
  },
  {
    id: 'animal_welfare_approved',
    term: 'Animal Welfare Approved',
    category: 'animal_welfare',
    legalDefinition: 'Third-party certification with the highest welfare standards. Requires pasture access, no feedlots, no cages.',
    practicalReality: 'Gold standard for animal welfare. Only family farms eligible. Continuous outdoor access on pasture.',
    meaningfulness: 'meaningful',
    regulatoryStatus: 'third_party_certified',
    enforcementLevel: 'strong',
    shareRelevance: ['A', 'E'],
    qualityImpact: 'Highest welfare = best nutrition profile. These animals are actually healthy.',
    fielderAccepts: true,
    fielderNotes: 'This is the gold standard. We actively seek AWA-certified farms.',
    consumerTakeaway: 'The highest animal welfare certification. If you see this, the farm is doing it right.',
  },
]

// =============================================================================
// FEEDING PRACTICE TERMS
// =============================================================================

export const FEEDING_PRACTICE_DEFINITIONS: AgriculturalDefinition[] = [
  {
    id: 'grass_fed',
    term: 'Grass Fed',
    category: 'feeding_practice',
    legalDefinition: 'USDA withdrew its grass-fed standard in 2016. No current federal definition.',
    practicalReality: 'Can mean anything from 100% grass diet to "ate some grass at some point". Many grass-fed cattle are grain-finished in feedlots.',
    loopholes: [
      'No legal definition since 2016',
      'Does not mean grass-finished',
      'Cattle can be grain-finished in feedlots and still labeled grass-fed',
      'No verification required',
    ],
    meaningfulness: 'somewhat_meaningful',
    regulatoryStatus: 'no_legal_definition',
    enforcementLevel: 'none',
    shareRelevance: ['A', 'E'],
    qualityImpact: 'Depends entirely on whether also grass-FINISHED or pasture-raised without feedlots.',
    fielderAccepts: false,
    fielderRequires: ['grass_finished_or_pasture_raised_no_feedlot', 'verified_diet'],
    fielderNotes: 'Grass-fed alone tells us nothing. We need to know: grass-finished? Or pasture-raised with minimal grain and NO feedlot?',
    consumerTakeaway: 'Misleading without more detail. Many "grass-fed" cattle spend final months in feedlots eating grain.',
    betterAlternatives: ['grass_finished', 'pasture_raised_no_feedlot'],
  },
  {
    id: 'grass_finished',
    term: 'Grass Finished',
    category: 'feeding_practice',
    legalDefinition: 'No federal definition, but generally means cattle ate only grass/forage for their entire life, including finishing.',
    practicalReality: 'The critical term for 100% grass diet. Finishing period (final 3-6 months) determines fatty acid profile.',
    meaningfulness: 'meaningful',
    regulatoryStatus: 'no_legal_definition',
    enforcementLevel: 'none',
    shareRelevance: ['A', 'E'],
    qualityImpact: 'Best Omega-6:Omega-3 ratio (~3:1). Higher CLA, Vitamin E, beta-carotene. Leanest option.',
    fielderAccepts: true,
    fielderRequires: ['farm_verification_or_certification'],
    fielderNotes: 'We accept and verify grass-finished beef. Best fatty acid profile.',
    consumerTakeaway: 'This means 100% grass diet, never ate grain. Best for Omega-3.',
  },
  {
    id: 'pasture_raised_beef',
    term: 'Pasture Raised (Beef)',
    category: 'feeding_practice',
    legalDefinition: 'No federal definition. Generally means cattle raised on pasture with possible grain supplementation.',
    practicalReality: 'When done right: cattle live on pasture, eat primarily grass, may get minimal grain supplementation, but NEVER go to a feedlot. Still excellent fatty acid profile.',
    loopholes: [
      'No legal definition',
      'Must verify no feedlot',
      'Must verify grain is truly minimal',
    ],
    meaningfulness: 'meaningful',
    regulatoryStatus: 'no_legal_definition',
    enforcementLevel: 'none',
    shareRelevance: ['A', 'E'],
    qualityImpact: 'Excellent Omega-6:Omega-3 ratio when done right (~6:1 vs feedlot 20:1). The key is NO FEEDLOT and minimal grain.',
    fielderAccepts: true,
    fielderRequires: ['no_feedlot_verified', 'minimal_grain_verified', 'farm_direct'],
    fielderNotes: 'We accept pasture-raised with minimal grain as long as cattle never went to a feedlot. Our own ranch beef is pasture-raised and achieves 6:1 Omega-6:Omega-3 ratio.',
    consumerTakeaway: 'Good option when verified. Key questions: Did they ever go to a feedlot? How much grain? Look for farm-direct.',
  },
  {
    id: 'full_maturity',
    term: 'Full Maturity / Time to Harvest',
    category: 'feeding_practice',
    legalDefinition: 'No legal standard for harvest age. Industry determines based on economics, not quality.',
    practicalReality: 'Commodity operations rush animals to market weight. Feedlots use grain to accelerate growth. Quality operations give animals time to reach full genetic potential.',
    loopholes: [
      'No disclosure of harvest age required',
      'Consumers have no way to know animal age',
    ],
    meaningfulness: 'meaningful',
    regulatoryStatus: 'no_legal_definition',
    enforcementLevel: 'none',
    shareRelevance: ['R', 'E'],
    qualityImpact: 'Time to maturity affects flavor development, fat composition, and nutrient density. Rushed = inferior.',
    fielderAccepts: true,
    fielderRequires: ['verified_harvest_age'],
    fielderNotes: 'We require full maturity. Our pasture-raised beef: 24 months (vs 14-18 commodity). Our pasture-raised pork: 10-12 months (vs 5 months grocery store). Time = flavor + nutrition.',
    consumerTakeaway: 'Ask how old the animal was at harvest. Longer = better flavor and nutrition. Rushed animals never reach their potential.',
  },
  {
    id: 'grain_fed',
    term: 'Grain Fed / Feedlot Finished',
    category: 'feeding_practice',
    legalDefinition: 'No specific definition. Generally means cattle finished on grain in feedlots.',
    practicalReality: 'Standard commodity beef. Cattle spend final 3-6 months in feedlots eating corn/soy. Faster weight gain, more marbling, but poor fatty acid profile.',
    meaningfulness: 'meaningful',
    regulatoryStatus: 'no_legal_definition',
    enforcementLevel: 'none',
    shareRelevance: ['A', 'E'],
    qualityImpact: 'High Omega-6, low Omega-3. Ratio of 20:1 or worse. This is what we avoid.',
    fielderAccepts: false,
    fielderNotes: 'We do not source feedlot beef. The Omega-6 levels are what we minimize.',
    consumerTakeaway: 'Standard supermarket beef. High in inflammatory Omega-6 from grain/feedlot finishing.',
  },
  {
    id: 'vegetarian_fed',
    term: 'Vegetarian Fed',
    category: 'feeding_practice',
    legalDefinition: 'Animals fed a diet containing no animal byproducts.',
    practicalReality: 'Sounds good but chickens are omnivores - they naturally eat insects, grubs, worms. "Vegetarian fed" often means indoor birds that never forage.',
    loopholes: [
      'Chickens are naturally omnivores',
      'Often indicates birds never went outside',
      'Corn/soy diet is "vegetarian" but not optimal',
    ],
    meaningfulness: 'misleading',
    regulatoryStatus: 'usda_regulated',
    enforcementLevel: 'weak',
    shareRelevance: ['A'],
    qualityImpact: 'May indicate inferior nutrition since pastured birds eat insects which improve Omega-3 content.',
    fielderAccepts: false,
    fielderNotes: 'This is backwards. Pastured birds SHOULD eat insects. Vegetarian-fed often means never went outside.',
    consumerTakeaway: 'Counterintuitive: this often means WORSE conditions. Chickens naturally eat bugs.',
    betterAlternatives: ['pasture_raised'],
  },
]

// =============================================================================
// ORIGIN LABELING TERMS
// =============================================================================

export const ORIGIN_LABELING_DEFINITIONS: AgriculturalDefinition[] = [
  {
    id: 'product_of_usa_beef',
    term: 'Product of USA (Beef)',
    category: 'origin_labeling',
    legalDefinition: 'Beef can be labeled "Product of USA" if it is simply PACKAGED in the USA. The cattle can be born, raised, and slaughtered entirely in another country.',
    practicalReality: 'Imported beef from Brazil, Australia, Mexico, etc. gets repackaged in a US facility and legally becomes "Product of USA". The animal may have never been in the US.',
    loopholes: [
      'Only requires packaging in USA - not birth, raising, or slaughter',
      'Cattle can spend entire life in another country',
      'No requirement to disclose actual country of origin',
      'COOL (Country of Origin Labeling) was repealed for beef in 2015',
      'Meatpackers lobbied to remove origin transparency',
    ],
    meaningfulness: 'misleading',
    regulatoryStatus: 'usda_regulated',
    enforcementLevel: 'weak',
    shareRelevance: ['S', 'A'],
    qualityImpact: 'Cannot know actual origin, feeding practices, or environmental standards of source country.',
    fielderAccepts: false,
    fielderRequires: ['born_raised_harvested_usa', 'verified_farm_origin'],
    fielderNotes: 'This label is actively misleading for beef. We require verified US-born, US-raised, US-harvested.',
    consumerTakeaway: 'For beef, this label is nearly meaningless. The cattle may have never set foot in the US until slaughter.',
    betterAlternatives: ['born_raised_harvested_usa', 'farm_identified'],
  },
  {
    id: 'born_raised_harvested_usa',
    term: 'Born, Raised, and Harvested in USA',
    category: 'origin_labeling',
    legalDefinition: 'No federal standard, but voluntary claim that cattle spent entire life in USA.',
    practicalReality: 'When verified, this means true domestic beef. Some certifications and brands verify this.',
    meaningfulness: 'meaningful',
    regulatoryStatus: 'self_certified',
    enforcementLevel: 'weak',
    shareRelevance: ['S', 'A'],
    qualityImpact: 'Allows tracing and verification of practices. US environmental/welfare standards apply.',
    fielderAccepts: true,
    fielderRequires: ['farm_verification'],
    fielderNotes: 'This is what "Product of USA" should mean but doesn\'t. We verify directly with ranches.',
    consumerTakeaway: 'Look for this specific language, not just "Product of USA". Even better: know the actual farm.',
  },
  {
    id: 'wild_caught',
    term: 'Wild Caught',
    category: 'origin_labeling',
    legalDefinition: 'Fish caught in natural water bodies, not farm-raised.',
    practicalReality: 'Generally meaningful distinction from aquaculture. Quality varies by fishery management.',
    meaningfulness: 'meaningful',
    regulatoryStatus: 'usda_regulated',
    enforcementLevel: 'strong',
    shareRelevance: ['S', 'A', 'E'],
    qualityImpact: 'Wild fish often have better fatty acid profiles, no antibiotics, natural diet. Varies by species and source.',
    fielderAccepts: true,
    fielderRequires: ['sustainable_fishery', 'known_origin'],
    fielderNotes: 'Wild-caught is preferred for most species. We verify sustainability and origin.',
    consumerTakeaway: 'Generally better than farm-raised for most species. Look for MSC certification for sustainability.',
  },
]

// =============================================================================
// PRODUCTION METHOD TERMS
// =============================================================================

export const PRODUCTION_METHOD_DEFINITIONS: AgriculturalDefinition[] = [
  {
    id: 'ipm',
    term: 'Integrated Pest Management (IPM)',
    category: 'production_method',
    legalDefinition: 'USDA-recognized approach that uses biological, cultural, and chemical methods to manage pests with minimal environmental impact.',
    practicalReality: '70% of conventional farms in the US already use IPM. Farmers have strong economic incentive to minimize chemical inputs - pesticides are expensive. IPM includes crop rotation, beneficial insects, targeted spraying only when needed, and pest monitoring. This means most "conventional" produce is already grown with reduced pesticide use.',
    meaningfulness: 'meaningful',
    regulatoryStatus: 'usda_regulated',
    enforcementLevel: 'weak',
    shareRelevance: ['A'],
    qualityImpact: 'Reduces unnecessary pesticide use. Combined with Ames research (99.99% of dietary pesticides are natural anyway), IPM addresses the synthetic pesticide concern without organic certification overhead.',
    fielderAccepts: true,
    fielderNotes: 'IPM is our baseline expectation for produce. Most quality farms already practice it. We verify IPM practices directly with growers rather than relying on organic certification.',
    consumerTakeaway: 'Most farms already minimize pesticides through IPM - it saves them money. "Conventional" doesn\'t mean pesticide-heavy. Ask about IPM practices.',
  },
  {
    id: 'organic',
    term: 'USDA Organic',
    category: 'production_method',
    legalDefinition: 'USDA National Organic Program certification. No synthetic pesticides, no GMOs, no synthetic fertilizers, specific animal welfare requirements.',
    practicalReality: 'Organic is marketed as "more nutritious" and "fewer pesticides" but both claims are misleading. Studies showing organic is more nutritious refer to SECONDARY nutrition (polyphenols, antioxidants) - NOT PRIMARY nutrition (carbohydrates, minerals, vitamins). The pesticide argument ignores that 70% of conventional farms already use Integrated Pest Management (IPM) to reduce chemical inputs - farmers want to minimize costs. Combined with Ames research (99.99% of dietary pesticides are natural), the health differentiation is minimal.',
    loopholes: [
      'Organic junk food is still junk food',
      '"More nutritious" claims refer to secondary compounds, not primary nutrients',
      'Organic commodity cultivars still have dilution effect nutrient decline',
      '70% of conventional farms already use IPM to reduce pesticides',
      'Some approved organic pesticides exist (and can be toxic)',
      'Bruce Ames research: 99.99% of dietary pesticides are natural plant chemicals',
      'Natural pesticides equally likely to be carcinogenic as synthetic (Ames test)',
    ],
    meaningfulness: 'somewhat_meaningful',
    regulatoryStatus: 'usda_regulated',
    enforcementLevel: 'strong',
    shareRelevance: ['A'],
    qualityImpact: 'May have higher polyphenols/antioxidants (secondary). Does NOT guarantee higher Brix, minerals, vitamins (primary). A high-Brix IPM-grown heritage tomato beats a low-Brix organic commodity tomato.',
    fielderAccepts: true,
    fielderNotes: 'We support organic as part of our "all of the above" approach to US agriculture. We don\'t reject organic - we just don\'t prioritize it over what matters: Heritage cultivars (H), proper ripening (R), and measurable nutrition (E). Organic is one valid path, not THE path.',
    consumerTakeaway: 'Organic is fine, but not magic. 70% of conventional farms already minimize pesticides through IPM. Focus on Brix and heritage cultivars - that\'s where the real nutrition difference is.',
  },
  {
    id: 'nutrient_decline',
    term: 'Nutrient Decline / Dilution Effect',
    category: 'production_method',
    legalDefinition: 'No legal definition. Scientific phenomenon documented in agricultural research.',
    practicalReality: 'Produce nutrients have declined ~50% in the last 50-70 years. Cause: "dilution effect" from breeding for yield and appearance. Farmers get paid for pounds and looks, not nutrition. Modern commodity cultivars produce more volume with less nutrients per unit.',
    loopholes: [
      'No labeling required for nutrient density',
      'Consumers have no way to know Brix or mineral content',
      'USDA nutrition databases use averages that mask decline',
    ],
    meaningfulness: 'meaningful',
    regulatoryStatus: 'no_legal_definition',
    enforcementLevel: 'none',
    shareRelevance: ['H', 'E'],
    qualityImpact: 'This is the crisis. People are starving for nutrients while eating more calories. Modern produce looks good but is nutritionally hollow compared to 50 years ago.',
    fielderAccepts: false,
    fielderRequires: ['heritage_cultivars', 'brix_measurement', 'soil_health'],
    fielderNotes: 'This is WHY Fielder exists. The H in SHARE (Heritage cultivars) directly addresses dilution effect. We select for genetic potential + measure Brix to verify. Commodity cultivars bred for yield/appearance are the problem.',
    consumerTakeaway: 'Modern produce has ~50% less nutrients than your grandparents ate. The fix is heritage cultivars grown in healthy soil and picked at peak ripeness - not organic commodity produce.',
  },
  {
    id: 'primary_vs_secondary_nutrition',
    term: 'Primary vs Secondary Nutrition',
    category: 'production_method',
    legalDefinition: 'No legal definition. Nutritional science distinction.',
    practicalReality: 'PRIMARY nutrition: carbohydrates, minerals, vitamins. SECONDARY nutrition: polyphenols, antioxidants, flavonoids. The irony: many "secondary nutrients" organic touts ARE the natural pesticides plants produce to defend themselves - the same ones Bruce Ames showed are equally carcinogenic as synthetic.',
    meaningfulness: 'meaningful',
    regulatoryStatus: 'no_legal_definition',
    enforcementLevel: 'none',
    shareRelevance: ['E'],
    qualityImpact: 'Primary nutrition is what you need to live. Secondary nutrition provides health benefits but isn\'t the foundation. A high-Brix fruit has both.',
    fielderAccepts: true,
    fielderNotes: 'Brix primarily measures carbohydrates (sugars), but minerals and vitamins are generally positively correlated with carbohydrates in produce. High Brix = high carbs = high minerals/vitamins. This makes Brix a reliable proxy for overall nutrient density without expensive lab testing.',
    consumerTakeaway: 'When someone says organic is "more nutritious," ask: more of what? Usually they mean antioxidants - which are often natural plant pesticides. Brix measures what matters most.',
  },
  {
    id: 'usda_quality_standards',
    term: 'USDA Quality Standards (The Problem)',
    category: 'production_method',
    legalDefinition: 'USDA grades produce on appearance, size, color, and defect tolerance. No measurement of flavor or nutrition.',
    practicalReality: 'Farmers get paid for YIELD and APPEARANCE. This is why they grow commodity cultivars optimized for pounds and looks, not taste or nutrition. The economic incentive drives the dilution effect.',
    loopholes: [
      'No Brix measurement in grading',
      'No mineral content testing',
      'No vitamin density measurement',
      'A beautiful, nutrient-empty tomato grades higher than an ugly nutritious one',
    ],
    meaningfulness: 'misleading',
    regulatoryStatus: 'usda_regulated',
    enforcementLevel: 'strong',
    shareRelevance: ['H', 'E'],
    qualityImpact: 'This system CAUSED the nutrient decline. When farmers get paid for pounds and looks, they breed for pounds and looks. Nutrition is an externality.',
    fielderAccepts: false,
    fielderRequires: ['brix_measurement', 'flavor_quality', 'heritage_cultivars'],
    fielderNotes: 'We want to REVERSE how quality is measured. Pay farmers for FLAVOR and NUTRITION, not yield and appearance. Brix-based pricing would transform agriculture.',
    consumerTakeaway: 'USDA grades tell you nothing about nutrition or flavor. A "USDA Grade A" tomato can be nutritionally empty. We measure what matters: Brix.',
  },
  {
    id: 'fielder_quality_vision',
    term: 'Fielder\'s Quality Vision',
    category: 'production_method',
    legalDefinition: 'N/A - Fielder\'s internal standard and mission.',
    practicalReality: 'Flip the economic incentive. If farmers got paid for Brix instead of pounds, they would grow heritage cultivars in healthy soil and pick at peak ripeness. The whole system would shift.',
    meaningfulness: 'meaningful',
    regulatoryStatus: 'self_certified',
    enforcementLevel: 'strong',
    shareRelevance: ['S', 'H', 'A', 'R', 'E'],
    qualityImpact: 'Systemic change. SHARE framework applied across all farm-to-table products, with measurable quality metrics that reward nutrition and flavor.',
    fielderAccepts: true,
    fielderNotes: 'Current system: Yield + Appearance = Quality = Payment. Fielder vision: Flavor + Nutrition = Quality = Payment. SHARE is the framework. Brix is the proof. This is how we fix the food system.',
    consumerTakeaway: 'We\'re building a market where farmers get paid for what matters: nutrition and flavor. Your purchase supports this change.',
  },
  {
    id: 'fielder_all_of_the_above',
    term: 'Fielder\'s "All of the Above" Approach',
    category: 'production_method',
    legalDefinition: 'N/A - Fielder\'s sourcing philosophy.',
    practicalReality: 'We support US agriculture broadly. Organic, conventional with IPM, regenerative - all are valid paths when they deliver quality. We don\'t reject any approach; we evaluate based on SHARE outcomes, not certification labels.',
    meaningfulness: 'meaningful',
    regulatoryStatus: 'self_certified',
    enforcementLevel: 'strong',
    shareRelevance: ['S', 'H', 'A', 'R', 'E'],
    qualityImpact: 'Opens sourcing to the best farms regardless of certification status. Many excellent farms don\'t bother with organic certification because it\'s expensive and their IPM practices already minimize inputs.',
    fielderAccepts: true,
    fielderNotes: 'We\'re pro-US-agriculture, not pro-any-single-method. Organic is one valid path. IPM conventional is another. Regenerative is another. We judge by results: Is it heritage? Is it ripe? What\'s the Brix? What\'s the Omega ratio? Labels are shortcuts; SHARE is the standard.',
    consumerTakeaway: 'We source from the best US farms regardless of certification labels. What matters is the outcome - flavor and nutrition - not the method label on the package.',
  },
  {
    id: 'brix_as_proxy',
    term: 'Brix as Nutritional Proxy',
    category: 'production_method',
    legalDefinition: 'Brix measures dissolved solids (primarily sugars) in produce juice, expressed as degrees (°Bx).',
    practicalReality: 'Brix is an affordable, field-testable proxy for overall nutrient density. While it directly measures carbohydrates (sugars), minerals and vitamins are generally positively correlated with sugar content in produce. A high-Brix tomato isn\'t just sweeter - it\'s more mineral-dense and vitamin-rich.',
    meaningfulness: 'meaningful',
    regulatoryStatus: 'no_legal_definition',
    enforcementLevel: 'none',
    shareRelevance: ['E'],
    qualityImpact: 'Practical way to verify nutrition without expensive lab testing. High Brix correlates with: better flavor, higher minerals, higher vitamins, longer shelf life.',
    fielderAccepts: true,
    fielderNotes: 'Brix is our current standard because it\'s practical and correlated with full nutrition. Future vision: partner with companies like Edacious for comprehensive nutrient testing (full mineral/vitamin panels). Premium nutrition data may be behind a paywall for consumers who want the deep dive.',
    consumerTakeaway: 'Brix is like a credit score for produce - one number that reflects overall quality. Higher is better. We\'re working toward full nutrient transparency.',
  },
  {
    id: 'organic_meat',
    term: 'USDA Organic (Meat)',
    category: 'production_method',
    legalDefinition: 'Animals fed 100% organic feed (non-GMO, no synthetic pesticides). No antibiotics or hormones.',
    practicalReality: 'Organic feed doesn\'t fix the feedlot problem. Worse: the only way to CERTIFY organic meat is if the FEED is certified. If you\'re certifying feed, you\'re feeding substantial grain. Certified organic meat almost certainly = grain-fed = high Omega-6.',
    loopholes: [
      'Organic certification requires certified feed → implies grain-heavy diet',
      'Organic feedlot beef is still feedlot beef',
      'Organic grain-fed still has high Omega-6',
      'Doesn\'t require pasture access',
      'Organic-approved pesticides still used on feed crops',
      'True pasture operations don\'t bother certifying minimal grain supplement',
    ],
    meaningfulness: 'somewhat_meaningful',
    regulatoryStatus: 'usda_regulated',
    enforcementLevel: 'strong',
    shareRelevance: ['A'],
    qualityImpact: 'Certified organic meat almost guarantees high Omega-6. The certification process itself reveals grain-feeding. Pasture-raised farms with minimal grain don\'t bother certifying.',
    fielderAccepts: false,
    fielderRequires: ['pasture_raised', 'no_feedlot', 'verified_omega_ratio'],
    fielderNotes: 'Organic certification for meat is almost a red flag. It signals grain-fed operation. We focus on pasture-raised with verified Omega ratios, not organic labels.',
    consumerTakeaway: 'Counterintuitive: "Certified Organic" beef likely has WORSE nutrition than pasture-raised conventional. The certification signals grain feeding. Ask about Omega ratio instead.',
  },
  {
    id: 'gmo_feed_nuance',
    term: 'GMO Feed (The Nuance)',
    category: 'production_method',
    legalDefinition: 'Feed containing genetically modified crops (90% of US corn is GMO).',
    practicalReality: 'Key science: Glyphosate (Roundup) does NOT bioaccumulate in animals or humans. You\'re not eating the corn - you\'re eating the meat. The animal processes the feed.',
    meaningfulness: 'marketing',
    regulatoryStatus: 'no_legal_definition',
    enforcementLevel: 'none',
    shareRelevance: ['A'],
    qualityImpact: 'Minimal to none for meat. Glyphosate doesn\'t accumulate in animal tissue. The Omega ratio is determined by pasture vs feedlot, not GMO vs non-GMO feed.',
    fielderAccepts: true,
    fielderNotes: 'We are AGAINST GMO cultivars/breeds for PRODUCTS (what you eat directly). But GMO FEED for animals is different - glyphosate doesn\'t bioaccumulate, and you\'re eating the meat, not the corn. 90% of US corn is GMO anyway. Focus on what matters: pasture vs feedlot, maturity, Omega ratio.',
    consumerTakeaway: 'Distinction matters: GMO produce = you eat it directly (concern). GMO animal feed = animal processes it, glyphosate doesn\'t accumulate (not a concern). Focus on pasture-raised, not organic feed.',
  },
  {
    id: 'fielder_gmo_position',
    term: 'Fielder\'s GMO Position',
    category: 'production_method',
    legalDefinition: 'N/A - internal policy position.',
    practicalReality: 'We distinguish between the PRODUCT and the FEED. Different science, different concerns.',
    meaningfulness: 'meaningful',
    regulatoryStatus: 'self_certified',
    enforcementLevel: 'strong',
    shareRelevance: ['H', 'A'],
    qualityImpact: 'Heritage (non-GMO) cultivars/breeds have genetic potential for superior flavor and nutrition. Feed is a separate issue.',
    fielderAccepts: true,
    fielderNotes: 'PRODUCE: Non-GMO heritage cultivars (you eat the plant directly, pesticide/herbicide residue matters). MEAT: Heritage breeds (non-GMO genetics), but GMO feed is acceptable because glyphosate doesn\'t bioaccumulate. The animal is a filter. Pasture-raised with GMO grain supplement > Organic feedlot.',
    consumerTakeaway: 'We\'re non-GMO for what you eat directly (produce, the animal\'s genetics). For animal feed, the science shows it doesn\'t matter - focus on pasture-raised and Omega ratio instead.',
  },
  {
    id: 'natural',
    term: 'Natural',
    category: 'production_method',
    legalDefinition: 'For meat: no artificial ingredients, minimally processed. Does NOT mean organic, free-range, or anything about how animal was raised.',
    practicalReality: 'Nearly meaningless. A factory-farmed, antibiotic-laden chicken can be labeled "natural" because no artificial ingredients were added after slaughter.',
    loopholes: [
      'Says nothing about how animal was raised',
      'Antibiotics, hormones, feedlots all allowed',
      'Only applies to post-slaughter processing',
      'No verification required',
    ],
    meaningfulness: 'marketing',
    regulatoryStatus: 'usda_regulated',
    enforcementLevel: 'weak',
    shareRelevance: [],
    qualityImpact: 'None. This label provides no information about quality or practices.',
    fielderAccepts: false,
    fielderNotes: 'We ignore this term entirely. It means nothing.',
    consumerTakeaway: 'Ignore this label. It tells you nothing about how the animal was raised or fed.',
    betterAlternatives: ['pasture_raised', 'grass_finished', 'organic'],
  },
  {
    id: 'no_antibiotics',
    term: 'No Antibiotics / Raised Without Antibiotics',
    category: 'production_method',
    legalDefinition: 'Animal never received antibiotics. USDA requires documentation.',
    practicalReality: 'Meaningful claim when verified. Reduces antibiotic resistance concerns. May indicate better living conditions (healthy animals need fewer antibiotics).',
    meaningfulness: 'meaningful',
    regulatoryStatus: 'usda_regulated',
    enforcementLevel: 'strong',
    shareRelevance: ['A', 'E'],
    qualityImpact: 'Healthier animals, no antibiotic residues. Often correlates with better practices overall.',
    fielderAccepts: true,
    fielderNotes: 'Good indicator but we verify the full picture of animal husbandry.',
    consumerTakeaway: 'Meaningful claim. Animals raised without antibiotics are often raised in better conditions overall.',
  },
  {
    id: 'no_hormones',
    term: 'No Hormones Added',
    category: 'production_method',
    legalDefinition: 'No growth hormones administered. Note: hormones are already illegal for poultry/pork, so this claim is meaningless for chicken.',
    practicalReality: 'Meaningful for beef. For chicken/pork, it\'s marketing - hormones were never allowed anyway.',
    loopholes: [
      'Hormones already illegal for poultry - claim is redundant',
      'Pork hormones also prohibited',
      'Only meaningful for beef',
    ],
    meaningfulness: 'somewhat_meaningful',
    regulatoryStatus: 'usda_regulated',
    enforcementLevel: 'strong',
    shareRelevance: ['A'],
    qualityImpact: 'For beef: may indicate slower growth, more natural development. For chicken/pork: means nothing.',
    fielderAccepts: true,
    fielderNotes: 'Meaningful for beef only. We require it for beef but recognize it\'s redundant for poultry.',
    consumerTakeaway: 'For beef: good. For chicken: ignore it - hormones are already illegal in all chicken.',
  },
]

// =============================================================================
// ENVIRONMENTAL TERMS
// =============================================================================

export const ENVIRONMENTAL_DEFINITIONS: AgriculturalDefinition[] = [
  {
    id: 'regenerative',
    term: 'Regenerative',
    category: 'environmental',
    legalDefinition: 'No federal definition. Third-party certifications exist (ROC, Land to Market).',
    practicalReality: 'When verified, indicates farming practices that rebuild soil health, sequester carbon, and improve ecosystem health.',
    loopholes: [
      'No legal definition - anyone can claim it',
      'Must be certified to be meaningful',
    ],
    meaningfulness: 'meaningful',
    regulatoryStatus: 'third_party_certified',
    enforcementLevel: 'strong',
    shareRelevance: ['S', 'A', 'E'],
    qualityImpact: 'Healthy soil = more nutritious produce. Regenerative practices correlate with higher Brix, more minerals.',
    fielderAccepts: true,
    fielderRequires: ['certification_or_verified_practices'],
    fielderNotes: 'Regenerative is the future. We prioritize ROC and verified regenerative farms.',
    consumerTakeaway: 'Look for certification (ROC = Regenerative Organic Certified). Uncertified claims vary.',
  },
  {
    id: 'sustainable',
    term: 'Sustainable',
    category: 'environmental',
    legalDefinition: 'No legal definition. Completely unregulated claim.',
    practicalReality: 'Could mean anything or nothing. Without certification, it\'s pure marketing.',
    loopholes: [
      'No definition',
      'No verification',
      'Commonly greenwashed',
    ],
    meaningfulness: 'marketing',
    regulatoryStatus: 'no_legal_definition',
    enforcementLevel: 'none',
    shareRelevance: [],
    qualityImpact: 'Unknown without verification.',
    fielderAccepts: false,
    fielderRequires: ['specific_certification_or_practices'],
    fielderNotes: 'We don\'t accept vague sustainability claims. Show us the specific practices.',
    consumerTakeaway: 'Meaningless without certification. Ask what specific practices make it "sustainable".',
    betterAlternatives: ['regenerative_certified', 'organic'],
  },
  {
    id: 'msc_certified',
    term: 'MSC Certified (Marine Stewardship Council)',
    category: 'environmental',
    legalDefinition: 'Third-party certification for sustainable fishing. Fishery must meet criteria for stock health, ecosystem impact, and management.',
    practicalReality: 'Most rigorous sustainability certification for wild seafood. Regular audits and chain of custody.',
    meaningfulness: 'meaningful',
    regulatoryStatus: 'third_party_certified',
    enforcementLevel: 'strong',
    shareRelevance: ['S', 'A'],
    qualityImpact: 'Ensures fishery is well-managed. Stock health often correlates with quality.',
    fielderAccepts: true,
    fielderNotes: 'MSC is the gold standard for wild seafood sustainability.',
    consumerTakeaway: 'Blue MSC label means the fishery is independently certified sustainable. Trust this one.',
  },
]

// =============================================================================
// POST HARVEST (MINIMALLY PROCESSED) TERMS
// =============================================================================
//
// HISTORICAL CONTEXT: Fielder is about seasonal eating.
//
// Throughout human history, preservation wasn't a luxury - it was SURVIVAL.
// You preserved the summer harvest or you starved in winter.
//
// KEY INSIGHT: ALL food storage is harvest extension. It's a continuum:
//
//   FRESH → STORED → PRESERVED
//   (days)   (weeks/months)   (months/years)
//
//   - Fresh berries → eat within days
//   - Cold-stored apples/pears → modern root cellar (months)
//   - Flash-frozen salmon → modern ice house (months)
//   - Dry-aged beef → controlled cave environment (weeks)
//   - Cured country ham → traditional preservation (years)
//   - Canned preserves → traditional preservation (years)
//
// Modern cold storage, controlled atmosphere, and flash-freezing are the
// 21st century equivalent of root cellars, ice houses, and caves.
// They all serve the same purpose: EXTEND THE HARVEST.
//
// Traditional preservation techniques evolved over millennia:
//   - Curing and smoking meat (country ham, bacon, jerky)
//   - Fermenting (pickles, sauerkraut, cheese)
//   - Canning and jarring (jams, preserves, pickled vegetables)
//   - Drying (dried fruit, herbs, jerky)
//   - Pressing (olive oil, nut oils)
//   - Reducing (maple syrup, sorghum, honey)
//
// These techniques CAPTURE THE HARVEST and extend it. They preserve the flavor
// of peak-season ingredients so you can taste summer in January.
//
// Industrial "processing" is the opposite - it uses chemistry to create
// shelf-stable products from mediocre ingredients. HFCS, natural flavors,
// and preservatives don't extend a harvest - they replace it.
//
// CORE PRINCIPLE: You should TASTE THE HARVEST.
//
// Whether fresh, stored, or preserved - you should taste the harvest.
// A cold-stored Honeycrisp should taste like fall in Washington.
// A flash-frozen Copper River salmon should taste like the Alaskan run.
// A cured country ham should taste like heritage pork, salt, smoke, and time.
//
// Industrial ingredients are antithetical to farm-to-table because they
// MASK or REPLACE the flavor of the underlying ingredient.
//
// Farm-to-table = Harvest extension that preserves flavor
// Industrial = Chemical substitution that replaces flavor
//
// =============================================================================

export const POST_HARVEST_DEFINITIONS: AgriculturalDefinition[] = [
  {
    id: 'traditional_preservation',
    term: 'Traditional Preservation',
    category: 'production_method',
    legalDefinition: 'No legal definition. Time-tested techniques developed over millennia for food preservation.',
    practicalReality: 'Throughout history, preservation was survival - you captured the harvest or starved in winter. Traditional techniques (curing, smoking, fermenting, canning, drying, pressing, reducing) evolved to extend peak-season ingredients. They preserve flavor, not replace it.',
    meaningfulness: 'meaningful',
    regulatoryStatus: 'no_legal_definition',
    enforcementLevel: 'none',
    shareRelevance: ['R', 'E'],
    qualityImpact: 'Traditional preservation requires quality ingredients - the technique amplifies what\'s there. Industrial processing hides mediocre ingredients behind additives.',
    fielderAccepts: true,
    fielderNotes: 'We embrace traditional preservation: salt-cured country ham, wood-smoked bacon, stone-pressed olive oil, slow-reduced maple syrup, naturally fermented pickles. These techniques capture the harvest. Industrial shortcuts (liquid smoke, HFCS, preservatives) replace it.',
    consumerTakeaway: 'Traditional preservation = tasting summer in January. Industrial processing = tasting a chemistry lab year-round.',
  },
  {
    id: 'farm_to_table_post_harvest',
    term: 'Farm-to-Table (Post-Harvest Products)',
    category: 'production_method',
    legalDefinition: 'No legal definition for processed products. Fielder internal standard.',
    practicalReality: 'What makes a jam, honey, syrup, or oil "farm-to-table"? You should TASTE THE HARVEST. The freshness and flavor of the underlying ingredient should come through. The processing should preserve and concentrate that flavor, not mask or replace it.',
    meaningfulness: 'meaningful',
    regulatoryStatus: 'self_certified',
    enforcementLevel: 'strong',
    shareRelevance: ['H', 'R', 'E'],
    qualityImpact: 'Requires quality source ingredients. Can\'t fake freshness with additives.',
    fielderAccepts: true,
    fielderNotes: 'Industrial ingredients are antithetical to farm-to-table. If you need "natural strawberry flavor" in your jam, you\'re not tasting strawberries - you\'re tasting a lab\'s approximation. Our post-harvest products celebrate the source ingredient. The terroir should come through.',
    consumerTakeaway: 'True farm-to-table processed foods should taste like the farm. If you can\'t taste the harvest, it\'s not farm-to-table - it\'s industrial food with a marketing story.',
  },
  {
    id: 'clean_label_standard',
    term: 'Clean Label Standard',
    category: 'production_method',
    legalDefinition: 'No federal definition. Industry term for products free of artificial/industrial ingredients.',
    practicalReality: 'For minimally processed products (honey, syrups, oils, preserves, cured meats), ingredient quality matters as much as source quality. Industrial food science has created a long list of cheap additives that extend shelf life, enhance flavor artificially, and cut costs - at the expense of health.',
    loopholes: [
      '"Natural flavors" can contain 50+ chemical compounds',
      '"No artificial colors" doesn\'t mean no artificial ingredients',
      '"Made with real fruit" can mean 2% fruit',
    ],
    meaningfulness: 'meaningful',
    regulatoryStatus: 'no_legal_definition',
    enforcementLevel: 'none',
    shareRelevance: ['A', 'E'],
    qualityImpact: 'Industrial ingredients often mask poor quality source ingredients. Clean label = higher quality source needed.',
    fielderAccepts: true,
    fielderRequires: ['whole_foods_excluded_ingredients_compliance'],
    fielderNotes: 'Our benchmark is the Whole Foods Excluded Ingredients List. If Whole Foods won\'t sell it, neither will we.',
    consumerTakeaway: 'Read ingredients. If you can\'t pronounce it or it sounds like chemistry, question it.',
  },
  {
    id: 'excluded_ingredients',
    term: 'Fielder Excluded Ingredients',
    category: 'production_method',
    legalDefinition: 'N/A - Fielder internal standard based on Whole Foods Market excluded ingredients list.',
    practicalReality: 'We exclude industrial ingredients that have no place in quality food. These are cost-cutting and shelf-life measures, not quality measures.',
    loopholes: [
      'These ingredients are legal and ubiquitous in conventional food',
      'Many hide under innocent-sounding names',
    ],
    meaningfulness: 'meaningful',
    regulatoryStatus: 'self_certified',
    enforcementLevel: 'strong',
    shareRelevance: ['A', 'E'],
    qualityImpact: 'Forces use of quality source ingredients. Can\'t hide behind additives.',
    fielderAccepts: true,
    fielderNotes: 'EXCLUDED: High fructose corn syrup (HFCS), MSG/monosodium glutamate, artificial flavors, "natural flavors" (unless verified), artificial colors/dyes, hydrogenated/partially hydrogenated oils, artificial sweeteners (aspartame, sucralose, saccharin), artificial preservatives (BHA, BHT, TBHQ), carrageenan, sodium nitrite/nitrate (conventional), bleached flour.',
    consumerTakeaway: 'Our post-harvest products contain only ingredients you\'d recognize from your grandmother\'s kitchen. Real food, minimally processed.',
  },
  {
    id: 'natural_flavors_problem',
    term: '"Natural Flavors" (The Problem)',
    category: 'production_method',
    legalDefinition: 'FDA defines natural flavor as any flavor derived from plant or animal sources. Can contain 50-100 chemical compounds.',
    practicalReality: 'The second most common ingredient in processed food after water/salt. "Natural" just means the original molecule came from nature - it\'s then extracted, processed, and combined in labs. Functionally identical to artificial flavors in many cases.',
    loopholes: [
      'Can contain dozens of undisclosed compounds',
      'Processing methods not disclosed',
      'Often used to replace actual ingredients',
      '"Natural vanilla flavor" ≠ vanilla',
    ],
    meaningfulness: 'misleading',
    regulatoryStatus: 'fda_regulated',
    enforcementLevel: 'weak',
    shareRelevance: ['A'],
    qualityImpact: 'Used to make cheap products taste like quality products. Masks poor source ingredients.',
    fielderAccepts: false,
    fielderRequires: ['actual_ingredients_not_flavors'],
    fielderNotes: 'If a jam needs "natural strawberry flavor," it doesn\'t have enough strawberries. We require actual ingredients, not flavor chemistry.',
    consumerTakeaway: '"Natural flavors" is one of the biggest loopholes in food labeling. Real food doesn\'t need flavor additives.',
  },
]

// =============================================================================
// COMBINED EXPORT
// =============================================================================

export const ALL_AGRICULTURAL_DEFINITIONS: AgriculturalDefinition[] = [
  ...ANIMAL_WELFARE_DEFINITIONS,
  ...FEEDING_PRACTICE_DEFINITIONS,
  ...ORIGIN_LABELING_DEFINITIONS,
  ...PRODUCTION_METHOD_DEFINITIONS,
  ...ENVIRONMENTAL_DEFINITIONS,
  ...POST_HARVEST_DEFINITIONS,
]

export const DEFINITIONS_BY_ID: Record<string, AgriculturalDefinition> = Object.fromEntries(
  ALL_AGRICULTURAL_DEFINITIONS.map(d => [d.id, d])
)

export const DEFINITIONS_BY_CATEGORY: Record<DefinitionCategory, AgriculturalDefinition[]> =
  ALL_AGRICULTURAL_DEFINITIONS.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = []
    acc[d.category].push(d)
    return acc
  }, {} as Record<DefinitionCategory, AgriculturalDefinition[]>)

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all terms Fielder accepts
 */
export function getAcceptableTerms(): AgriculturalDefinition[] {
  return ALL_AGRICULTURAL_DEFINITIONS.filter(d => d.fielderAccepts)
}

/**
 * Get all misleading/marketing terms consumers should be wary of
 */
export function getMarketingTerms(): AgriculturalDefinition[] {
  return ALL_AGRICULTURAL_DEFINITIONS.filter(
    d => d.meaningfulness === 'marketing' || d.meaningfulness === 'misleading'
  )
}

/**
 * Get terms that relate to a specific SHARE principle
 */
export function getTermsBySharePrinciple(principle: 'S' | 'H' | 'A' | 'R' | 'E'): AgriculturalDefinition[] {
  return ALL_AGRICULTURAL_DEFINITIONS.filter(d => d.shareRelevance.includes(principle))
}
