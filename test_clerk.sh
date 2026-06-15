#!/bin/bash
SK="sk_tes...k9l8"
echo "Testing Clerk API key..."
curl -s -X GET "https://api.clerk.com/v1/users?limit=1" \
  -H "Authorization: Bearer ***
echo ""
echo "---"
echo "Creating webhook..."
curl -s -X POST "https://api.clerk.com/v1/webhooks/svix" \
  -H "Authorization: Bearer *** \
  -H "Content-Type: application/json" \
  -d '{}'
echo ""
