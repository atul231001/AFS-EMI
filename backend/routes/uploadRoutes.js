import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import prisma from '../config/prisma.js';
import { protect } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.post('/agreement/:loanId', protect, upload.single('file'), async (req, res) => {
  try {
    const loan = await prisma.loans.findUnique({ where: { id: req.params.loanId } });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    
    let approvalHistory = [];
    try { approvalHistory = typeof loan.approvalHistory === 'string' ? JSON.parse(loan.approvalHistory) : (loan.approvalHistory || []); } catch(e){}
    
    approvalHistory.push({
      step: 'Agreement Upload',
      status: 'Agreement Confirmed',
      action: 'Agreement Uploaded',
      approverId: req.user.id || req.user._id,
      approverName: req.user.name,
      notes: req.user.email, // using notes to store email temporarily
      date: new Date()
    });
    
    const updated = await prisma.loans.update({
      where: { id: loan.id },
      data: {
        agreementUrl: `/uploads/${req.file.filename}`,
        approvalStatus: 'Pending Invoice',
        approvalHistory
      }
    });
    
    res.json({ ...updated, _id: updated.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/invoice/:loanId', upload.single('file'), async (req, res) => {
  try {
    const loan = await prisma.loans.findUnique({ where: { id: req.params.loanId } });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    
    const updateData = {
      invoiceUrl: `/uploads/${req.file.filename}`,
      approvalStatus: 'Pending Dispatch'
    };
    
    if (req.file.mimetype === 'application/pdf') {
      try {
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(dataBuffer);
        const match = data.text.match(/INV-\d+/i);
        if (match) {
          updateData.invoiceNumber = match[0];
        }
      } catch (err) {
        console.log('Failed to parse PDF for invoice number:', err.message);
      }
    }
    
    const updated = await prisma.loans.update({
      where: { id: loan.id },
      data: updateData
    });
    res.json({ ...updated, _id: updated.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
