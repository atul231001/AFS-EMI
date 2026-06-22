import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import Loan from '../../models/Loan.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'backend', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.post('/agreement/:loanId', protect, upload.single('file'), async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.loanId);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    
    loan.agreementUrl = `/uploads/${req.file.filename}`;
    loan.approvalStatus = 'Pending Invoice';
    
    loan.approvalHistory = loan.approvalHistory || [];
    loan.approvalHistory.push({
      step: 'Agreement Upload',
      status: 'Agreement Confirmed',
      action: 'Agreement Uploaded',
      approverId: req.user._id,
      approverName: req.user.name,
      notes: req.user.email, // using notes to store email temporarily
      date: new Date()
    });
    
    await loan.save();
    
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/invoice/:loanId', upload.single('file'), async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.loanId);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    
    loan.invoiceUrl = `/uploads/${req.file.filename}`;
    loan.approvalStatus = 'Pending Dispatch';
    // loan.status remains 'Active' or whatever default, but approvalStatus drives pipeline.
    
    if (req.file.mimetype === 'application/pdf') {
      try {
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(dataBuffer);
        const match = data.text.match(/INV-\d+/i);
        if (match) {
          loan.invoiceNumber = match[0];
        }
      } catch (err) {
        console.log('Failed to parse PDF for invoice number:', err.message);
      }
    }
    
    await loan.save();
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
