import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { LinkController } from "../controllers/link.controller";
import { rateLimitShorten } from "../middleware/rateLimiter";

const router = Router();

router.post("/shorten", requireAuth, rateLimitShorten, LinkController.shorten);
router.get("/", requireAuth, LinkController.list);
router.get("/:slug/stats", requireAuth, LinkController.getStats);
router.get("/:slug/analytics", requireAuth, LinkController.getAnalytics);
export default router;
