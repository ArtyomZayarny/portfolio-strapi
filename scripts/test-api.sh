#!/bin/bash
# Test script for Strapi API endpoints
# Usage: ./scripts/test-api.sh <BASE_URL>
# Example: ./scripts/test-api.sh https://portfolio-strapi.onrender.com

BASE_URL="${1:-http://localhost:1337}"

echo "🔍 Testing Strapi API at: $BASE_URL"
echo ""

# 1. Root endpoint (basic connectivity)
echo "1️⃣  GET / (root)"
curl -s -o /dev/null -w "   Status: %{http_code}\n" "$BASE_URL/"
echo ""

# 2. Admin panel (Strapi is running)
echo "2️⃣  GET /admin"
curl -s -o /dev/null -w "   Status: %{http_code}\n" "$BASE_URL/admin"
echo ""

# 3. Projects API (main endpoint for portfolio)
echo "3️⃣  GET /api/projects"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/projects")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
echo "   Status: $HTTP_CODE"
echo "   Response: $(echo "$BODY" | head -c 200)..."
echo ""

# Summary
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ API is working! Projects endpoint returned 200."
else
  echo "⚠️  Projects returned $HTTP_CODE. Check Strapi Admin → Settings → Users & Permissions → Public → enable 'find' for Project."
fi
