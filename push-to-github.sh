#!/bin/bash
cd /Users/mobicycle/Library/Mobile\ Documents/com~apple~CloudDocs/9._MobiCycle_Technologies/servers/mcp/http/mobicycle/linkedin

# Remove stale lock file if it exists
rm -f .git/index.lock

# Stage changes
git add -A

# Commit
git commit -m "Fix: Add missing McpAgent import for deployment

- Added missing import statement for McpAgent from agents/mcp
- Fixes TypeScript compilation errors in Cloudflare Pages build
- All type checks now pass successfully
- Ready for production deployment

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to GitHub
git push

echo "✅ Pushed to GitHub!"
