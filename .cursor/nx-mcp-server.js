#!/usr/bin/env node

const readline = require("node:readline");
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const TOOLS = {
  "nx-affected": {
    description: "Get list of affected projects based on git changes",
    inputSchema: {
      properties: {
        base: {
          default: "develop",
          description: "Base branch to compare against",
          type: "string",
        },
        target: {
          description: "Target to check (build, test, lint, etc.)",
          enum: ["build", "test", "lint", "e2e"],
          type: "string",
        },
      },
      type: "object",
    },
    name: "nx-affected",
  },
  "nx-graph": {
    description: "Get project dependency graph information",
    inputSchema: {
      properties: {
        project: {
          description: "Specific project to get dependencies for (optional)",
          type: "string",
        },
      },
      type: "object",
    },
    name: "nx-graph",
  },
  "nx-list-projects": {
    description: "List all projects in the NX workspace",
    inputSchema: {
      properties: {},
      type: "object",
    },
    name: "nx-list-projects",
  },
  "nx-project-info": {
    description: "Get detailed information about a specific project",
    inputSchema: {
      properties: {
        project: {
          description: "Project name (e.g., web, core, db)",
          type: "string",
        },
      },
      required: ["project"],
      type: "object",
    },
    name: "nx-project-info",
  },
};

class NXMCPServer {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });
    this.workspaceRoot = process.cwd();
  }

  sendResponse(id, result) {
    console.log(JSON.stringify({ id, jsonrpc: "2.0", result }));
  }

  sendError(id, code, message) {
    console.log(
      JSON.stringify({ error: { code, message }, id, jsonrpc: "2.0" }),
    );
  }

  execNxCommand(command) {
    try {
      return execSync(command, {
        cwd: this.workspaceRoot,
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      }).trim();
    } catch (error) {
      throw new Error(`NX command failed: ${error.message}`);
    }
  }

  handleInitialize(id) {
    this.sendResponse(id, {
      capabilities: { tools: {} },
      protocolVersion: "2024-11-05",
      serverInfo: { name: "nx-workspace", version: "1.0.0" },
    });
  }

  handleToolsList(id) {
    this.sendResponse(id, { tools: Object.values(TOOLS) });
  }

  handleToolsCall(id, params) {
    try {
      let result;
      switch (params.name) {
        case "nx-affected":
          result = this.handleAffected(params.arguments);
          break;
        case "nx-graph":
          result = this.handleGraph(params.arguments);
          break;
        case "nx-list-projects":
          result = this.handleListProjects();
          break;
        case "nx-project-info":
          result = this.handleProjectInfo(params.arguments);
          break;
        default:
          throw new Error(`Unknown tool: ${params.name}`);
      }
      this.sendResponse(id, { content: [{ text: result, type: "text" }] });
    } catch (error) {
      this.sendError(id, -32603, error.message);
    }
  }

  handleAffected(args) {
    const target = args.target || "build";
    const base = args.base || "develop";
    try {
      const output = this.execNxCommand(
        `npx nx show projects --affected --base=${base}`,
      );
      const projects = output.split("\n").filter((p) => p.trim());
      return `Affected projects for target "${target}" (base: ${base}):\n\n${projects.map((p) => `- ${p}`).join("\n")}\n\nTotal: ${projects.length} projects affected`;
    } catch (error) {
      return `Error getting affected projects: ${error.message}`;
    }
  }

  handleGraph(args) {
    try {
      this.execNxCommand("npx nx graph --file=/tmp/nx-graph.json");
      if (args.project) {
        const graph = JSON.parse(
          fs.readFileSync("/tmp/nx-graph.json", "utf-8"),
        );
        const projectDeps = graph.dependencies?.[args.project] || [];
        return `Dependencies for ${args.project}:\n\n${projectDeps.map((d) => `- ${d.target}`).join("\n")}`;
      }
      return 'Project dependency graph generated. Use "project" parameter to see specific project dependencies.';
    } catch (error) {
      return `Error generating graph: ${error.message}`;
    }
  }

  handleListProjects() {
    try {
      const output = this.execNxCommand("npx nx show projects");
      const projects = output.split("\n").filter((p) => p.trim());
      const apps = projects.filter((p) => p.startsWith("web"));
      const libs = projects.filter((p) => !p.startsWith("web"));
      let result = `## NX Workspace Projects\n\n`;
      result += `### Applications (${apps.length})\n${apps.map((p) => `- ${p}`).join("\n")}\n\n`;
      result += `### Libraries (${libs.length})\n${libs.map((p) => `- ${p}`).join("\n")}\n\n`;
      result += `**Total**: ${projects.length} projects`;
      return result;
    } catch (error) {
      return `Error listing projects: ${error.message}`;
    }
  }

  handleProjectInfo(args) {
    const { project } = args;
    try {
      const projectJsonPaths = [
        path.join(this.workspaceRoot, "apps", project, "project.json"),
        path.join(this.workspaceRoot, "libs", project, "project.json"),
      ];
      let projectJson;
      for (const jsonPath of projectJsonPaths) {
        if (fs.existsSync(jsonPath)) {
          projectJson = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
          break;
        }
      }
      if (!projectJson) {
        return `Project "${project}" not found. Use nx-list-projects to see available projects.`;
      }
      let result = `## Project: ${project}\n\n`;
      result += `**Type**: ${projectJson.projectType || "unknown"}\n`;
      result += `**Root**: ${projectJson.root}\n`;
      result += `**Source Root**: ${projectJson.sourceRoot || "N/A"}\n\n`;
      if (projectJson.targets) {
        result += `### Available Targets\n`;
        for (const [targetName, target] of Object.entries(
          projectJson.targets,
        )) {
          result += `- **${targetName}**: ${target.executor || target.command || "N/A"}\n`;
        }
      }
      return result;
    } catch (error) {
      return `Error getting project info: ${error.message}`;
    }
  }

  handleRequest(line) {
    try {
      const { method, id, params } = JSON.parse(line);
      switch (method) {
        case "initialize":
          this.handleInitialize(id);
          break;
        case "tools/list":
          this.handleToolsList(id);
          break;
        case "tools/call":
          this.handleToolsCall(id, params);
          break;
        default:
          this.sendError(id, -32601, `Method not found: ${method}`);
      }
    } catch (error) {
      console.error("Error processing request:", error);
    }
  }

  start() {
    this.rl.on("line", (line) => this.handleRequest(line));
  }
}

new NXMCPServer().start();
