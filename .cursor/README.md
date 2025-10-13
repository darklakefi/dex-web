# Cursor MCP Configuration

This directory contains custom Model Context Protocol (MCP) servers for the DEX Web project.

## Installed MCP Servers

### 1. **project-context** (Custom)

Provides project-specific prompts and documentation.

**Available Prompts:**

- `/architecture` - Project structure and architectural rules
- `/i18n` - Internationalization patterns with next-intl
- `/commands` - Development workflow commands
- `/state-management` - State management hierarchy (TanStack Query, Form, XState)
- `/coding-standards` - Code style and naming conventions
- `/common-patterns` - Common code patterns and examples
- `/solana` - Solana/Web3 specific implementations

**Usage:** Type `/` in Cursor chat to see and use these prompts.

### 2. **nx-workspace** (Custom)

Tools for working with the NX monorepo.

**Available Tools:**

- `nx-affected` - Get list of affected projects
- `nx-graph` - View project dependencies
- `nx-list-projects` - List all workspace projects
- `nx-project-info` - Get detailed info about a project

**Usage:** Agent can automatically use these tools, or ask: "What projects are affected by my changes?"

### 3. **postgres** (Official)

Query and manage PostgreSQL database.

**Usage:** Ask Agent to query the database, inspect schema, or check data.

### 4. **filesystem** (Official)

Advanced filesystem operations beyond the built-in capabilities.

**Usage:** Agent uses this for batch file operations and complex searches.

## Quick Setup

After modifying MCP configuration:

1. **Reload Cursor**: Cmd/Ctrl + Shift + P → "Reload Window"
2. **Check Status**: Settings → Features → Model Context
3. **Enable Servers**: Toggle on the servers you want to use

## Testing MCP Servers

Test servers manually:

```bash
# Test project-context
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | node .cursor/mcp-server.js

# Test nx-workspace
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | node .cursor/nx-mcp-server.js
```

## Adding More MCP Servers

### From Cursor's Directory

Browse and install: https://cursor.com/mcp

**Recommended for this project:**

- **GitHub** - Manage PRs and issues
- **Brave Search** - Search documentation
- **Slack** - Team notifications (if using)
- **Linear** - Project management (if using)

### Custom Servers

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "your-server": {
      "command": "node",
      "args": ["${workspaceFolder}/.cursor/your-server.js"]
    }
  }
}
```

## Environment Variables

MCP servers can access environment variables from your `.env` file:

- `${env:DATABASE_URL}` - PostgreSQL connection string
- `${env:API_KEY}` - API keys for external services
- `${workspaceFolder}` - Project root path
- `${userHome}` - User home directory

## Security Notes

- MCP servers run locally on your machine
- They can execute commands and access files
- Only install servers from trusted sources
- Review custom server code before using
- Use restricted API keys when possible

## Troubleshooting

### Server shows "No tools, prompts, or resources"

1. Check the server script exists and is executable
2. Test manually using the commands above
3. Check Cursor's Developer Tools (Help → Toggle Developer Tools) for errors
4. Verify the command path in mcp.json

### Server fails to start

1. Ensure Node.js is available on PATH
2. Check file permissions (`chmod +x`)
3. Verify environment variables are set
4. Check for syntax errors in the server script

### Changes not reflected

1. Reload Cursor window
2. Check the file was saved
3. Verify JSON syntax in mcp.json

## File Structure

```
.cursor/
├── mcp.json              # MCP server configuration
├── mcp-server.js         # Project context prompts server
├── nx-mcp-server.js      # NX workspace tools server
└── README.md             # This file
```

## Resources

- [Cursor MCP Documentation](https://docs.cursor.com/context/model-context-protocol-mcp)
- [MCP Specification](https://modelcontextprotocol.io/)
- [MCP Server Examples](https://github.com/modelcontextprotocol/servers)
