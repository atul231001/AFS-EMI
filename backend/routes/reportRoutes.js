import express from 'express';
const router = express.Router();
import { downloadGlobalReport } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/global/:format', protect, downloadGlobalReport);

export default router;
