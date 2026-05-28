import express from 'express';
const router = express.Router();
import { getRoles, createRole, updateRole, deleteRole } from '../controllers/roleController.js';
import { protect } from '../middleware/authMiddleware.js';

router.get('/', protect, getRoles);
router.post('/', protect, createRole);
router.put('/:id', protect, updateRole);
router.delete('/:id', protect, deleteRole);

export default router;
