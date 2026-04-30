import { Request, Response } from 'express'
import { LinkService } from '../services/link.service'

export const RedirectController = {
  async redirect(req: Request, res: Response) {
    const { slug } = req.params as { slug: string }

    const url = await LinkService.handleRedirect(slug, {
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      referrer: req.headers['referer'] || '',
    })

    if (!url) {
      return res.status(404).json({ error: 'Link not found or expired' })
    }

    // 301 = permanent redirect (browsers cache it)
    // Use 302 during development so browsers don't cache stale redirects
    res.redirect(302, url)
  },
}