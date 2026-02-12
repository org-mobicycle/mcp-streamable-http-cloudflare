# MCP Streamable HTTP Server - Cloudflare Workers

Remote MCP server for MobiCycle KV operations and email pipeline tools.
Deploys to Cloudflare Workers with Streamable HTTP transport.

## Setup

    cd /path/to/this/directory
    npm install

## Local dev

    npm run dev
    # Server at http://localhost:8787/mcp

## Deploy

    npm run deploy
    # Server at https://mcp-streamable-http-cloudflare.<subdomain>.workers.dev/mcp

## Tools

KV: kv_keys_list, kv_keys_count, kv_key_get, kv_key_put, kv_key_delete, kv_keys_bulk_get
Discovery: namespaces_list
Email: email_list_folders, email_folder_stats, email_store
Pipeline: pipeline_status

## Namespaces

Courts: court-of-appeal, chancery, admin-court, kings-bench, supreme, clerkenwell, central-london
Claimants: liu, hk-law, lessel, letting-agents, barristers
Government: gld, us-state-dept, estonia
Complaints: hmcts, ico, phso, bar-standards, parliament
System: bridge-accounts, email-bodies
