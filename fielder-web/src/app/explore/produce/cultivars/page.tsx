import { CULTIVAR_QUALITY_PROFILES, QUALITY_TIER_INFO, type QualityTier, type HeritageIntent } from '@/lib/constants/quality-tiers'

export default function CultivarExplorerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Cultivar Explorer</h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Explore the genetic potential of different cultivars. Each variety has a quality ceiling determined by breeding focus and heritage.
            Compare Brix ranges, flavor profiles, and nutritional highlights across artisan, premium, standard, and commodity tiers.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option>All Categories</option>
                <option>Citrus</option>
                <option>Stone Fruit</option>
                <option>Berries</option>
                <option>Apples</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quality Tier</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option>All Tiers</option>
                <option>Artisan</option>
                <option>Premium</option>
                <option>Standard</option>
                <option>Commodity</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Heritage Intent</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option>All Types</option>
                <option>True Heritage</option>
                <option>Heirloom Quality</option>
                <option>Modern Nutrient</option>
                <option>Modern Flavor</option>
                <option>Commercial</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Cultivar Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CULTIVAR_QUALITY_PROFILES.map((cultivar) => (
            <div key={cultivar.cultivarId} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{cultivar.cultivarName}</h3>
                  {cultivar.yearIntroduced && (
                    <span className="text-xs text-gray-500 ml-2">{cultivar.yearIntroduced}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Quality Tier Badge */}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getQualityTierColor(cultivar.qualityTier)}`}>
                    {QUALITY_TIER_INFO[cultivar.qualityTier].name}
                  </span>
                  {/* Heritage Intent Badge */}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHeritageIntentColor(cultivar.heritageIntent)}`}>
                    {formatHeritageIntent(cultivar.heritageIntent)}
                  </span>
                </div>
              </div>

              {/* Brix Data - PROMINENT */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {cultivar.researchAvgBrix?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600 font-medium mt-1">Base Brix</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {cultivar.researchBrixRange ? `${cultivar.researchBrixRange[0]}-${cultivar.researchBrixRange[1]}` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600 font-medium mt-1">Range</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {cultivar.researchPeakBrix?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600 font-medium mt-1">Peak</div>
                  </div>
                </div>
              </div>

              {/* Characteristics */}
              <div className="p-6 space-y-3">
                {/* Crop Type */}
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Crop Type</span>
                  <p className="text-sm text-gray-900 mt-1">{formatCropType(cultivar.cropType)}</p>
                </div>

                {/* Flavor Profile */}
                {cultivar.flavorProfile && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Flavor Profile</span>
                    <p className="text-sm text-gray-900 mt-1">{cultivar.flavorProfile}</p>
                  </div>
                )}

                {/* Nutrition Highlights */}
                {cultivar.nutritionHighlights && cultivar.nutritionHighlights.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nutrition Highlights</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cultivar.nutritionHighlights.map((nutrient, idx) => (
                        <span key={idx} className="inline-block px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                          {nutrient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Breeding Focus */}
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Breeding Focus</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {cultivar.breedingFocus.map((focus, idx) => (
                      <span key={idx} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">
                        {focus.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Best Use */}
                {cultivar.bestUse && cultivar.bestUse.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Best Use</span>
                    <p className="text-sm text-gray-900 mt-1 capitalize">{cultivar.bestUse.join(', ')}</p>
                  </div>
                )}

                {/* Timing */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    <span className="font-semibold">Timing:</span> {cultivar.timingClass}
                  </span>
                  {cultivar.daysToMaturity && (
                    <span className="text-xs text-gray-500">
                      {cultivar.daysToMaturity} days
                    </span>
                  )}
                </div>

                {/* Recommended Rootstocks (for tree crops) */}
                {cultivar.recommendedRootstocks && cultivar.recommendedRootstocks.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recommended Rootstocks</span>
                    <p className="text-xs text-gray-600 mt-1 capitalize">{cultivar.recommendedRootstocks.join(', ').replace(/_/g, ' ')}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Legend */}
      <div className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quality Tier Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.entries(QUALITY_TIER_INFO) as [QualityTier, typeof QUALITY_TIER_INFO[QualityTier]][]).map(([tier, info]) => (
              <div key={tier} className="border border-gray-200 rounded-lg p-4">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mb-2 ${getQualityTierColor(tier)}`}>
                  {info.name}
                </div>
                <p className="text-sm text-gray-600 mb-2">{info.description}</p>
                <div className="text-xs text-gray-500">
                  <strong>Typical Brix:</strong> {info.typicalBrixRange[0]}-{info.typicalBrixRange[1]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions for styling
function getQualityTierColor(tier: QualityTier): string {
  const colors = {
    artisan: 'bg-purple-100 text-purple-800 border border-purple-300',
    premium: 'bg-green-100 text-green-800 border border-green-300',
    standard: 'bg-blue-100 text-blue-800 border border-blue-300',
    commodity: 'bg-gray-100 text-gray-800 border border-gray-300',
  }
  return colors[tier]
}

function getHeritageIntentColor(intent: HeritageIntent): string {
  const colors = {
    true_heritage: 'bg-amber-100 text-amber-800 border border-amber-300',
    heirloom_quality: 'bg-orange-100 text-orange-800 border border-orange-300',
    heirloom_utility: 'bg-stone-100 text-stone-800 border border-stone-300',
    modern_nutrient: 'bg-teal-100 text-teal-800 border border-teal-300',
    modern_flavor: 'bg-indigo-100 text-indigo-800 border border-indigo-300',
    commercial: 'bg-slate-100 text-slate-800 border border-slate-300',
  }
  return colors[intent]
}

function formatHeritageIntent(intent: HeritageIntent): string {
  const labels = {
    true_heritage: 'True Heritage',
    heirloom_quality: 'Heirloom Quality',
    heirloom_utility: 'Heirloom Utility',
    modern_nutrient: 'Modern Nutrient',
    modern_flavor: 'Modern Flavor',
    commercial: 'Commercial',
  }
  return labels[intent]
}

function formatCropType(cropType: string): string {
  return cropType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
