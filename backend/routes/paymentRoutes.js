import express from 'express';
const router = express.Router();
import { getPayments, createPayment, validateBulkUpload, importBulkUpload, getBulkUploadErrorReport } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', protect, getPayments);
router.post('/', protect, createPayment);
router.post('/bulk-upload/validate', protect, upload.single('file'), validateBulkUpload);
router.post('/bulk-upload/import', protect, upload.single('file'), importBulkUpload);
router.get('/bulk-upload/errors/:logId', protect, getBulkUploadErrorReport);

export default router;
