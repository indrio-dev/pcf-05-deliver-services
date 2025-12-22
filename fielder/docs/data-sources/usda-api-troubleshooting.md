# USDA Local Food Portal - API Access Troubleshooting

**Date:** 2025-12-22  
**Status:** 403 Forbidden on all endpoints

## Problem

All requests to USDA Local Food Portal API return 403 Forbidden:
- API endpoints: `/api/farmersmarket/`, `/api/agritourism/`, etc.
- CSV endpoint: `/csv/`
- Main website: `usdalocalfoodportal.com`
- WordPress JSON: `/mywp/wp-json/`

## Tests Performed

**Different API key formats:**
```bash
# Standard
curl "https://www.usdalocalfoodportal.com/api/farmersmarket/?apikey=PpW0VAZRXq&state=FL"
→ 403

# Header-based
curl -H "X-API-Key: PpW0VAZRXq" "https://www.usdalocalfoodportal.com/api/farmersmarket/?state=FL"  
→ 403

# Parameter order
curl "https://www.usdalocalfoodportal.com/api/farmersmarket/?state=FL&apikey=PpW0VAZRXq"
→ 403

# Different location formats
curl "https://www.usdalocalfoodportal.com/api/farmersmarket/?apikey=PpW0VAZRXq&zip=48260"
→ 403

curl "https://www.usdalocalfoodportal.com/api/agritourism/?apikey=PpW0VAZRXq&x=-84&y=42&radius=30"
→ 403
```

**All return:**
```html
<html>
<head><title>403 Forbidden</title></head>
<body>
<center><h1>403 Forbidden</h1></center>
</body>
</html>
```

## Likely Causes

### 1. IP-Based Blocking (Most Likely)
- Entire site returns 403 (not just API)
- Even homepage: `https://www.usdalocalfoodportal.com/` → 403
- Suggests: Geographic restriction, IP firewall, or WAF blocking

**Evidence:** Server header shows `awselb/2.0` (AWS Elastic Load Balancer with WAF)

### 2. API Key Not Activated
- Documentation says "contact the USDA to apply for an access key"
- Key `PpW0VAZRXq` may be:
  - Example key from documentation (not real)
  - Requires formal application/approval
  - Needs activation by USDA

### 3. Geographic/Network Restrictions
- May only be accessible from US IPs
- May block cloud/datacenter IPs
- May require .gov or .edu network

## Diagnostic Tests

**Check if site is accessible from different network:**
```bash
# From your local Windows browser (not WSL)
1. Navigate to: https://www.usdalocalfoodportal.com/
2. If homepage loads: IP blocking in WSL environment
3. If still 403: Site-wide restriction or DNS issue

# Test API from browser
https://www.usdalocalfoodportal.com/api/farmersmarket/?apikey=PpW0VAZRXq&state=FL
```

## Workaround Options

### Option A: CSV Download (If Available)
Documentation mentions CSV download with `|` separator.
- Check if CSV export is available through web UI
- May require login/authentication
- Could download manually and parse

### Option B: Web Scraping
- Browse directories through web interface
- Extract listing data from HTML
- More brittle but doesn't require API

### Option C: Contact USDA
Email/form to request:
1. API key activation (if PpW0VAZRXq is correct)
2. New API key (if PpW0VAZRXq is example)
3. CSV export access
4. IP whitelist addition

### Option D: Alternative Data Sources
Continue with:
- LocalHarvest (already integrated)
- State agriculture department lists
- Industry association directories

## Next Steps

1. **Test from Windows browser** (not WSL) to rule out IP blocking
2. **Check for CSV download** option in web UI
3. **Contact USDA** if API access is critical:
   - Look for contact form on data sharing page
   - May have email like localfood@usda.gov
4. **Defer to Iteration 3** if not immediately accessible

## Impact on Knowledge Graph

**If accessible:** +500-2,000 entities (high value)  
**If blocked:** Continue with other sources (LocalHarvest, extension services, state lists)

**Current workaround:** Focus on LocalHarvest (already working) and extension service data for Iteration 2.

---

**Tested:** 2025-12-22 from WSL environment  
**Result:** 403 Forbidden on all endpoints  
**Recommendation:** Test from different network or contact USDA for access
