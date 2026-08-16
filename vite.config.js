import { defineConfig, loadEnv } from "vite";
import { createTranslationClientSecret } from "./api/session.js";

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("Request body must be valid JSON.")); }
    });
    req.on("error", reject);
  });
}

function localSessionApi() {
  return {
    name: "local-session-api",
    configureServer(server) {
      server.middlewares.use("/api/session", async (req, res, next) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Allow", "POST");
          res.end(JSON.stringify({ error: "Method not allowed." }));
          return;
        }

        try {
          const body = await readRequestBody(req);
          const result = await createTranslationClientSecret(body);
          res.statusCode = result.status;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify(result.body));
        } catch (error) {
          res.statusCode = error.status || 502;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error.status ? error.message : "OpenAI could not create a translation session. Try again.", ...(error.code ? { code: error.code } : {}) }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;
  return { plugins: [localSessionApi()] };
});
