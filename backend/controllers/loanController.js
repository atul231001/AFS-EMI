import Loan from '../models/Loan.js';
import { generateReceiptPDF } from '../services/pdfService.js';
import { generateExcelReport, generatePPTReport, generatePDFReport } from '../services/reportService.js';

export const getLoans = async (req, res) => {
  try {
    const loans = await Loan.find().populate('customerId').sort({ createdAt: -1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createLoan = async (req, res) => {
  const loan = new Loan(req.body);
  try {
    const newLoan = await loan.save();
    await newLoan.populate('customerId');
    res.status(201).json(newLoan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateLoan = async (req, res) => {
  try {
    const updatedLoan = await Loan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedLoan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const downloadReceipt = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('customerId');
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const installmentNum = parseInt(req.params.installment);
    const installment = loan.schedule.find(s => s.installment === installmentNum);

    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    const pdf = await generateReceiptPDF(loan, installment);

    res.contentType("application/pdf");
    res.send(pdf);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ message: 'Error generating PDF receipt' });
  }
};

export const downloadReport = async (req, res) => {
  try {
    const { id, format } = req.params;
    const loan = await Loan.findById(id).populate('customerId');
    
    if (!loan) {
      return res.status(404).json({ message: 'Asset Protocol Not Found' });
    }

    let buffer;
    let contentType;
    let extension;

    switch (format.toLowerCase()) {
      case 'excel':
        buffer = await generateExcelReport(loan);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        break;
      case 'ppt':
        buffer = await generatePPTReport(loan);
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        extension = 'pptx';
        break;
      case 'pdf':
        buffer = await generatePDFReport(loan);
        contentType = 'application/pdf';
        extension = 'pdf';
        break;
      default:
        return res.status(400).json({ message: 'Invalid Format Protocol' });
    }

    const filename = `Strategic_Report_${loan.machineName.replace(/\s+/g, '_')}.${extension}`;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);

  } catch (error) {
    console.error('Report Generation Error:', error);
    res.status(500).json({ message: 'Protocol Failure: Report Generation Aborted' });
  }
};
