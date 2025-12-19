#!/bin/bash
# Fielder Environment Validation Script
# Run at the start of each session to verify environment is ready

set -e

echo "=== Fielder Environment Validation ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ERRORS=$((ERRORS + 1))
}

check_warn() {
    echo -e "${YELLOW}!${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# 1. Check Node.js version
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        check_pass "Node.js $NODE_VERSION"
    else
        check_fail "Node.js $NODE_VERSION (requires >= 18)"
    fi
else
    check_fail "Node.js not found"
fi

# 2. Check npm packages installed
echo ""
echo "Checking dependencies..."
if [ -d "node_modules" ]; then
    check_pass "node_modules exists"
else
    check_fail "node_modules not found - run 'npm install'"
fi

# 3. Check key dependencies
if [ -f "node_modules/next/package.json" ]; then
    NEXT_VERSION=$(grep '"version"' node_modules/next/package.json | head -1 | cut -d'"' -f4)
    check_pass "Next.js $NEXT_VERSION"
else
    check_fail "Next.js not installed"
fi

if [ -f "node_modules/@supabase/supabase-js/package.json" ]; then
    check_pass "@supabase/supabase-js installed"
else
    check_fail "@supabase/supabase-js not installed"
fi

# 4. Check environment variables
echo ""
echo "Checking environment..."
if [ -f ".env.local" ]; then
    check_pass ".env.local exists"

    if grep -q "NEXT_PUBLIC_SUPABASE_URL=" .env.local 2>/dev/null; then
        check_pass "NEXT_PUBLIC_SUPABASE_URL configured"
    else
        check_warn "NEXT_PUBLIC_SUPABASE_URL not set in .env.local"
    fi

    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local 2>/dev/null; then
        check_pass "NEXT_PUBLIC_SUPABASE_ANON_KEY configured"
    else
        check_warn "NEXT_PUBLIC_SUPABASE_ANON_KEY not set in .env.local"
    fi
else
    check_warn ".env.local not found (required for Supabase connection)"
fi

# 5. Check harness files
echo ""
echo "Checking harness files..."
if [ -f "feature_list.json" ]; then
    TOTAL_FEATURES=$(grep -c '"id"' feature_list.json 2>/dev/null || echo "0")
    PASSING=$(grep -c '"passes": true' feature_list.json 2>/dev/null || echo "0")
    check_pass "feature_list.json exists ($PASSING/$TOTAL_FEATURES features passing)"
else
    check_fail "feature_list.json not found"
fi

if [ -f "claude-progress.txt" ]; then
    check_pass "claude-progress.txt exists"
else
    check_warn "claude-progress.txt not found"
fi

# 6. Type check (using tsc directly for faster feedback)
echo ""
echo "Running type check..."
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    check_fail "TypeScript has compilation errors"
else
    check_pass "TypeScript compiles correctly"
fi

# 7. Run test suite
echo ""
echo "Running test suite..."
if [ -f "jest.config.js" ] || [ -f "jest.config.ts" ]; then
    check_pass "Jest configured"

    # Run tests and capture output
    TEST_OUTPUT=$(npm test -- --passWithNoTests 2>&1)
    TEST_EXIT_CODE=$?

    # Extract test counts
    if echo "$TEST_OUTPUT" | grep -q "Tests:"; then
        TEST_SUMMARY=$(echo "$TEST_OUTPUT" | grep "Tests:" | tail -1)
        PASSED_COUNT=$(echo "$TEST_SUMMARY" | grep -oP '\d+(?= passed)' || echo "0")
        TOTAL_SUITES=$(echo "$TEST_OUTPUT" | grep "Test Suites:" | grep -oP '\d+(?= passed)' || echo "0")
        check_pass "$PASSED_COUNT tests passing across $TOTAL_SUITES suites"
    fi

    if [ $TEST_EXIT_CODE -ne 0 ]; then
        check_fail "Some tests failed"
        echo "$TEST_OUTPUT" | tail -20
    fi
else
    check_warn "Jest not configured"
fi

# Summary
echo ""
echo "=== Summary ==="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}$WARNINGS warning(s), no errors${NC}"
else
    echo -e "${RED}$ERRORS error(s), $WARNINGS warning(s)${NC}"
    echo "Fix errors before starting development"
    exit 1
fi

echo ""
echo "=== Feature Status ==="
if [ -f "feature_list.json" ]; then
    echo "Completed features:"
    grep -B2 '"passes": true' feature_list.json | grep '"name"' | sed 's/.*"name": "\([^"]*\)".*/  - \1/' || echo "  (none)"
    echo ""
    echo "Next incomplete feature:"
    grep -B3 '"passes": false' feature_list.json | grep '"id"\|"name"' | head -4 | sed 's/.*: "\([^"]*\)".*/  \1/' | tr '\n' ' ' && echo ""
fi

echo ""
echo "Ready for development!"
