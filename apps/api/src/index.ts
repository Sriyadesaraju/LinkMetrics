import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import linkRoutes from "./routes/link.routes";
import { RedirectController } from "./controllers/redirect.controller"; // add this
import workspaceRoutes from "./routes/workspace.routes"; // add this
import { rateLimitRedirect } from "./middleware/rateLimiter";
import aiRoutes from "./routes/ai.routes";

const required = [
  "DATABASE_URL",
  "JWT_SECRET",
  "CORS_ORIGIN",
  "GEMINI_API_KEY",
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}

const app = express();
app.set("trust proxy", 1); // if behind a proxy (e.g. Heroku, Vercel) to get correct IPs
const PORT = process.env.PORT || 3000;

// Only the known frontend origin may make browser requests. CORS_ORIGIN is
// validated as required above. (For multiple origins, pass an array or a
// function that checks an allowlist.)
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(helmet());
app.use(express.json());

// Health check — exact path, handy for uptime probes.
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "LinkMetrics API is running",
  });
});

// Specific API routes first.
app.use("/api/auth", authRoutes);
app.use("/api/links", linkRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/ai", aiRoutes);

// Catch-all redirect — MUST be the last route so it can't swallow /api/* calls.
app.get("/:slug", rateLimitRedirect, RedirectController.redirect);

// Error handler — registered last so it sits at the end of the chain.
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
