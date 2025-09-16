#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const protobuf = require("protobufjs");

const workspaceRoot = path.resolve(__dirname, "..");
const protoDir = path.join(workspaceRoot, "libs", "orpc", "src", "proto");
const apiProto = path.join(protoDir, "api.proto");

if (!fs.existsSync(apiProto)) {
  console.error("Could not find api.proto at", apiProto);
  process.exit(1);
}

const pbRoot = new protobuf.Root();
pbRoot.resolvePath = (origin, target) => {
  if (target.startsWith("google/")) return target; // Let well-known types resolve normally if installed
  if (path.isAbsolute(target)) return target;
  return path.join(protoDir, target);
};

pbRoot.loadSync(apiProto);
pbRoot.resolveAll();

const json = pbRoot.toJSON();
const outFile = path.join(protoDir, "api.reflection.json");
fs.writeFileSync(outFile, JSON.stringify(json));
console.log("Wrote", outFile);
