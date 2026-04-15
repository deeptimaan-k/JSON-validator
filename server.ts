import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Normalize JSON API (optional but implemented as requested)
  app.post("/api/normalize", (req, res) => {
    const { template, data } = req.body;
    if (!template) {
      return res.status(400).json({ error: "Template is required" });
    }
    
    try {
      const result = normalizeJson(template, data || {});
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Normalization failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

const DEFAULT_VALUE = [{ index: 0, regex: " " }];

function normalizeJson(template: any, data: any): any {
  if (typeof template === "object" && template !== null && !Array.isArray(template)) {
    const result: any = {};

    for (const key in template) {
      if (data && key in data) {
        result[key] = normalizeJson(template[key], data[key]);
      } else {
        if (Array.isArray(template[key])) {
          result[key] = JSON.parse(JSON.stringify(DEFAULT_VALUE));
        } else if (typeof template[key] === "object" && template[key] !== null) {
          result[key] = normalizeJson(template[key], {});
        } else {
          result[key] = template[key];
        }
      }
    }

    return result;
  }

  if (Array.isArray(template)) {
    return Array.isArray(data) && data.length > 0
      ? data
      : JSON.parse(JSON.stringify(DEFAULT_VALUE));
  }

  return data !== undefined ? data : template;
}

startServer();
