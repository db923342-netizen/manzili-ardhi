import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const distDir = path.resolve(cwd, "dist");
const serverDir = path.join(distDir, "server");
fs.mkdirSync(serverDir, { recursive: true });

// 1. Prerender the home page to dist/index.html so that static servers and fallbacks never serve an empty page
try {
  const ssrPath = path.resolve(cwd, ".output/server/_ssr/ssr.mjs");
  if (fs.existsSync(ssrPath)) {
    const ssrMod = await import(`file://${ssrPath}`);
    const ssr = ssrMod.default || ssrMod;
    const req = new Request("http://localhost:3000/");
    const env = {};
    const ctx = { waitUntil() {}, passThroughOnException() {}, props: {} };
    const res = await ssr.fetch(req, env, ctx);
    if (res && res.status === 200) {
      const html = await res.text();
      if (html && html.includes("<div") && html.includes("<script")) {
        const targetHtml = path.join(distDir, "index.html");
        fs.writeFileSync(targetHtml, html, "utf-8");
        console.log(`[build-shim] Successfully prerendered ${targetHtml} (${html.length} bytes)`);
      }
    }
  }
} catch (prerenderErr) {
  console.warn("[build-shim] Prerender warning (continuing):", prerenderErr.message);
}

// 2. Generate dist/server/server.js that handles both static files and SSR dynamic routing
const serverJsContent = `import fs from "node:fs";
import path from "node:path";
import ssrHandler from "../../.output/server/_ssr/ssr.mjs";

const distDir = path.resolve(process.cwd(), "dist");
const publicDir = path.resolve(process.cwd(), ".output/public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

function tryServeStatic(urlPath) {
  const rawPath = urlPath.split("?")[0];
  const cleanPath = path.normalize(decodeURIComponent(rawPath));
  if (!cleanPath || cleanPath === "/" || cleanPath === "." || cleanPath.startsWith("..") || cleanPath.endsWith("/")) {
    return null;
  }
  const candidate1 = path.join(distDir, cleanPath);
  const candidate2 = path.join(publicDir, cleanPath);
  const filePath =
    fs.existsSync(candidate1) && fs.statSync(candidate1).isFile()
      ? candidate1
      : fs.existsSync(candidate2) && fs.statSync(candidate2).isFile()
      ? candidate2
      : null;

  if (filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || "application/octet-stream";
    const content = fs.readFileSync(filePath);
    return new Response(content, {
      status: 200,
      headers: {
        "content-type": mime,
        "content-length": String(content.byteLength),
        "cache-control": cleanPath.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "public, max-age=3600",
      },
    });
  }
  return null;
}

export default {
  async fetch(request) {
    try {
      // srvx NodeRequest expects writable ip
      Object.defineProperty(request, "ip", { value: undefined, writable: true, configurable: true });

      const url = new URL(request.url, "http://localhost:3000");

      // 1. Static asset serving (e.g. /manifest.json, /assets/*.js, images)
      const staticResponse = tryServeStatic(url.pathname);
      if (staticResponse) {
        return staticResponse;
      }

      // 2. Delegate HTML / API / SSR requests to TanStack Start SSR
      const env = {};
      const ctx = { waitUntil() {}, passThroughOnException() {}, props: {} };
      const handler = ssrHandler.default || ssrHandler;
      const ssrResponse = await handler.fetch(request, env, ctx);

      // If SSR response is valid and non-error, return it
      if (ssrResponse && ssrResponse.status < 500) {
        return ssrResponse;
      }

      // 3. Fallback to prerendered index.html for navigation if SSR returned an error
      const indexPath = path.join(distDir, "index.html");
      if (fs.existsSync(indexPath)) {
        return new Response(fs.readFileSync(indexPath), {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }

      return ssrResponse;
    } catch (err) {
      console.error("[server.js error]", err);
      const indexPath = path.join(distDir, "index.html");
      if (fs.existsSync(indexPath)) {
        return new Response(fs.readFileSync(indexPath), {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      return new Response("Internal Server Error: " + String(err), {
        status: 500,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  },
};
`;

const targetFile = path.join(serverDir, "server.js");
fs.writeFileSync(targetFile, serverJsContent, "utf-8");
console.log(`[build-shim] Successfully created ${targetFile}`);
