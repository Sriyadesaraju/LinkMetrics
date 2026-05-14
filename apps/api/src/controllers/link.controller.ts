import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";
import { LinkService } from "../services/link.service";

const shortenSchema = z.object({
  originalUrl: z.string().url("Invalid URL"),
  customSlug: z.string().optional(),
  workspaceId: z.string().min(1, "Workspace ID required"),
  expiresAt: z.string().datetime().optional(), // add this
});

export const LinkController = {
  async shorten(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const body = shortenSchema.parse(req.body);
      const result = await LinkService.shorten({
        ...body,
        userId: req.user!.userId,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.issues[0].message });
      }
      next(err);
    }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res
          .status(400)
          .json({ error: "workspaceId query param required" });
      }
      const links = await LinkService.listLinks(workspaceId);
      res.json(links);
    } catch (err) {
      next(err);
    }
  },

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res
          .status(400)
          .json({ error: "workspaceId query param required" });
      }
      const stats = await LinkService.getStats(
        req.params["slug"] as string,
        workspaceId,
      );
      res.json(stats);
    } catch (err) {
      next(err);
    }
  },
  async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId required" });
      }
      const data = await LinkService.getAnalytics(
        req.params["slug"] as string,
        workspaceId,
        req.query.from as string,
        req.query.to as string,
      );
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
  async exportAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId)
        return res.status(400).json({ error: "workspaceId required" });

      const rows = await LinkService.exportAnalytics(
        req.params["slug"] as string,
        workspaceId,
        req.query.from as string,
        req.query.to as string,
      );

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="analytics-${req.params["slug"]}.csv"`,
      );

      // Write CSV header
      res.write("timestamp,country,city,device,browser,os,referrer\n");

      // Write rows
      for (const row of rows) {
        res.write(
          `${row.timestamp.toISOString()},${row.country ?? ""},${row.city ?? ""},${row.deviceType ?? ""},${row.browser ?? ""},${row.os ?? ""},${row.referrer ?? ""}\n`,
        );
      }

      res.end();
    } catch (err) {
      next(err);
    }
  },
};
