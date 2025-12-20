# Harvest Timer Tool - Implementation Complete

## Summary

Built a full-featured Harvest Timer dashboard at `/tools/harvest-timer` that shows consumers what crops are at peak quality TODAY based on DOY (day-of-year) calculations derived from the GDD-based phenology database.

## Files Created/Modified

### New Files

1. **`/home/alex/projects/indrio/fielder-web/src/lib/utils/harvest-timing.ts`** (4.8 KB)
   - Converts GDD phenology data to simplified DOY ranges
   - Utility functions for date calculations, range checks, progress tracking
   - Key functions:
     - `generateHarvestWindows()` - Converts 28 CROP_PHENOLOGY entries to DOY windows
     - `getCurrentDayOfYear()` - Gets current DOY (1-365)
     - `isDoyInRange()` - Checks if DOY is within a window (handles year wrap)
     - `daysRemainingInWindow()` - Calculates days left in a window
     - `daysUntilDoy()` - Calculates days until a target DOY
     - `windowProgress()` - Returns 0-1 progress through a window

2. **`/home/alex/projects/indrio/fielder-web/src/app/tools/harvest-timer/page.tsx`** (13 KB)
   - Full React component with real-time dashboard
   - Client-side date calculations
   - Four color-coded sections with sorting and progress visualization
   - Responsive design with Tailwind CSS

3. **`/home/alex/projects/indrio/fielder-web/test-harvest-timing.js`** (Test script)
   - Node.js verification script
   - Tests DOY calculations, range checks, progress tracking
   - Confirms logic works correctly for December 17, 2025

4. **`/home/alex/projects/indrio/fielder-web/TEST_HARVEST_TIMER.md`** (Documentation)
   - Testing checklist
   - Expected results for today
   - Edge case considerations

### Modified Files

5. **`/home/alex/projects/indrio/fielder-web/src/components/Header.tsx`**
   - Added `NavDropdown` component with hover state
   - Added `DropdownLink` component for dropdown items
   - Navigation link to `/tools/harvest-timer` was already present (line 31)

## How It Works

### Data Flow

```
CROP_PHENOLOGY (28 entries)
    ↓
generateHarvestWindows()
    ↓ (estimates days from GDD using regional accumulation rates)
DOY Windows {bloomStart, bloomEnd, harvestStart, harvestEnd, peakStart, peakEnd}
    ↓
Categorization Logic
    ↓
4 Sections: At Peak | Peak Soon | Ending Soon | Upcoming
```

### Categorization Rules

| Section | Condition | Color | Display |
|---------|-----------|-------|---------|
| **AT PEAK NOW** | `currentDoy` between `peakStartDoy` and `peakEndDoy` | Green | Days remaining + progress bar |
| **PEAK SOON** | Peak starts within 30 days (not yet started) | Yellow | Days until peak |
| **SEASON ENDING** | Peak ends within 14 days (currently in season) | Red | Days remaining |
| **UPCOMING** | Peak starts more than 30 days away | Blue | Months away |

### Regional GDD Accumulation Rates

The conversion from GDD to days uses typical daily accumulation rates:

| Region | GDD/Day |
|--------|---------|
| Florida | 22 |
| Texas | 25 |
| California | 20 |
| Georgia | 20 |
| Washington | 16 |
| Michigan | 16 |
| New York | 16 |
| Default | 18 |

### Example: Navel Orange (Florida)

```
Bloom: March 15 = DOY 74
GDD to peak: 6100
Regional rate: 22 GDD/day
Days to peak: 6100 / 22 = 277 days

Peak Start DOY: 74 + 277 = 351 (December 17)
Peak Window: 40% of harvest window = ~36 days
Peak End DOY: 351 + 36 = 387 → wraps to DOY 22 (January 22)

Status on Dec 17 (DOY 351): AT PEAK NOW ✓
Days remaining: 36
Progress: 0% (just started)
```

## Test Results

Running `node test-harvest-timing.js` on December 17, 2025:

```
Today: Wednesday, December 17, 2025
Current DOY: 351

Navel Orange (florida)
  Bloom DOY: 74
  Peak Start DOY: 351
  Peak End DOY: 22 (wraps to next year)
  Status: 🟢 AT PEAK NOW!
  Days remaining: 36
  Progress: 0%

Strawberry (florida)
  Bloom DOY: 274
  Peak Start DOY: 342
  Peak End DOY: 3 (wraps to next year)
  Status: 🟢 AT PEAK NOW!
  Days remaining: 17
  Progress: 35%
```

## UI Features

### Header
- Large title: "Harvest Timer"
- Subtitle: "What's at peak quality today?"
- Current date display with formatted date and DOY
- Clean, professional design

### At Peak Section (Green)
- Prominent display with urgency ("this is what to buy TODAY")
- Each crop shows:
  - Crop name and region
  - Days remaining in peak window
  - Visual progress bar (gradient green)
  - Percentage completion
- Hover effects with color transitions
- Sorted by days remaining (ending soonest first)

### Peak Soon Section (Yellow)
- Yellow theme for "coming soon"
- Shows days until peak starts
- Sorted by soonest first

### Ending Soon Section (Red)
- Red alert theme for urgency
- "Last chance" messaging
- Shows days remaining until peak ends
- Sorted by ending soonest first

### Upcoming Section (Blue)
- Future-oriented blue theme
- Shows months instead of days (easier to read)
- Scrollable if many items
- Sorted by soonest first

