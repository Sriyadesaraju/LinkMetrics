import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Extend Express's Request type to include our user
export interface AuthRequest extends Request {
  user?: { userId: string; email: string }
  // Set by requireWorkspace after membership is verified — controllers should
  // trust this, not the raw client-supplied workspaceId.
  workspaceId?: string
}

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers?.authorization

  // Token must be sent as: Authorization: Bearer <token>
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string
      email: string
    }
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}