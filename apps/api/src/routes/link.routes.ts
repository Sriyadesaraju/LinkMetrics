import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireWorkspace } from "../middleware/workspace";
import { LinkController } from "../controllers/link.controller";
import { rateLimitShorten } from "../middleware/rateLimiter";

const router = Router();

// Every route: authN (who are you) → rate limit (if any) → authZ (is this
// workspace yours) → handler.
router.post(
  "/shorten",
  requireAuth,
  rateLimitShorten,
  requireWorkspace,
  LinkController.shorten,
);
router.get("/", requireAuth, requireWorkspace, LinkController.list);
router.get("/:slug/stats", requireAuth, requireWorkspace, LinkController.getStats);
router.get(
  "/:slug/analytics",
  requireAuth,
  requireWorkspace,
  LinkController.getAnalytics,
);
router.get(
  "/:slug/analytics/export",
  requireAuth,
  requireWorkspace,
  LinkController.exportAnalytics,
);
export default router;
