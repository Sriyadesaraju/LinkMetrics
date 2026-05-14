import "dotenv/config";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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

app.use(cors());
app.use(helmet());
app.use(express.json());

// API routes first
app.use("/api/auth", authRoutes);
app.use("/api/links", linkRoutes);
// then with your other routes:
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/ai", aiRoutes);

// Catch-all redirect — MUST be last before error handler
app.get("/:slug", rateLimitRedirect, RedirectController.redirect);

app.use(errorHandler);

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "LinkMetrics API is running",
  });
});

app.use("/api/auth", authRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
