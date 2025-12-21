# LocalHarvest & CSAware Research Notes

## Discovery: CSAware Software Platform

**URL Pattern:** `[farmname].csaware.com/store/`

Example: https://freshgardens.csaware.com/store/

### What is CSAware?

CSAware is LocalHarvest's e-commerce software platform that powers online stores for farms. Key characteristics:

1. **Standardized platform** - All CSAware stores share common structure
2. **Consistent URL pattern** - `[farmname].csaware.com`
3. **Product/seasonal data** - Stores include harvest windows, availability
4. **LocalHarvest integration** - Direct connection to LocalHarvest directory

### Why This Matters for Fielder

**Systematic Data Collection Opportunity:**

| What We Can Extract | How It Helps |
|---------------------|--------------|
| Product listings | What farms grow/raise |
| Seasonal availability | Harvest timing validation |
| Farm locations | USDA zone mapping |
| Pricing | Quality tier inference |
| Product descriptions | Heritage/specialty cultivar detection |

**Potential Approaches:**

1. **Manual Phase** (Current)
   - Visit CSAware stores for target farms
   - Extract seasonal data manually
   - Validate against state calendars
   - Build proof of concept

2. **Semi-Automated Phase** (If valuable)
   - Build CSAware store parser
   - Systematically collect from known farms
   - Focus on high-priority states/products

3. **API Integration Phase** (Future)
   - Contact LocalHarvest/CSAware for API access
   - Official data partnership
   - Real-time availability updates

### CSAware Store Data Structure

**What we need to investigate:**

- [ ] Product listing page structure
- [ ] Seasonal availability format
- [ ] Farm profile data location
- [ ] API endpoints (if any public)
- [ ] Rate limiting / robots.txt policy
- [ ] Data freshness / update frequency

### Research Workflow

**Step 1: Manual Exploration (5-10 farms)**
- Visit CSAware stores for farms in target states (FL, CA, TX, OH)
- Document data structure and availability format
- Screenshot/capture examples
- Test data extraction manually

**Step 2: Pattern Analysis**
- Identify common HTML structure
- Map seasonal availability formats
- Document product categorization
- Create extraction templates

**Step 3: Validation Test**
- Extract data from 20-30 CSAware farms
- Validate against state harvest calendars
- Triangulate across farms for consensus
- Measure data quality and completeness

**Step 4: Scale Decision**
- If data quality is high → Build systematic scraper
- If data quality is mixed → Continue manual collection
- If data is inconsistent → Focus on direct LocalHarvest directory

### Ethical Considerations

**Respectful Scraping:**
- Always check robots.txt
- Rate limit requests (1-2 per second max)
- Identify our user agent
- Consider reaching out for partnership first

**Data Usage:**
- Farm data is for validation, not competition
- We're helping farms by proving their quality
- Attribution to LocalHarvest/CSAware as source
- Opportunity for eventual partnership

### LocalHarvest Partnership Opportunity

**Value Proposition to LocalHarvest:**

| What Fielder Provides | Benefit to LocalHarvest/Farms |
|----------------------|-------------------------------|
| Quality verification | Farmers get SHARE scores |
| Harvest timing validation | More accurate seasonal data |
| Marketplace integration | Additional sales channel |
| Data feedback loop | Improved directory accuracy |

**Potential Partnership Models:**
1. API access for verified Fielder users
2. Co-branded quality verification
3. Revenue share on marketplace transactions
4. Data exchange agreement

### Next Steps

1. **Immediate:** Explore 5-10 CSAware stores manually
   - Fresh Gardens (link provided)
   - Find 4-5 more across different states
   - Document data structure and seasonal format

2. **This Week:** Extract data from 20 Florida farms
   - Focus on tomatoes, strawberries, citrus
   - Validate against FL state calendar
   - Test triangulation across farms

3. **This Month:** Expand to CA, TX, OH, NY
   - 50+ farms total with seasonal data
   - Validate bottom-up approach
   - Measure data quality and completeness

4. **Quarter 1:** Partnership outreach
   - Present data validation proof of concept
   - Propose API integration
   - Explore co-marketing opportunities

### Example CSAware Farm Stores to Research

**Florida (Zone 9-10):**
- Fresh Gardens: https://freshgardens.csaware.com/store/
- [To be researched]

**California (Zone 9-10):**
- [To be researched]

**Ohio (Zone 6):**
- [To be researched]

**Texas (Zone 8-9):**
- [To be researched]

**New York (Zone 5-6):**
- [To be researched]

### Research Template

For each farm investigated:

```json
{
  "farmName": "Fresh Gardens",
  "csawareUrl": "https://freshgardens.csaware.com/store/",
  "localharvestUrl": "[if available]",
  "location": {
    "city": "",
    "county": "",
    "state": "",
    "usdaZone": ""
  },
  "productsFound": [
    {
      "productName": "",
      "category": "",
      "availability": "",
      "seasonalNotes": ""
    }
  ],
  "dataQuality": {
    "hasSeasonalData": true/false,
    "hasPricing": true/false,
    "hasDescriptions": true/false,
    "completeness": "high|medium|low"
  },
  "researchDate": "2025-12-20",
  "notes": ""
}
```

---

**Bottom Line:** CSAware is LocalHarvest's software platform, which means there's likely a consistent data structure we can leverage. Start with manual exploration to understand the format, then decide if systematic collection is worth building.
