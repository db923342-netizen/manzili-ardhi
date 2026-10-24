// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

function apiGeminiDevPlugin(): Plugin {
  return {
    name: "api-gemini-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (
          req.method === "POST" &&
          req.url &&
          (req.url.startsWith("/api/gemini/advisor") || req.url.startsWith("/api/gemini/chat"))
        ) {
          try {
            const chunks: Buffer[] = [];
            req.on("data", (chunk) =>
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
            );
            req.on("end", async () => {
              try {
                const bodyStr = Buffer.concat(chunks).toString("utf-8");
                const body = bodyStr ? JSON.parse(bodyStr) : {};
                const { handleGeminiMapsChat } = await import("./src/server/gemini");
                const response = await handleGeminiMapsChat(body);
                const data = await response.json();
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.statusCode = response.status;
                res.end(JSON.stringify(data));
              } catch (innerErr) {
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(innerErr) }));
              }
            });
          } catch (err) {
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [apiGeminiDevPlugin()],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
