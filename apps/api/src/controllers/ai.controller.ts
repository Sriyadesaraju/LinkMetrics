import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { AIService } from '../services/ai.service'
import { AuthRequest } from '../middleware/auth'

const utmSchema = z.object({
  url: z.string().url('Invalid URL'),
})

export const AIController = {
  async suggestUTM(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { url } = utmSchema.parse(req.body)
      const suggestions = await AIService.suggestUTMParams(url)
      res.json(suggestions)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.issues[0].message })
      }
      next(err)
    }
  },

  async summarizeAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const body = req.body
      if (!body || typeof body.totalClicks !== 'number') {
        return res.status(400).json({ error: 'Analytics data required' })
      }
      const summary = await AIService.summarizeAnalytics(body)
      res.json({ summary })
    } catch (err) {
      next(err)
    }
  },
}