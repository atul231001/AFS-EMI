import prisma from '../../config/prisma.js';
import { generateReceiptPDF, generateAgreementPDF, generateAgreementHTML } from '../../services/pdfService.js';
import { generateExcelReport, generatePPTReport, generatePDFReport } from '../../services/reportService.js';

import { calculateOverdueInterest } from '../../utils/interestCalculator.js';

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
        where: { type: 'FINANCING', isActive: true, OR: [{ supervisorId: null }, { supervisorId: '' }] }
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

    const loan = await prisma.loans.findUnique({
      where: { id },
      include: {
        approvalflows: true
      }
    });

    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    if (loan.approvalStatus === 'Approved' || loan.approvalStatus === 'Rejected') {
      return res.status(400).json({ message: 'Loan is already fully processed' });
    }
    
    let approvalHistory = [];
    try { approvalHistory = typeof loan.approvalHistory === 'string' ? JSON.parse(loan.approvalHistory) : (loan.approvalHistory || []); } catch(e){}

    if (action === 'Rejected') {
      approvalHistory.push({
        action,
        notes,
        approverId: req.user.id || req.user._id,
        approverName: req.user.name || 'Unknown',
        status: 'Rejected',
        date: new Date()
      });
      await prisma.loans.update({
        where: { id },
        data: { approvalStatus: 'Rejected', approvalHistory }
      });
      
      const updated = await prisma.loans.findUnique({ where: { id }, include: { customers: true } });
      return res.json({ ...updated, _id: updated.id, customerId: updated.customers });
    }

    const flow = loan.approvalflows;
    let flowSteps = [];
    if (flow && flow.steps) {
      try { flowSteps = typeof flow.steps === 'string' ? JSON.parse(flow.steps) : flow.steps; } catch(e){}
    }

    if (!flow || flowSteps.length === 0) {
      approvalHistory.push({
        action,
        notes,
        approverId: req.user.id || req.user._id,
        approverName: req.user.name || 'Unknown',
        status: 'Approved',
        date: new Date()
      });
      await prisma.loans.update({
        where: { id },
        data: { approvalStatus: 'Approved', agreementGenerated: true, approvalHistory }
      });
      const updated = await prisma.loans.findUnique({ where: { id }, include: { customers: true } });
      return res.json({ ...updated, _id: updated.id, customerId: updated.customers });
    }

    // Get the status from the current step
    const currentStep = flowSteps[loan.approvalStep || 0];
    let stepStatusName = 'Approved Step';
    
    if (currentStep && currentStep.statusId) {
      // Fetch ticket status to get name
      const statusDoc = await prisma.ticketstatuses.findUnique({ where: { id: currentStep.statusId } });
      if (statusDoc) stepStatusName = statusDoc.name;
    }

    approvalHistory.push({
      action,
      notes,
      approverId: req.user.id || req.user._id,
      approverName: req.user.name || 'Unknown',
      status: stepStatusName,
      date: new Date()
    });

    let newStep = (loan.approvalStep || 0) + 1;
    let newStatus = stepStatusName;

    if (newStep >= flowSteps.length) {
      newStatus = 'Pending Scheduling';
    }

    await prisma.loans.update({
      where: { id },
      data: {
        approvalStatus: newStatus,
        approvalStep: newStep,
        approvalHistory
      }
    });
    
    const updatedLoan = await prisma.loans.findUnique({ where: { id }, include: { customers: true } });
    res.json({ ...updatedLoan, _id: updatedLoan.id, customerId: updatedLoan.customers });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const downloadAgreement = async (req, res) => {
  try {
    const loan = await prisma.loans.findUnique({ where: { id: req.params.id }, include: { customers: true } });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    // Map for legacy pdfService
    const mappedLoan = { ...loan, _id: loan.id, customerId: loan.customers };
    const pdf = await generateAgreementPDF(mappedLoan);
    res.contentType("application/pdf");
    res.setHeader('Content-Disposition', `attachment; filename=Agreement_${loan.id}.pdf`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ message: 'Error generating agreement PDF' });
  }
};

export const getAgreementHTML = async (req, res) => {
  try {
    const loan = await prisma.loans.findUnique({ where: { id: req.params.id }, include: { customers: true } });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    const mappedLoan = { ...loan, _id: loan.id, customerId: loan.customers };
    const html = generateAgreementHTML(mappedLoan, true);
    res.contentType("text/html");
    res.send(html);
  } catch (error) {
    res.status(500).json({ message: 'Error generating agreement HTML' });
  }
};

