import express from 'express';
const router = express.Router();
import { getLoans, createLoan, updateLoan, downloadReceipt, downloadReport } from '../controllers/loanController.js';
import { protect } from '../middleware/authMiddleware.js';

router.get('/', protect, getLoans);
router.post('/', protect, createLoan);
router.put('/:id', protect, updateLoan);
router.get('/:id/receipt/:installment', protect, downloadReceipt);
router.get('/:id/report/:format', protect, downloadReport);

export default router;
