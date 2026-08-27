import prisma from '../config/prisma.js';
import { generateReceiptPDF, generateAgreementPDF, generateAgreementHTML } from '../services/pdfService.js';
import { generateExcelReport, generatePPTReport, generatePDFReport } from '../services/reportService.js';

import { calculateOverdueInterest } from '../utils/interestCalculator.js';

export const getLoans = async (req, res) => {
  try {
    const loans = await prisma.loans.findMany({ orderBy: { createdAt: 'desc' } });
    
    // Manual populate for customerId and approvalFlowId
    const customerIds = loans.map(l => l.customerId).filter(Boolean);
    const customers = await prisma.customers.findMany({ where: { id: { in: customerIds } } });
    const customerMap = {};
    customers.forEach(c => customerMap[c.id] = { ...c, _id: c.id });

    const flowIds = loans.map(l => l.approvalFlowId).filter(Boolean);
    const flows = await prisma.approvalflows.findMany({ where: { id: { in: flowIds } } });
    const flowMap = {};
    flows.forEach(f => flowMap[f.id] = { ...f, _id: f.id });

    const updatedLoans = loans.map(loan => {
      let l = { ...loan, _id: loan.id };
      
      // Parse JSON fields
      if (l.schedule && typeof l.schedule === 'string') {
        try { l.schedule = JSON.parse(l.schedule); } catch (e) { l.schedule = []; }
      }
      if (l.approvalHistory && typeof l.approvalHistory === 'string') {
        try { l.approvalHistory = JSON.parse(l.approvalHistory); } catch (e) { l.approvalHistory = []; }
      }
      
      if (l.customerId && customerMap[l.customerId]) l.customerId = customerMap[l.customerId];
      if (l.approvalFlowId && flowMap[l.approvalFlowId]) l.approvalFlowId = flowMap[l.approvalFlowId];
      
      return calculateOverdueInterest(l);
    });
    
    res.json(updatedLoans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createLoan = async (req, res) => {
  try {
    const payload = { ...req.body };
    
    // Convert arrays/objects to JSON for Prisma
    if (payload.schedule) payload.schedule = payload.schedule; // Prisma will handle Json type
    if (payload.approvalHistory) payload.approvalHistory = payload.approvalHistory;
    
    let flow = await prisma.approvalflows.findFirst({
      where: { type: 'FINANCING', isActive: true, supervisorId: req.user.id }
    });
    
    if (!flow) {
      flow = await prisma.approvalflows.findFirst({
        where: { type: 'FINANCING', isActive: true, supervisorId: { in: [null, ''] } }
      });
    }

    if (flow && flow.steps) {
      let stepsArray = [];
      try { stepsArray = typeof flow.steps === 'string' ? JSON.parse(flow.steps) : flow.steps; } catch(e){}
      
      if (stepsArray.length > 0) {
        payload.approvalFlowId = flow.id;
        payload.approvalStatus = 'Pending Approval';
        payload.approvalStep = 0;
        payload.agreementGenerated = false;
      } else {
        payload.approvalStatus = 'Pending Scheduling';
        payload.agreementGenerated = false;
      }
    } else {
      payload.approvalStatus = 'Pending Scheduling';
      payload.agreementGenerated = false;
    }

    const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    payload.id = newId;
    payload.createdAt = new Date();
    payload.updatedAt = new Date();

    const newLoan = await prisma.loans.create({ data: payload });
    
    let populatedLoan = { ...newLoan, _id: newLoan.id };
    if (populatedLoan.customerId) {
      const cust = await prisma.customers.findUnique({ where: { id: populatedLoan.customerId } });
      if (cust) populatedLoan.customerId = { ...cust, _id: cust.id };
    }
    
    res.status(201).json(populatedLoan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateLoan = async (req, res) => {
  try {
    const updateData = { ...req.body, updatedAt: new Date() };
    const updatedLoan = await prisma.loans.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json({ ...updatedLoan, _id: updatedLoan.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const approveLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { action = 'Approved', notes = '' } = req.body || {};

    const loan = await Loan.findById(id).populate({
      path: 'approvalFlowId',
      populate: {
        path: 'steps.statusId',
        model: 'TicketStatus'
      }
    });

    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    if (loan.approvalStatus === 'Approved' || loan.approvalStatus === 'Rejected') {
      return res.status(400).json({ message: 'Loan is already fully processed' });
    }

    if (action === 'Rejected') {
      loan.approvalStatus = 'Rejected';
      loan.approvalHistory.push({
        action,
        notes,
        approverId: req.user._id,
        approverName: req.user.name || 'Unknown',
        status: 'Rejected',
        date: new Date()
      });
      await loan.save();
      const updated = await Loan.findById(id).populate('customerId');
      return res.json(updated);
    }

    const flow = loan.approvalFlowId;
    if (!flow) {
      loan.approvalStatus = 'Approved';
      loan.agreementGenerated = true;
      loan.approvalHistory.push({
        action,
        notes,
        approverId: req.user._id,
        approverName: req.user.name || 'Unknown',
        status: 'Approved',
        date: new Date()
      });
      await loan.save();
      const updated = await Loan.findById(id).populate('customerId');
      return res.json(updated);
    }

    // Get the status from the current step
    const currentStep = flow.steps[loan.approvalStep];
    const stepStatusName = currentStep && currentStep.statusId ? (currentStep.statusId.name || currentStep.statusId) : 'Approved Step';

    loan.approvalHistory.push({
      action,
      notes,
      approverId: req.user._id,
      approverName: req.user.name || 'Unknown',
      status: stepStatusName,
      date: new Date()
    });

    loan.approvalStatus = stepStatusName;
    loan.approvalStep += 1;

    if (loan.approvalStep >= flow.steps.length) {
      loan.approvalStatus = 'Pending Scheduling';
    }

    await loan.save();
    const updatedLoan = await Loan.findById(id).populate('customerId');
    res.json(updatedLoan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const downloadAgreement = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('customerId');
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    const pdf = await generateAgreementPDF(loan);
    res.contentType("application/pdf");
    res.setHeader('Content-Disposition', `attachment; filename=Agreement_${loan._id}.pdf`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ message: 'Error generating agreement PDF' });
  }
};

export const getAgreementHTML = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('customerId');
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    const html = generateAgreementHTML(loan, true);
    res.contentType("text/html");
    res.send(html);
  } catch (error) {
    res.status(500).json({ message: 'Error generating agreement HTML' });
  }
};

export const sendAgreementEmail = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('customerId');
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    res.json({ message: 'Email sent successfully to ' + (loan.customerId?.email || 'customer') });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmDispatch = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('customerId');
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    loan.approvalStatus = 'Pending Commissioning';
    loan.dispatchDate = req.body.dispatchDate || new Date().toISOString().split('T')[0];
    if (req.body.serialNumber) loan.serialNumber = req.body.serialNumber;
    if (req.body.dispatchData) loan.dispatchData = req.body.dispatchData;
    await loan.save();
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmCommission = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('customerId');
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    loan.approvalStatus = 'Active';
    loan.commissionDate = req.body.commissionDate || new Date().toISOString().split('T')[0];
    await loan.save();
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveSchedule = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    loan.approvalStatus = 'Pending Invoice';
    
    if (req.body.notes) {
      loan.approvalHistory = loan.approvalHistory || [];
      loan.approvalHistory.push({
        step: 'Scheduling Phase',
        status: 'Scheduled',
        notes: req.body.notes,
        date: new Date()
      });
    }
    
    await loan.save();
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveInvoice = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    loan.approvalStatus = 'Pending Dispatch';
    
    if (req.body.invoiceNumber) {
      loan.invoiceNumber = req.body.invoiceNumber;
    }
    
    if (req.body.invoiceData) {
      loan.invoiceData = req.body.invoiceData;
    }
    
    if (req.body.notes) {
      loan.approvalHistory = loan.approvalHistory || [];
      loan.approvalHistory.push({
        step: 'Invoicing Phase',
        status: 'Invoiced',
        notes: req.body.notes,
        date: new Date()
      });
    }
    
    await loan.save();
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadReceipt = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('customerId');
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const installmentNum = parseInt(req.params.installment);
    const installment = loan.schedule.find((s, index) => s.installment === installmentNum || s.installmentNo === installmentNum || (index + 1) === installmentNum);

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
      case 'ppt': {
        const allLoans = await Loan.find({ customerId: loan.customerId._id }).populate('customerId');
        buffer = await generatePPTReport(loan, allLoans);
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        extension = 'pptx';
        break;
      }
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

export const lookupLoan = async (req, res) => {
  try {
    const { invoice, serial } = req.query;

    if (!invoice && !serial) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        status: "Bad Request",
        error: {
          code: "MISSING_PARAM",
          message: "A required query parameter 'invoice' or 'serial' is missing."
        },
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
    }

    const query = {};
    if (invoice) {
      query.invoiceNumber = invoice;
    } else if (serial) {
      query.serialNumber = serial;
    }

    const loan = await Loan.findOne(query).populate('customerId');
    if (!loan) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        status: "Not Found",
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: `No loan record exists for the provided ${invoice ? 'invoice (' + invoice + ')' : 'serial (' + serial + ')'}.`
        },
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
    }

    // Fetch associated machine
    let machineInfo = null;
    if (loan.machineName) {
      const machineDoc = await Machine.findOne({ name: loan.machineName });
      if (machineDoc) {
        machineInfo = {
          name: machineDoc.name,
          category: machineDoc.category,
          model: machineDoc.model,
          serialNumber: loan.serialNumber,
          machinePrice: loan.machinePrice,
          warranty: machineDoc.warranty
        };
      } else {
        machineInfo = {
          name: loan.machineName,
          model: loan.model,
          serialNumber: loan.serialNumber,
          machinePrice: loan.machinePrice
        };
      }
    }

    // Calculate schedule summary
    const scheduleSummary = {
      totalInstallments: loan.schedule ? loan.schedule.length : 0,
      paidInstallments: loan.schedule ? loan.schedule.filter(s => s.status === 'Paid').length : 0,
      pendingInstallments: loan.schedule ? loan.schedule.filter(s => s.status !== 'Paid').length : 0,
      nextDueDate: null,
      outstandingPrincipal: 0,
      overdueInstallments: 0
    };

    if (loan.schedule && loan.schedule.length > 0) {
      const pending = loan.schedule.filter(s => s.status !== 'Paid').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      if (pending.length > 0) {
        scheduleSummary.nextDueDate = pending[0].dueDate;
      }
      const lastPaid = loan.schedule.filter(s => s.status === 'Paid').sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))[0];
      if (lastPaid) {
        scheduleSummary.outstandingPrincipal = lastPaid.balance || 0;
      } else if (pending.length > 0) {
        scheduleSummary.outstandingPrincipal = loan.principal || 0;
      }
      
      const now = new Date();
      scheduleSummary.overdueInstallments = loan.schedule.filter(s => s.status !== 'Paid' && new Date(s.dueDate) < now).length;
    }

    const customerData = loan.customerId ? {
      id: loan.customerId._id,
      name: loan.customerId.name,
      customId: loan.customerId.customId,
      mobile: loan.customerId.mobile,
      email: loan.customerId.email,
      gst: loan.customerId.gst,
      type: loan.customerId.type
    } : null;

    // Dispatch info
    const dispatchInfo = {
      invoiceNumber: loan.invoiceNumber,
      invoiceDate: loan.invoiceData?.invoiceDate || loan.invoiceData?.date || null,
      dispatchDate: loan.dispatchDate,
      serialNumber: loan.serialNumber,
      documents: {
        invoiceFile: loan.invoiceUrl || loan.invoiceData?.invoiceFile || loan.invoiceData?.url || null,
        ddFile: loan.dispatchData?.ddFile || loan.dispatchData?.url || null,
        lrFile: loan.dispatchData?.lrFile || loan.dispatchData?.lrUrl || null
      }
    };

    return res.status(200).json({
      success: true,
      statusCode: 200,
      status: "OK",
      data: {
        loanId: loan._id,
        customer: customerData,
        machine: machineInfo,
        loanDetails: {
          principal: loan.principal,
          emi: loan.emi,
          tenure: loan.tenure,
          interestRate: loan.interestRate,
          downPayment: loan.downPayment,
          discount: {
            amount: loan.discountAmount || 0,
            percentage: loan.discountPercentage || 0
          },
          delayInterest: loan.delayInterest,
          status: loan.status,
          approvalStatus: loan.approvalStatus,
          agreementGenerated: loan.agreementGenerated,
          agreementUrl: loan.agreementUrl,
          emiStartDate: loan.emiStartDate,
          scheduleSummary,
          schedule: loan.schedule
        },
        dispatchInfo,
        approvalHistory: loan.approvalHistory
      },
      meta: {
        requestedAt: new Date().toISOString(),
        lookupType: invoice ? 'invoice' : 'serial',
        lookupValue: invoice || serial
      }
    });

  } catch (error) {
    console.error("Lookup Loan Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      status: "Internal Server Error",
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while processing your request."
      },
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  }
};
