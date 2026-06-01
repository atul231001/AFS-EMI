import express from 'express';
const router = express.Router();
import { getLoans, createLoan, updateLoan, approveLoan, approveSchedule, approveInvoice, downloadReceipt, downloadReport, downloadAgreement, sendAgreementEmail, confirmDispatch } from '../controllers/loanController.js';
import { protect } from '../middleware/authMiddleware.js';

router.get('/', protect, getLoans);
router.post('/', protect, createLoan);
router.put('/:id', protect, updateLoan);
router.post('/:id/approve', protect, approveLoan);
router.post('/:id/schedule', protect, approveSchedule);
router.post('/:id/invoice', protect, approveInvoice);
router.get('/:id/agreement/download', protect, downloadAgreement);
router.post('/:id/agreement/send', protect, sendAgreementEmail);
router.post('/:id/dispatch', protect, confirmDispatch);
router.get('/:id/receipt/:installment', protect, downloadReceipt);
router.get('/:id/report/:format', protect, downloadReport);

export default router;
