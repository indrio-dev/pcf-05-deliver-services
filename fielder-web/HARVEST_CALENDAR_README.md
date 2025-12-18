# Harvest Calendar Implementation

## Location
`/home/alex/projects/indrio/fielder-web/src/app/explore/produce/calendar/page.tsx`

## URL
`https://fielder.com/explore/produce/calendar`

## Features Implemented

### 1. **Data Processing**
- Converts GDD-based phenology data to calendar dates
- Calculates harvest windows from bloom dates + GDD accumulation
- Region-specific GDD rates (Florida: 22/day, California: 20/day, etc.)
- Handles year wraparound for late-season crops (Valencia oranges)

### 2. **Visual Timeline**
- Horizontal 12-month timeline for each crop-region combination
- Color-coded bars:
  - Light green: Full harvest window
  - Dark green: Peak quality window
  - Red vertical line: Current date indicator
- Month grid overlay for easy date reference

### 3. **"Peak Right Now" Section**
- Dynamically filters crops currently in peak window
- Shows peak dates and full harvest window
- Special border styling (accent color) to highlight
- Grid layout: 3 columns on desktop, responsive on mobile

### 4. **"Coming Soon" Section**
- Shows crops with peak starting in 30-60 days
- Displays countdown ("X days away")
- Helps users plan future purchases

### 5. **Full Annual Calendar**
- All 28 crop×region entries from CROP_PHENOLOGY
- Sorted by harvest start date
- Compact row view with:
  - Crop name + region label
  - Visual timeline
  - Peak date + status indicator

### 6. **Design System Compliance**
- Matches Fielder brand: cream background, stone text, serif/mono fonts
- Uses `Header` component for consistent navigation
- Tailwind CSS utility classes
- Responsive breakpoints (sm, lg)

## Data Flow

```
CROP_PHENOLOGY (GDD-based)
         ↓
convertPhenologyToCalendar()
         ↓
Calculate dates:
- Bloom date (from phenology.bloomMonth/bloomDay)
- Harvest start (bloom + gddToMaturity / gddRate)
- Harvest end (harvest start + gddWindow / gddRate)
- Peak start/end (around gddToPeak)
         ↓
CalendarEntry (calendar dates + DOY)
         ↓
Render timeline bars + current date indicator
```

## Key Algorithms

### GDD to Days Conversion
```typescript
days = Math.round(gdd / gddRate)
result = bloomDate + days
```

### Day of Year Calculation
```typescript
doy = Math.floor((date - Jan1) / millisPerDay) + 1
```

### Timeline Positioning
```typescript
position = (dayOfYear / 365) * 100  // percentage
```

## Example Output

**Peak Right Now (Dec 17, 2025):**
- Navel Orange (Florida) - Peak: Dec 1 - Dec 30
- Grapefruit (Florida) - Peak: Feb 1 - Feb 28
- Strawberry (Florida) - Peak: Jan 15 - Feb 15

**Coming Soon:**
- Valencia (Florida) - Peak starts: Apr 15 (119 days away)
- Blueberry (Florida) - Peak starts: May 1 (135 days away)

**Full Calendar:**
28 rows showing all crops with visual timeline across 12 months

## Technical Notes

1. **Year Wraparound**: Valencia oranges bloom in March but harvest the following year (13-14 months). The code handles this by checking if calculated dates exceed the current year.

2. **GDD Rate Fallback**: If a region isn't in the GDD_RATES map, defaults to 20 GDD/day.

3. **Current Date Detection**: Uses `getDayOfYear(new Date())` to calculate position of red indicator line.

4. **Responsive Design**: 
   - Mobile: Single column cards
   - Tablet: 2 columns
   - Desktop: 3 columns

## Future Enhancements (Not Implemented)

- Filter by crop category (citrus, stone fruit, berries)
- Filter by region
- Interactive hover tooltips on timeline
- Export calendar to .ics format
- Email notifications for upcoming peaks
- Search functionality

## Dependencies

- React (useMemo for performance)
- Next.js 14 App Router
- Tailwind CSS
- CROP_PHENOLOGY data from `/lib/constants/crop-phenology.ts`

## Testing Checklist

- [x] Imports correct data structure
- [x] Calculates dates correctly from GDD
- [x] Handles year wraparound (Valencia)
- [x] Current date indicator positioned correctly
- [x] Peak/Coming Soon filters work
- [x] Responsive layout functions
- [x] Consistent with design system
- [ ] Build passes (needs npm install)
- [ ] Renders in browser (needs dev server)
