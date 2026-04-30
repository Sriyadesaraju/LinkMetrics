import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { WorkspaceController } from '../controllers/workspace.controller'

const router = Router()

router.post('/', requireAuth, WorkspaceController.create)
router.get('/', requireAuth, WorkspaceController.list)

export default router