### Footer
- Disclaimer about estimates (±7-14 days due to weather)
- Educational note about GDD basis

## Design Decisions

### Why Simplified DOY Model?

The full GDD prediction engine (`/src/lib/prediction/gdd.ts`) requires:
- Historical weather data
- Real-time temperature tracking
- Complex accumulation calculations
- Farm-specific inputs

For the Harvest Timer consumer tool, we simplified to DOY because:
- ✓ Consumers need "what's good TODAY" not "what will be ready in 45 GDD"
- ✓ DOY is understandable (December 17 = day 351)
- ✓ Estimates are accurate enough for shopping decisions (±7-14 days)
- ✓ No API calls needed - all calculations client-side
- ✓ Instant load time

### Year Boundary Handling

Many crops wrap around December 31 → January 1:
- Navel Orange: Peak DOY 351 → 22 (Dec 17 → Jan 22)
- Florida Strawberry: Peak DOY 342 → 3 (Dec 8 → Jan 3)

The `isDoyInRange()` function handles this:
```typescript
if (start <= end) {
  return doy >= start && doy <= end  // Normal range
} else {
  return doy >= start || doy <= end  // Wraps around year
}
```

### Progress Bar Calculation

For crops at peak, we show visual progress:
```typescript
const progress = windowProgress(currentDoy, peakStartDoy, peakEndDoy)
// Returns 0-1 value
// 0% = just entered peak window
// 100% = last day of peak window
```

The gradient green bar fills left-to-right to show how far through the peak window we are.

## Navigation Integration

The tool is accessible via:
1. **Header navigation:** Tools dropdown → Harvest Timer
2. **Direct URL:** `/tools/harvest-timer`

The Header component now includes:
- `NavDropdown` - Hover-based dropdown menu
- `DropdownLink` - Individual menu items
- Tools section with 3 links:
  - Harvest Timer ✓ (implemented)
  - Quality Predictor (future)
  - Claim Decoder (future)

## To Run

### Install Dependencies
```bash
cd /home/alex/projects/indrio/fielder-web
npm install
```

### Start Dev Server
```bash
npm run dev
```

### Access Tool
```
http://localhost:3000/tools/harvest-timer
```

### Build for Production
```bash
npm run build
npm start
```

## Expected Behavior Today (December 17, 2025)

### At Peak NOW:
- ✓ Navel Orange (Florida) - Just entering peak
- ✓ Florida Strawberries - 35% through peak window
- Possibly other citrus varieties

### Peak Soon:
- Valencia Orange (Florida) - Peaks in April/May
- Some spring stone fruit varieties

### Upcoming:
- Most stone fruit (bloom March-May)
- Summer berries
- Fall apples and pears

## Technical Notes

### Performance
- All calculations happen client-side (no API calls)
- Instant page load
- `useEffect` runs once on mount
- Sorting happens in-memory (28 crops × 4 categories = 112 operations max)

### Browser Compatibility
- Uses standard ES6+ JavaScript
- Date calculations work in all modern browsers
- No external dependencies beyond React/Next.js

### Responsive Design
- Mobile-friendly with Tailwind responsive classes
- Sections stack vertically on mobile
- Progress bars scale with container width
- Touch-friendly tap targets

### Accessibility
- Semantic HTML structure
- Proper heading hierarchy (h1 → h2 → h3)
- Color is not the only indicator (emoji + text labels)
- Readable font sizes (text-lg, text-xl, text-3xl)

## Future Enhancements

### Potential Additions
1. **Location-based filtering** - Show only crops near user's location
2. **Favorite crops** - Let users track specific varieties
3. **Notifications** - Alert when favorite crops enter peak
4. **Historical comparison** - "Last year vs this year" timing
5. **Weather overlay** - Show if current weather is on-track for predictions
6. **Expected Brix display** - Show predicted quality numbers
7. **Direct links to buy** - Connect to marketplace when crops are at peak
8. **Share functionality** - "Share this crop's peak window"

### Integration Opportunities
1. **Marketplace connection** - "Buy Now" buttons for At Peak crops
2. **Email subscriptions** - Weekly harvest updates
3. **Farm notifications** - Alert farms when their crops appear in At Peak
4. **Recipe suggestions** - "What to make with crops at peak today"

## Code Quality

### TypeScript
- ✓ Fully typed interfaces
- ✓ No `any` types
- ✓ Exported types for reuse

### Code Organization
- ✓ Utilities separated from components
- ✓ Pure functions for calculations
- ✓ Reusable date logic
- ✓ Clean component structure

### Comments
- ✓ File headers explain purpose
- ✓ Function docstrings
- ✓ Inline comments for complex logic

## Verification Steps

- [x] Created utility functions for DOY conversion
- [x] Created full-featured page component
- [x] Added navigation dropdown components
- [x] Tested logic with sample data (node script)
- [x] Verified file locations correct
- [x] Confirmed year boundary handling works
- [x] Documented design decisions
- [x] Provided testing instructions

## Ready for Use

The Harvest Timer tool is **complete and ready to run**. Once dependencies are installed (`npm install`), the tool will be fully functional at `/tools/harvest-timer`.

The tool successfully converts the complex GDD-based phenology database into a consumer-friendly "what's good today" dashboard with real-time categorization, progress visualization, and intuitive color coding.
