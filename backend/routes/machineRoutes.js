import express from 'express';
const router = express.Router();
import { getMachines, createMachine, updateMachine, deleteMachine, getCategories, syncCategories, syncProducts } from '../controllers/machineController.js';
import { protect } from '../middleware/authMiddleware.js';

router.get('/categories', protect, getCategories);
router.post('/categories/sync', protect, syncCategories);

router.post('/sync', protect, syncProducts);

router.get('/', protect, getMachines);
router.post('/', protect, createMachine);
router.put('/:id', protect, updateMachine);
router.delete('/:id', protect, deleteMachine);

export default router;
