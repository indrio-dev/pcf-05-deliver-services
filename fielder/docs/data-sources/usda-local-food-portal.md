# USDA Local Food Portal - Data Source

**URL:** https://www.usdalocalfoodportal.com/fe/datasharing/  
**API Key:** PpW0VAZRXq  
**Status:** Pending access (403 errors)

## What It Offers

5 directories of local food entities:
- **Agritourism** - Farms with agritourism activities
- **CSA** - Community Supported Agriculture operations
- **Farmers Markets** - Market locations and vendors
- **Food Hubs** - Aggregation/distribution facilities
- **On-farm Markets** - Farm stands, U-pick operations

## API Details

**Endpoints:**
- `https://www.usdalocalfoodportal.com/api/agritourism/?apikey=KEY&state=FL`
- `https://www.usdalocalfoodportal.com/api/csa/?apikey=KEY&state=FL`
- `https://www.usdalocalfoodportal.com/api/farmersmarket/?apikey=KEY&state=FL`
- `https://www.usdalocalfoodportal.com/api/foodhub/?apikey=KEY&state=FL`
- `https://www.usdalocalfoodportal.com/api/onfarmmarket/?apikey=KEY&state=FL`

**Query params:** state (required), zip, city, coordinates + radius

**Response:** JSON array with listing_name, location_state, location_city, media_website, etc.

## Integration Potential

**Expected yield:** 500-2,000 entities across all 50 states  
**Value:** Official USDA data, comprehensive coverage, fills gaps in AL, NC, NJ, SC  
**Effort:** 250 API calls (50 states × 5 directories), ~2 minutes  

**Current blocker:** API returning 403 Forbidden (may need USDA to activate key)

**Script ready:** `scripts/collect-usda-local-food.ts`

---
**Priority:** HIGH - official source, all-state coverage  
**Next step:** Investigate API access (contact USDA or check authentication requirements)
