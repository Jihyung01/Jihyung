#!/bin/bash

# Quick verification script for the hardened AI Second Brain app
# This script checks the main components are working

echo "=== AI Second Brain - Foundation & Hardening Verification ==="
echo ""

# Check if required files exist
echo "✓ Checking file structure..."
files=(
    "app.py"
    "vite.config.ts"
    "src/lib/api.ts"
    "src/components/pages/CalendarPage.tsx"
    "public/favicon.ico"
    ".env.example"
    ".env.local.example"
    "requirements.txt"
    "package.json"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file exists"
    else
        echo "  ✗ $file missing"
    fi
done

echo ""
echo "✓ Checking API base configuration..."
grep -q 'export const API_BASE = '"'"'/api'"'"';' src/lib/api.ts && echo "  ✓ Frontend API_BASE is '/api'" || echo "  ✗ Frontend API_BASE misconfigured"

echo ""
echo "✓ Checking Vite proxy..."
grep -q "'/api'" vite.config.ts && echo "  ✓ Vite proxy configured" || echo "  ✗ Vite proxy missing"

echo ""
echo "✓ Checking FullCalendar version..."
grep -q '"@fullcalendar/core": "6.1.14"' package.json && echo "  ✓ FullCalendar v6.1.14 pinned" || echo "  ✗ FullCalendar version mismatch"

echo ""
echo "✓ Checking Flask Blueprint..."
grep -q 'url_prefix="/api"' app.py && echo "  ✓ Flask API blueprint configured" || echo "  ✗ Flask blueprint misconfigured"

echo ""
echo "✓ Checking OpenAI graceful degradation..."
grep -q 'USE_OPENAI' app.py && echo "  ✓ OpenAI fallback logic present" || echo "  ✗ OpenAI fallback missing"

echo ""
echo "✓ Checking test IDs..."
grep -q 'data-testid' src/components/Router.tsx && echo "  ✓ Navigation test IDs present" || echo "  ✗ Navigation test IDs missing"

echo ""
echo "=== Verification Complete ==="
echo ""
echo "To start the application:"
echo "1. Set environment variables in .env (copy from .env.example)"
echo "2. Set frontend variables in .env.local (copy from .env.local.example)" 
echo "3. Run: npm run dev"
echo "4. In Codespaces, set port 5177 to Public"
echo "5. Open the app in a new browser tab"
echo ""
echo "Expected endpoints:"
echo "- GET /api/health → 200"
echo "- OPTIONS /api/* → 204" 
echo "- No favicon 404"
echo "- FullCalendar renders without CSS errors"