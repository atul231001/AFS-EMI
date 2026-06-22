import express from 'express';
const router = express.Router();
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../controllers/app/customerController.js';
import { protect } from '../../middleware/authMiddleware.js';

router.get('/', protect, getCustomers);
router.post('/', protect, createCustomer);
router.put('/:id', protect, updateCustomer);
router.delete('/:id', protect, deleteCustomer);

export default router;
