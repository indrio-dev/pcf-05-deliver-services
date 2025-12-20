# Fielder

AI-powered farm-to-table intelligence platform applying the SHARE quality framework to predict and verify internal food quality (flavor, nutrition) across time and geography.

## Quick Start

```bash
# Validate environment and run tests
./init.sh

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development

### Environment Validation

Run `./init.sh` at the start of each session to:
- Check Node.js version (18+)
- Verify dependencies installed
- Validate TypeScript compilation
- Run test suite
- Show feature completion status

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production server |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:ci` | Run tests in CI mode |
| `npm run lint` | Run ESLint |

### Test Suite

The project includes comprehensive tests (1,150+ tests across 17 suites):

- **Unit tests** for prediction engine, rules engine, validation engine
- **Integration tests** for API routes and orchestrator
- **Feature tests** for SHARE framework components

Run tests:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

## CI/CD

### GitHub Actions

The project uses GitHub Actions for continuous integration:

- **Triggers**: Push to `main`/`master`, all pull requests
- **Node versions**: 18.x and 20.x (matrix build)
- **Steps**:
  1. Lint codebase
  2. TypeScript compilation check
  3. Run test suite with coverage
  4. Build production bundle

### Branch Protection

Recommended settings for `main` branch:
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Required checks: `Test & Build (18.x)`, `Test & Build (20.x)`

## Project Structure

```
fielder/
├── src/
│   ├── app/                 # Next.js App Router pages and API routes
│   │   ├── api/            # API endpoints
│   │   └── ...             # Page routes
│   ├── lib/
│   │   ├── analytics/      # Accuracy reporting
│   │   ├── constants/      # Static data (rootstocks, phenology, etc.)
│   │   ├── data/           # Reference data service
│   │   ├── intelligence/   # Core prediction engine
│   │   │   ├── rules-engine.ts       # SHARE rules
│   │   │   ├── claim-inference.ts    # PLU/claim inference
│   │   │   ├── validation-engine.ts  # Data validation
│   │   │   ├── calibration-engine.ts # Farm calibration
│   │   │   ├── exception-handler.ts  # Exception queue
│   │   │   ├── brix-ml-service.ts    # ML service (MVP)
│   │   │   └── orchestrator.ts       # Main orchestrator
│   │   ├── prediction/     # GDD and quality prediction
│   │   └── utils/          # Shared utilities
│   └── __tests__/          # Test files
├── legacy/
│   └── fielder-engine/     # Archived Python Flask prototype
│       └── src/            # Original Python package
└── docs/                   # Architecture and design documentation
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These are optional for local development (features gracefully degrade).

## Architecture

### SHARE Framework

| Pillar | Description |
|--------|-------------|
| **S**oil | Foundation - mineralized soil science |
| **H**eritage | Genetic ceiling - cultivar/rootstock |
| **A**gricultural | Growing practices - fertility, pest management |
| **R**ipen | Timing - harvest window optimization |
| **E**nrich | Proof - measured nutrition outcomes |

### Prediction Layers

1. **Deterministic**: Rules engine for known cultivar/rootstock combinations
2. **Probabilistic**: ML models for enhanced predictions (stub)
3. **Exception**: Human review for low-confidence cases

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4
- **Testing**: Jest + Testing Library
- **CI/CD**: GitHub Actions
