#!/bin/bash
# Check Claude Desktop Configuration Status

CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

echo "🔍 Claude Desktop Configuration Diagnostics"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file NOT found"
    echo "   Location: $CONFIG_FILE"
    echo ""
    echo "💡 This means Claude Desktop has no MCP servers configured"
    echo "   Run ./fix-claude-desktop-config.sh to set it up"
    exit 1
fi

echo "✅ Config file found"
echo "   Location: $CONFIG_FILE"
echo ""

# Show current config
echo "📄 Current Configuration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$CONFIG_FILE" | python3 -m json.tool 2>/dev/null || cat "$CONFIG_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for LinkedIn MCP server
if grep -q "linkedin" "$CONFIG_FILE"; then
    echo "✅ LinkedIn MCP server found in config"

    # Check if it's HTTP or stdio
    if grep -q "\"type\": \"http\"" "$CONFIG_FILE"; then
        echo "✅ Configured as HTTP server"
        if grep -q "linkedin-mcp-http.mobicycle.workers.dev" "$CONFIG_FILE"; then
            echo "✅ Pointing to your Cloudflare Workers deployment"
            echo ""
            echo "🎉 Configuration looks good!"
        else
            echo "⚠️  Pointing to a different HTTP endpoint"
        fi
    elif grep -q "\"type\": \"stdio\"" "$CONFIG_FILE"; then
        echo "⚠️  Configured as stdio (local) server"
        echo ""
        echo "💡 Recommendation: Switch to HTTP server for reliability"
        echo "   Run ./fix-claude-desktop-config.sh to update"
    fi
else
    echo "❌ No LinkedIn MCP server configured"
    echo ""
    echo "💡 Run ./fix-claude-desktop-config.sh to add it"
fi

echo ""
echo "🌐 Your HTTP Server:"
echo "   https://linkedin-mcp-http.mobicycle.workers.dev"
echo ""
echo "🧪 Test it:"
echo "   curl https://linkedin-mcp-http.mobicycle.workers.dev/health"
echo ""
