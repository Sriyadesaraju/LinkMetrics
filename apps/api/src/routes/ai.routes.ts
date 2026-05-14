import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { AIController } from '../controllers/ai.controller'

const router = Router()

router.post('/utm-suggest', requireAuth, AIController.suggestUTM)
router.post('/analytics-summary', requireAuth, AIController.summarizeAnalytics)

export default router