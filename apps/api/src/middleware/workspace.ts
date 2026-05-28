import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { WorkspaceRepository } from "../repositories/workspace.repository";

// Authorization guard. Runs AFTER requireAuth (so req.user is populated).
// Confirms the authenticated user is a member of the workspace they're acting
// on, then stamps the validated id onto req.workspaceId for downstream handlers.
export const requireWorkspace = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // workspaceId arrives in the body on writes (POST /shorten) and in the query
  // string on reads (GET /, /:slug/analytics, ...).
  const workspaceId = (req.body?.workspaceId ?? req.query?.workspaceId) as
    | string
    | undefined;

  if (!workspaceId) {
    res.status(400).json({ error: "workspaceId is required" });
    return;
  }

  const membership = await WorkspaceRepository.findMembership(
    workspaceId,
    req.user!.userId,
  );

  if (!membership) {
    // 403, not 404: the caller is authenticated but lacks access. (Returning
    // 404 instead would hide whether the workspace exists at all — a stricter
    // anti-enumeration choice some APIs prefer.)
    res.status(403).json({ error: "You do not have access to this workspace" });
    return;
  }

  req.workspaceId = workspaceId;
  next();
};
