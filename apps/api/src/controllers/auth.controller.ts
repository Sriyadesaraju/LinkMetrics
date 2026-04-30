import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthService } from '../services/auth.service'

// Zod schema — validates the request body shape
const authSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Validate input — throws if invalid
      const { email, password } = authSchema.parse(req.body)

      // 2. Call service
      const result = await AuthService.register(email, password)

      // 3. Send response
      res.status(201).json(result)
    } catch (err) {
      // If it's a Zod validation error, format it nicely
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.issues[0].message })
      }
      next(err) // pass everything else to errorHandler
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = authSchema.parse(req.body)
      const result = await AuthService.login(email, password)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.issues[0].message })
      }
      next(err)
    }
  },
}