#!/bin/bash
# Fix Claude Desktop MCP Configuration
# This script updates Claude Desktop to use the HTTP LinkedIn MCP server

set -e

CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

echo "🔧 Fixing Claude Desktop MCP Configuration"
echo ""

# Create config directory if it doesn't exist
if [ ! -d "$CONFIG_DIR" ]; then
    echo "📁 Creating config directory..."
    mkdir -p "$CONFIG_DIR"
fi

# Backup existing config if it exists
if [ -f "$CONFIG_FILE" ]; then
    echo "💾 Backing up existing config..."
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup-$(date +%Y%m%d-%H%M%S)"
    echo "   Backup saved to: $CONFIG_FILE.backup-$(date +%Y%m%d-%H%M%S)"
fi

# Create new config with HTTP LinkedIn server
echo "📝 Writing new configuration..."
cat > "$CONFIG_FILE" << 'EOF'
{
  "mcpServers": {
    "linkedin": {
      "type": "http",
      "url": "https://linkedin-mcp-http.mobicycle.workers.dev/mcp",
      "timeout": 30000
    }
  },
  "globalShortcut": "CommandOrControl+Shift+Space"
}
EOF

echo ""
echo "✅ Configuration updated successfully!"
echo ""
echo "📋 New config location: $CONFIG_FILE"
echo ""
echo "🔄 Next steps:"
echo "   1. Quit Claude Desktop completely (Cmd+Q)"
echo "   2. Restart Claude Desktop"
echo "   3. The LinkedIn MCP tools should now work!"
echo ""
echo "🧪 To test:"
echo "   - Open Claude Desktop"
echo "   - Try: 'Use the linkedin_status tool'"
echo "   - You should see your 3 LinkedIn accounts"
echo ""
echo "🌐 Your LinkedIn MCP Server:"
echo "   https://linkedin-mcp-http.mobicycle.workers.dev"
echo ""
