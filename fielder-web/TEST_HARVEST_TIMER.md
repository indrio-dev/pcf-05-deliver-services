# Harvest Timer Tool - Test & Verification

## Created Files

1. `/home/alex/projects/indrio/fielder-web/src/lib/utils/harvest-timing.ts`
   - Utility functions to convert GDD phenology data to DOY ranges
   - Functions: `generateHarvestWindows()`, `getCurrentDayOfYear()`, `isDoyInRange()`, etc.

2. `/home/alex/projects/indrio/fielder-web/src/app/tools/harvest-timer/page.tsx`
   - Full-featured harvest timer dashboard
   - Categorizes crops into: At Peak, Peak Soon, Ending Soon, Upcoming

## Logic Flow

```
1. Load CROP_PHENOLOGY data (28 crops)
   ↓
2. Convert GDD requirements to estimated days using regional accumulation rates
   ↓
3. Calculate DOY for: bloom, harvest start, peak start, peak end, harvest end
   ↓
4. Compare current DOY against each crop's windows
   ↓
5. Categorize into 4 sections with color coding
```

## Categorization Rules

| Category | Condition | Color | Sort Order |
|----------|-----------|-------|------------|
| **AT PEAK** | `currentDoy` is between `peakStartDoy` and `peakEndDoy` | Green | Days remaining (ascending) |
| **PEAK SOON** | Peak starts within 30 days, not yet started | Yellow | Days until peak (ascending) |
| **ENDING SOON** | Peak ends within 14 days, currently in season | Red | Days remaining (ascending) |
| **UPCOMING** | Peak starts more than 30 days away | Blue | Months away (ascending) |

## Example Calculation (Navel Orange, Florida)

```
Bloom: March 15 = DOY 74
GDD to peak: 6100
Regional rate: 22 GDD/day
Days to peak: 6100 / 22 = 277 days

Peak Start DOY: 74 + 277 = 351 (December 17)
Peak Window: ~36 days (40% of harvest window)
Peak End DOY: 351 + 36 = 387 → wraps to DOY 22 (January 22)
```

## UI Features

### At Peak Section
- Progress bar showing position in peak window
- Percentage completion (e.g., "45% through peak window")
- Days remaining prominently displayed
- Hover effects with color transitions

### Peak Soon Section
- Countdown in days
- Yellow theme for "prepare to buy"

### Ending Soon Section
- Red alert theme
- "Last chance" messaging
- Days remaining until peak ends

### Upcoming Section
- Displays months instead of days
- Scrollable list
- Blue future-oriented theme

## Testing Checklist

To verify the tool works correctly:

1. **Install dependencies:**
   ```bash
   cd /home/alex/projects/indrio/fielder-web
   npm install
   ```

2. **Run dev server:**
   ```bash
   npm run dev
   ```

3. **Navigate to:**
   ```
   http://localhost:3000/tools/harvest-timer
   ```

4. **Verify:**
   - [ ] Today's date displays correctly
   - [ ] Current DOY shown (should be ~351 for December 17)
   - [ ] At least some crops appear in "At Peak" (Florida citrus season)
   - [ ] Progress bars animate smoothly
   - [ ] All 4 sections render
   - [ ] Crops sorted correctly within sections
   - [ ] Hover effects work
   - [ ] No TypeScript errors in console

5. **Edge case testing:**
   - Check year boundary wrap (crops blooming in Jan/Feb should calculate correctly)
   - Verify progress bar doesn't exceed 100%
   - Confirm days calculations handle DOY 365→1 wrap

## Expected Results for Today (December 17, DOY 351)

### At Peak NOW:
- Navel Orange (Florida) - Peak starts ~DOY 351
- Possibly Grapefruit (Florida) - In season Nov-May
- Possibly Satsuma (Florida) - October-November peak

### Peak Soon:
- Valencia (Florida) - Peaks in April-May

### Upcoming:
- Stone fruit (bloom March-May)
- Berries (spring/summer)

## Notes

- This tool uses SIMPLIFIED DOY estimation from GDD data
- For precise predictions, use the full GDD prediction engine in `/src/lib/prediction/`
- Actual harvest dates vary ±7-14 days based on weather
- The tool is designed for consumer understanding, not scientific precision