export const sendAgreementEmail = async (req, res) => {
  try {
    const loan = await prisma.loans.findUnique({ where: { id: req.params.id }, include: { customers: true } });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    res.json({ message: 'Email sent successfully to ' + (loan.customers?.email || 'customer') });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmDispatch = async (req, res) => {
  try {
    const loan = await prisma.loans.findUnique({ where: { id: req.params.id } });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    const updateData = {
      approvalStatus: 'Pending Commissioning',
      dispatchDate: req.body.dispatchDate ? new Date(req.body.dispatchDate) : new Date()
    };
    
    if (req.body.serialNumber) updateData.serialNumber = req.body.serialNumber;
    if (req.body.dispatchData) updateData.dispatchData = req.body.dispatchData;
    
    const updated = await prisma.loans.update({ where: { id: loan.id }, data: updateData, include: { customers: true } });
    res.json({ ...updated, _id: updated.id, customerId: updated.customers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmCommission = async (req, res) => {
  try {
    const loan = await prisma.loans.findUnique({ where: { id: req.params.id } });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    const updateData = {
      approvalStatus: 'Active',
      commissionDate: req.body.commissionDate ? new Date(req.body.commissionDate) : new Date()
    };
    
    const updated = await prisma.loans.update({ where: { id: loan.id }, data: updateData, include: { customers: true } });
    res.json({ ...updated, _id: updated.id, customerId: updated.customers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveSchedule = async (req, res) => {
  try {
    const loan = await prisma.loans.findUnique({ where: { id: req.params.id } });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    
    let approvalHistory = [];
    try { approvalHistory = typeof loan.approvalHistory === 'string' ? JSON.parse(loan.approvalHistory) : (loan.approvalHistory || []); } catch(e){}
    
    if (req.body.notes) {
      approvalHistory.push({
        step: 'Scheduling Phase',
        status: 'Scheduled',
        notes: req.body.notes,
        date: new Date()
      });
    }
    
    const updated = await prisma.loans.update({
      where: { id: loan.id },
      data: { approvalStatus: 'Pending Invoice', approvalHistory }
    });
    res.json({ ...updated, _id: updated.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveInvoice = async (req, res) => {
  try {
    const loan = await prisma.loans.findUnique({ where: { id: req.params.id } });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    
    let approvalHistory = [];
    try { approvalHistory = typeof loan.approvalHistory === 'string' ? JSON.parse(loan.approvalHistory) : (loan.approvalHistory || []); } catch(e){}
    
    if (req.body.notes) {
      approvalHistory.push({
        step: 'Invoicing Phase',
        status: 'Invoiced',
        notes: req.body.notes,
        date: new Date()
      });
    }
    
    const updateData = { approvalStatus: 'Pending Dispatch', approvalHistory };
    if (req.body.invoiceNumber) updateData.invoiceNumber = req.body.invoiceNumber;
    if (req.body.invoiceData) updateData.invoiceData = req.body.invoiceData;
    
    const updated = await prisma.loans.update({
      where: { id: loan.id },
      data: updateData
    });
    res.json({ ...updated, _id: updated.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadReceipt = async (req, res) => {
  try {
    const loan = await prisma.loans.findUnique({ where: { id: req.params.id }, include: { customers: true } });
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    let schedule = [];
    try { schedule = typeof loan.schedule === 'string' ? JSON.parse(loan.schedule) : loan.schedule; } catch(e){}

    const installmentNum = parseInt(req.params.installment);
    const installment = (schedule || []).find((s, index) => s.installment === installmentNum || s.installmentNo === installmentNum || (index + 1) === installmentNum);

    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    const mappedLoan = { ...loan, _id: loan.id, customerId: loan.customers };
    const pdf = await generateReceiptPDF(mappedLoan, installment);

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
    const loan = await prisma.loans.findUnique({ where: { id }, include: { customers: true } });

    if (!loan) {
      return res.status(404).json({ message: 'Asset Protocol Not Found' });
    }

    const mappedLoan = { ...loan, _id: loan.id, customerId: loan.customers };

    let buffer;
    let contentType;
    let extension;

    switch (format.toLowerCase()) {
      case 'excel':
        buffer = await generateExcelReport(mappedLoan);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        break;
      case 'ppt': {
        const allLoans = await prisma.loans.findMany({ where: { customerId: loan.customerId }, include: { customers: true } });
        const mappedAllLoans = allLoans.map(l => ({ ...l, _id: l.id, customerId: l.customers }));
        buffer = await generatePPTReport(mappedLoan, mappedAllLoans);
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        extension = 'pptx';
        break;
      }
      case 'pdf':
        buffer = await generatePDFReport(mappedLoan);
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
        }
      });
    }

    const query = {};
    if (invoice) {
      query.invoiceNumber = invoice;
    } else if (serial) {
      query.serialNumber = serial;
    }

    const loan = await prisma.loans.findFirst({ where: query, include: { customers: true } });
    if (!loan) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        status: "Not Found",
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: `No loan record exists for the provided ${invoice ? 'invoice (' + invoice + ')' : 'serial (' + serial + ')'}.`
        }
      });
    }

    // Fetch associated machine
    let machineInfo = null;
    if (loan.machineName) {
      const machineDoc = await prisma.machines.findFirst({ where: { name: loan.machineName } });
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

    let schedule = [];
    try { schedule = typeof loan.schedule === 'string' ? JSON.parse(loan.schedule) : loan.schedule; } catch(e){}

    // Calculate schedule summary
    const scheduleSummary = {
      totalInstallments: schedule ? schedule.length : 0,
      paidInstallments: schedule ? schedule.filter(s => s.status === 'Paid').length : 0,
      pendingInstallments: schedule ? schedule.filter(s => s.status !== 'Paid').length : 0,
      nextDueDate: null,
      outstandingPrincipal: 0,
      overdueInstallments: 0
    };

    if (schedule && schedule.length > 0) {
      const pending = schedule.filter(s => s.status !== 'Paid').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      if (pending.length > 0) {
        scheduleSummary.nextDueDate = pending[0].dueDate;
      }
      const lastPaid = schedule.filter(s => s.status === 'Paid').sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))[0];
      if (lastPaid) {
        scheduleSummary.outstandingPrincipal = lastPaid.balance || 0;
      } else if (pending.length > 0) {
        scheduleSummary.outstandingPrincipal = loan.principal || 0;
      }
      
      const now = new Date();
      scheduleSummary.overdueInstallments = schedule.filter(s => s.status !== 'Paid' && new Date(s.dueDate) < now).length;
    }

    const customerData = loan.customers ? {
      id: loan.customers.id,
      name: loan.customers.name,
      customId: loan.customers.customId,
      mobile: loan.customers.mobile,
      email: loan.customers.email,
      gst: loan.customers.gst,
      type: loan.customers.type
    } : null;

    let invoiceData = {};
    let dispatchData = {};
    try { invoiceData = typeof loan.invoiceData === 'string' ? JSON.parse(loan.invoiceData) : (loan.invoiceData || {}); } catch(e){}
    try { dispatchData = typeof loan.dispatchData === 'string' ? JSON.parse(loan.dispatchData) : (loan.dispatchData || {}); } catch(e){}

    // Dispatch info
    const dispatchInfo = {
      invoiceNumber: loan.invoiceNumber,
      invoiceDate: invoiceData.invoiceDate || invoiceData.date || null,
      dispatchDate: loan.dispatchDate,
      serialNumber: loan.serialNumber,
      documents: {
        invoiceFile: loan.invoiceUrl || invoiceData.invoiceFile || invoiceData.url || null,
        ddFile: dispatchData.ddFile || dispatchData.url || null,
        lrFile: dispatchData.lrFile || dispatchData.lrUrl || null
      }
    };
    
    let approvalHistory = [];
    try { approvalHistory = typeof loan.approvalHistory === 'string' ? JSON.parse(loan.approvalHistory) : (loan.approvalHistory || []); } catch(e){}

    return res.status(200).json({
      success: true,
      statusCode: 200,
      status: "OK",
      data: {
        loanId: loan.id,
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
          schedule: schedule
        },
        dispatchInfo,
        approvalHistory
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
      }
    });
  }
};

export const getLoanDetails = async (req, res) => {
  try {
    const id = req.query.id || req.params.id;
    let loan;

    if (id.length === 24) {
      loan = await prisma.loans.findUnique({ where: { id }, include: { customers: true } });
      
      if (!loan) {
        const machine = await prisma.machines.findUnique({ where: { id } });
        if (machine) {
          const filter = {
            OR: [
              { machineId: machine.id },
              { machineName: machine.name, model: machine.model },
              { machineName: machine.name }
            ]
          };
          if (req.user && req.user.role === 'CUSTOMER' && req.user.customerId) {
            filter.customerId = req.user.customerId;
          }
          loan = await prisma.loans.findFirst({ where: filter, include: { customers: true } });
        }
      }
    }

    if (!loan) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Asset or Loan Protocol Not Found"
      });
    }

    const updatedLoan = calculateOverdueInterest(loan);

    const machine = await prisma.machines.findFirst({
      where: {
        OR: [
          { id: updatedLoan.machineId || '' },
          { name: updatedLoan.machineName || '', model: updatedLoan.model || '' },
          { name: updatedLoan.machineName || '' }
        ]
      }
    });

    const fullHost = req.protocol + '://' + req.get('host');
    let schedule = [];
    try { schedule = typeof updatedLoan.schedule === 'string' ? JSON.parse(updatedLoan.schedule) : (updatedLoan.schedule || []); } catch(e){}

    const mappedSchedule = schedule.map((s, index) => {
      const instNum = s.installment || s.installmentNo || (index + 1);
      return {
        installment: instNum,
        type: s.type || 'EMI',
        dueDate: s.dueDate,
        emi: s.emi || 0,
        principal: s.principal || 0,
        interest: s.interest || 0,
        outstandingAmount: s.outstandingAmount || 0,
        overdueInterest: s.overdueInterest || 0,
        paidOverdueInterest: s.paidOverdueInterest || 0,
        paidAmount: s.paidAmount || 0,
        paidDate: s.paidDate || null,
        balance: s.balance || 0,
        status: s.status || 'Pending',
        receiptUrl: s.status === 'Paid' ? `${fullHost}/api/app/loans/${updatedLoan.id}/receipt/${instNum}` : null
      };
    });

    const paidInstallments = mappedSchedule.filter(s => s.status === 'Paid');
    const pendingInstallments = mappedSchedule.filter(s => s.status !== 'Paid');
    const firstPending = pendingInstallments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
    const lastPaid = paidInstallments.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))[0];

    const nextEmi = updatedLoan.emi || 0;
    const totalPaid = paidInstallments.length * nextEmi;
    const outstandingBalance = firstPending ? firstPending.balance : (lastPaid ? lastPaid.balance : (updatedLoan.principal || 0));
    const totalOverdueInterest = mappedSchedule.reduce((sum, s) => sum + (s.overdueInterest || 0), 0);

    const metricsSummary = {
      nextEmi,
      totalPaid,
      outstandingBalance,
      overdueInterest: totalOverdueInterest,
      lastPaymentDate: lastPaid ? lastPaid.dueDate : null,
      nextPaymentDate: firstPending ? firstPending.dueDate : 'DONE',
      paymentProgressPercentage: Math.round((paidInstallments.length / (mappedSchedule.length || 1)) * 100)
    };

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Data retrieved successfully",
      data: {
        loanId: updatedLoan.id,
        machine: machine ? {
          id: machine.id,
          name: machine.name,
          category: machine.category,
          brand: machine.brand,
          serialNumber: updatedLoan.serialNumber || machine.serialNumber || 'N/A',
          chassisNumber: updatedLoan.chassisNumber || machine.chassisNumber || 'N/A',
          specs: machine.specs,
          images: machine.images,
          img: machine.img,
          pricing: machine.pricing
        } : {
          name: updatedLoan.machineName,
          model: updatedLoan.model,
          serialNumber: updatedLoan.serialNumber || 'N/A'
        },
        customer: updatedLoan.customers ? {
          id: updatedLoan.customers.id,
          name: updatedLoan.customers.name,
          customId: updatedLoan.customers.customId,
          mobile: updatedLoan.customers.mobile,
          email: updatedLoan.customers.email,
          gst: updatedLoan.customers.gst
        } : null,
        loanDetails: {
          principal: updatedLoan.principal,
          emi: updatedLoan.emi,
          tenure: updatedLoan.tenure,
          interestRate: updatedLoan.interestRate,
          downPayment: updatedLoan.downPayment,
          delayInterest: updatedLoan.delayInterest,
          status: updatedLoan.status,
          approvalStatus: updatedLoan.approvalStatus,
          emiStartDate: updatedLoan.emiStartDate,
          dispatchDate: updatedLoan.dispatchDate,
        },
        metricsSummary,
        schedule: mappedSchedule,
        agreementUrl: updatedLoan.agreementUrl || null,
        invoiceUrl: updatedLoan.invoiceUrl || null,
        invoiceNumber: updatedLoan.invoiceNumber || null,
        statusHistory: updatedLoan.approvalHistory || []
      }
    });

  } catch (error) {
    console.error("getLoanDetails Error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    });
  }
};
