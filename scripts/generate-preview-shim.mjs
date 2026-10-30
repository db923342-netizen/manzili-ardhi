import fs from "node:fs";
import path from "node:path";

const serverDir = path.resolve(process.cwd(), "dist/server");
fs.mkdirSync(serverDir, { recursive: true });

const content = `import server from "../../.output/server/index.mjs";

const env = {};
const ctx = { waitUntil() {}, passThroughOnException() {}, props: {} };

export default {
  fetch(request) {
    // srvx NodeRequest expects writable ip
    Object.defineProperty(request, "ip", { value: undefined, writable: true, configurable: true });
    return server.fetch(request, env, ctx);
  },
};
`;

const targetFile = path.join(serverDir, "server.js");
fs.writeFileSync(targetFile, content, "utf-8");
console.log(`[build-shim] Successfully created ${targetFile}`);
