import express from 'express';
const router = express.Router();
import { getPayments, createPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

router.get('/', protect, getPayments);
router.post('/', protect, createPayment);

export default router;
