# PCF 05: Deliver Services

**APQC Process Classification Framework Category 5**

This repository contains tools and applications for delivering services at Indrio Fields.

## What Belongs Here

Service delivery operations:
- Service fulfillment processes
- Service quality management
- Customer service interactions
- Service level agreements (SLAs)
- Service performance tracking

## Current Projects

### Fielder

AI-powered farm-to-table intelligence platform applying the SHARE quality framework to predict and verify internal food quality (flavor, nutrition) across time and geography.

```
fielder/
├── src/              # TypeScript/Next.js application
├── legacy/           # Archived Python prototype
│   └── fielder-engine/
└── docs/             # Architecture and design docs
```

**Key features:**
- SHARE framework quality prediction (Soil, Heritage, Agricultural, Ripen, Enrich)
- GDD-based harvest window forecasting
- Polymorphic prediction engine (produce, livestock, dairy)
- 1,150+ tests with 32 completed features

## Workflows

Service delivery workflows should be stored in `n8n-workflows/` folder when created.

---

**Part of the Indrio GitHub Organization**

See all PCF repositories: https://github.com/orgs/indrio-dev/repositories
