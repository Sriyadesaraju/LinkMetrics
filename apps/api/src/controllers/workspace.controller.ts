import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import { WorkspaceService } from '../services/workspace.service'

const createSchema = z.object({
  name: z.string().min(1, 'Workspace name required').max(50),
})

export const WorkspaceController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name } = createSchema.parse(req.body)
      const workspace = await WorkspaceService.create(name, req.user!.userId)
      res.status(201).json(workspace)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.issues[0].message })
      }
      next(err)
    }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workspaces = await WorkspaceService.listForUser(req.user!.userId)
      res.json(workspaces)
    } catch (err) {
      next(err)
    }
  },
}