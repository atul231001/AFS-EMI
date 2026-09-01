import prisma from '../config/prisma.js';
import ExcelJS from 'exceljs';

export const getPayments = async (req, res) => {
  try {
    const payments = await prisma.payments.findMany({ orderBy: { createdAt: 'desc' } });
    
    // Simulate populate
    const loanIds = payments.map(p => p.loanId).filter(Boolean);
    const loans = await prisma.loans.findMany({ where: { id: { in: loanIds } } });
    
    const customerIds = loans.map(l => l.customerId).filter(Boolean);
    const customers = await prisma.customers.findMany({ where: { id: { in: customerIds } } });
    const custMap = {};
    customers.forEach(c => custMap[c.id] = { ...c, _id: c.id });

    const loanMap = {};
    loans.forEach(l => {
      let lObj = { ...l, _id: l.id };
      if (l.customerId && custMap[l.customerId]) lObj.customerId = custMap[l.customerId];
      loanMap[l.id] = lObj;
    });

    const userIds = payments.map(p => p.uploadedBy).filter(Boolean);
    const users = await prisma.users.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true, customId: true } });
    const userMap = {};
    users.forEach(u => userMap[u.id] = { ...u, _id: u.id });

    const mapped = payments.map(p => {
      let pObj = { ...p, _id: p.id };
      if (p.allocations && typeof p.allocations === 'string') {
        try { pObj.allocations = JSON.parse(p.allocations); } catch(e) {}
      }
      if (p.loanId && loanMap[p.loanId]) pObj.loanId = loanMap[p.loanId];
      if (p.uploadedBy && userMap[p.uploadedBy]) pObj.uploadedBy = userMap[p.uploadedBy];
      return pObj;
    });

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPayment = async (req, res) => {
  const payload = { ...req.body, uploadedBy: req.user ? req.user.id : null };
  try {
    const loan = await prisma.loans.findUnique({ where: { id: req.body.loanId } });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    if (loan.schedule && typeof loan.schedule === 'string') {
      try { loan.schedule = JSON.parse(loan.schedule); } catch(e){}
    }
    if (loan.interestWaiverLogs && typeof loan.interestWaiverLogs === 'string') {
      try { loan.interestWaiverLogs = JSON.parse(loan.interestWaiverLogs); } catch(e){}
    }
    if (!loan.interestWaiverLogs) loan.interestWaiverLogs = [];

    let remainingPayment = req.body.amount || 0;
    const waiveInterest = req.body.waiveInterest || false;
    const waiverReason = req.body.waiverReason || '';
    const delayRate = loan.delayInterest || 24;
    const currentDate = new Date(req.body.date || new Date());
    const allocations = [];

    // Sort schedule by dueDate to ensure consistent chronological order
    loan.schedule.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    for (let i = 0; i < loan.schedule.length; i++) {
      let s = loan.schedule[i];
      if (s.status === 'Paid') continue;

      if (s.outstandingAmount === undefined || s.outstandingAmount === null) {
        s.outstandingAmount = s.emi;
      }

      // 1. Calculate Overdue Interest for this installment
      const dueDate = new Date(s.dueDate);
      let newOverdue = 0;

      const normCurrent = new Date(currentDate); normCurrent.setHours(0,0,0,0);
      const normDue = new Date(dueDate); normDue.setHours(0,0,0,0);

      if (normCurrent > normDue && delayRate > 0) {
        const diffTime = normCurrent - normDue;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const ratePerDay = (delayRate / 100) / 365;

        let baseAmount = s.outstandingAmount;
        if (loan.compoundOverdueInterest) {
          baseAmount += s.overdueInterest;
        }
        newOverdue = Math.round(baseAmount * ratePerDay * diffDays);
      }

      // If overdue interest was previously calculated, we update it.
      // But we shouldn't keep adding if it hasn't been paid. 
      // For simplicity, we just set it to the calculated value if it's higher.
      if (newOverdue > s.overdueInterest) {
        s.overdueInterest = newOverdue;
      }

      // 2. Waive Interest if requested
      if (waiveInterest && s.overdueInterest > 0 && (!req.body.waiveInstallmentNo || (s.installment || (i + 1)) === Number(req.body.waiveInstallmentNo))) {
        loan.interestWaiverLogs.push({
          user: req.user ? req.user.name : 'System',
          date: new Date(),
          amountWaived: s.overdueInterest,
          reason: waiverReason,
          installmentNo: s.installment || (i + 1)
        });
        allocations.push({ installmentNo: s.installment || (i + 1), type: 'Waived Interest', amount: s.overdueInterest });
        s.overdueInterest = 0;
        s.interestWaived = true;
      }

      if (req.body.paymentMethod === 'Waiver') continue;

      if (remainingPayment <= 0) break;

      const startingRemaining = remainingPayment;

      if (s.overdueInterest > 0) {
        const payInterest = Math.min(remainingPayment, s.overdueInterest);
        s.overdueInterest -= payInterest;
        s.paidOverdueInterest = (s.paidOverdueInterest || 0) + payInterest;
        remainingPayment -= payInterest;
        allocations.push({ installmentNo: s.installment || (i + 1), type: 'OverdueInterest', amount: payInterest });
      }

      // Priority 2 & 4: Principal / Outstanding Amount
      if (s.outstandingAmount > 0 && remainingPayment > 0) {
        const payPrincipal = Math.min(remainingPayment, s.outstandingAmount);
        s.outstandingAmount -= payPrincipal;
        s.paidAmount = (s.paidAmount || 0) + payPrincipal;
        remainingPayment -= payPrincipal;
        allocations.push({ installmentNo: s.installment || (i + 1), type: 'Principal', amount: payPrincipal });
      }

      const paymentMadeToThis = startingRemaining > remainingPayment;

      // Check if fully paid or if partial payment should trigger carry-forward
      if (s.outstandingAmount <= 0 && s.overdueInterest <= 0) {
        s.status = 'Paid';
        s.outstandingAmount = 0;
        s.paidDate = currentDate;
      } else if (paymentMadeToThis) {
        s.status = 'Partial';
        s.paidDate = currentDate;
      }

      if (remainingPayment <= 0) break;
    }

    // Advance Payment (Scenario 3)
    // If there is still remaining payment and all current/overdue installments are paid,
    // it will just naturally apply to the next pending installment in the loop above!
    // Because the loop goes through all installments.

    const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    const paymentPayload = {
      id: newId,
      loanId: loan.id,
      amount: req.body.amount,
      date: req.body.date,
      method: req.body.paymentMethod || 'Manual',
      transactionId: req.body.transactionId || req.body.referenceNumber,
      allocations: allocations,
      waiveInterest: req.body.waiveInterest,
      waiverReason: req.body.waiverReason,
      waiveInstallmentNo: req.body.waiveInstallmentNo ? Number(req.body.waiveInstallmentNo) : null,
      uploadedBy: req.user ? req.user.id : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newPayment = await prisma.payments.create({ data: paymentPayload });

    // Recalculate loan totals
    loan.paidAmount = loan.schedule.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    loan.balance = loan.principal - loan.paidAmount;

    await prisma.loans.update({
      where: { id: loan.id },
      data: { 
        schedule: loan.schedule, 
        interestWaiverLogs: loan.interestWaiverLogs,
        paidAmount: loan.paidAmount,
        balance: loan.balance
      }
    });

    res.status(201).json({ ...newPayment, _id: newPayment.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const processExcelRows = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  const results = { total: 0, validRows: [], errorRows: [] };
  if (!worksheet) return results;

  const todayStr = new Date().toISOString().split('T')[0];
  const processedInvoicesToday = new Set();

  const allLoans = await prisma.loans.findMany();
  allLoans.forEach(l => {
    if (l.schedule && typeof l.schedule === 'string') {
      try { l.schedule = JSON.parse(l.schedule); } catch(e){}
    }
    if (l.invoiceData && typeof l.invoiceData === 'string') {
      try { l.invoiceData = JSON.parse(l.invoiceData); } catch(e){}
    }
  });
  const todaysPayments = await prisma.payments.findMany({ where: { date: { startsWith: todayStr } } });

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    if (!row.values || row.values.length === 0) continue;

    // Skip completely empty rows
    const hasData = row.values.some(v => v !== null && v !== undefined && v !== '');
    if (!hasData) continue;

    results.total++;

    const invoiceNumber = row.getCell(1).value?.toString()?.trim();
    const paymentDateVal = row.getCell(2).value;
    const paidAmount = parseFloat(row.getCell(3).value) || 0;
    const transactionId = row.getCell(4).value?.toString()?.trim();
    const remarks = row.getCell(5).value?.toString()?.trim() || '';

    let errorMessage = null;

    let formattedDate = null;
    let rawDateVal = paymentDateVal;
    if (paymentDateVal && typeof paymentDateVal === 'object' && 'result' in paymentDateVal) {
      rawDateVal = paymentDateVal.result;
    }

    if (rawDateVal instanceof Date) {
      formattedDate = new Date(Date.UTC(rawDateVal.getFullYear(), rawDateVal.getMonth(), rawDateVal.getDate()));
    } else if (rawDateVal !== null && rawDateVal !== undefined && rawDateVal !== '') {
      const dateStr = rawDateVal.toString().trim();
      const ymdMatch = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (ymdMatch) {
        const year = parseInt(ymdMatch[1], 10);
        const month = parseInt(ymdMatch[2], 10) - 1;
        const day = parseInt(ymdMatch[3], 10);
        const parsed = new Date(Date.UTC(year, month, day));
        if (!isNaN(parsed.getTime())) formattedDate = parsed;
      } else if (!isNaN(dateStr) && Number(dateStr) > 10000 && Number(dateStr) < 100000) {
        const excelDays = Number(dateStr);
        formattedDate = new Date(Math.round((excelDays - 25569) * 86400 * 1000));
      }
    }
    const uploadedDateStr = formattedDate ? formattedDate.toISOString().split('T')[0] : '';

    const matchingLoans = allLoans.filter(l =>
      l.invoiceNumber === invoiceNumber ||
      l.invoiceData?.invoiceNumber === invoiceNumber ||
      l._id.toString() === invoiceNumber
    );

    let matchedLoan = null;
    if (matchingLoans.length > 0) {
      matchedLoan = matchingLoans.find(l => (l.schedule || []).some(s => s.status !== 'Paid')) || matchingLoans[0];
    }

    let firstPendingEmi = null;

    if (!matchedLoan) {
      errorMessage = 'Invoice not found.';
    } else {
      matchedLoan.schedule.sort((a, b) => a.installment - b.installment);
      firstPendingEmi = (matchedLoan.schedule || []).find(s => s.status !== 'Paid');
      if (!firstPendingEmi) {
        errorMessage = `Loan is already fully paid. No pending installments found.`;
      }
    }

    if (!errorMessage) {
      if (!paymentDateVal) errorMessage = 'Payment Date is mandatory.';
      else if (!formattedDate) errorMessage = `Invalid Payment Date '${rawDateVal}'. Please use strict YYYY-MM-DD format (e.g., 2026-08-08).`;
      else if (paidAmount <= 0) errorMessage = 'Paid Amount must be greater than zero.';
      else if (!transactionId) errorMessage = 'Transaction ID is mandatory.';
    }

    if (!errorMessage) {
      // Prevent duplicate transactions based on transaction ID
      const alreadyPaidToday = todaysPayments.some(p =>
        p.transactionId === transactionId ||
        (p.loanId.toString() === matchedLoan._id.toString() && p.amount === paidAmount && p.date.startsWith(uploadedDateStr))
      );
      if (alreadyPaidToday) {
        errorMessage = `A payment of ${paidAmount} for this invoice was already processed on ${uploadedDateStr}.`;
      }
    }

    const rowData = {
      rowNumber: i,
      invoiceNumber,
      paymentDate: uploadedDateStr,
      paidAmount,
      transactionId,
      remarks,
      loanId: matchedLoan ? matchedLoan._id : null
    };

    if (errorMessage) {
      results.errorRows.push({ ...rowData, errorMessage });
    } else {
      results.validRows.push(rowData);
    }
  }

  return results;
};

export const validateBulkUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const results = await processExcelRows(req.file.buffer);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const importBulkUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const results = await processExcelRows(req.file.buffer);

    let successfulRecords = 0;

    for (const validRow of results.validRows) {
      const loan = await prisma.loans.findUnique({ where: { id: validRow.loanId } });
      if (!loan) continue;
      if (loan.schedule && typeof loan.schedule === 'string') {
        try { loan.schedule = JSON.parse(loan.schedule); } catch(e){}
      }

      let remainingPayment = validRow.paidAmount;
      const currentDate = new Date(validRow.paymentDate);
      const delayRate = loan.delayInterest || 0;
      const allocations = [];

      loan.schedule.sort((a, b) => a.installment - b.installment);

      for (let i = 0; i < loan.schedule.length; i++) {
        let s = loan.schedule[i];
        if (s.status === 'Paid') continue;

        if (s.outstandingAmount === undefined || s.outstandingAmount === null) {
          s.outstandingAmount = s.emi;
        }

        const dueDate = new Date(s.dueDate);
        let newOverdue = 0;

        const normCurrent = new Date(currentDate); normCurrent.setHours(0,0,0,0);
        const normDue = new Date(dueDate); normDue.setHours(0,0,0,0);

        if (normCurrent > normDue && delayRate > 0) {
          const diffTime = normCurrent - normDue;
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          const ratePerDay = (delayRate / 100) / 365;

          let baseAmount = s.outstandingAmount;
          if (loan.compoundOverdueInterest) {
            baseAmount += (s.overdueInterest || 0);
          }
          newOverdue = Math.round(baseAmount * ratePerDay * diffDays);
        }

        if (newOverdue > (s.overdueInterest || 0)) {
          s.overdueInterest = newOverdue;
        }

        if (remainingPayment <= 0) break;

        const startingRemaining = remainingPayment;

        if (s.overdueInterest > 0) {
          const payInterest = Math.min(remainingPayment, s.overdueInterest);
          s.overdueInterest -= payInterest;
          s.paidOverdueInterest = (s.paidOverdueInterest || 0) + payInterest;
          remainingPayment -= payInterest;
          allocations.push({ installmentNo: s.installment || (i + 1), type: 'OverdueInterest', amount: payInterest });
        }

        if (s.outstandingAmount > 0 && remainingPayment > 0) {
          const payPrincipal = Math.min(remainingPayment, s.outstandingAmount);
          s.outstandingAmount -= payPrincipal;
          s.paidAmount = (s.paidAmount || 0) + payPrincipal;
          remainingPayment -= payPrincipal;
          allocations.push({ installmentNo: s.installment || (i + 1), type: 'Principal', amount: payPrincipal });
        }

        const paymentMadeToThis = startingRemaining > remainingPayment;

        if (s.outstandingAmount <= 0 && s.overdueInterest <= 0) {
          s.status = 'Paid';
          s.outstandingAmount = 0;
          s.paidDate = validRow.paymentDate;
        } else if (paymentMadeToThis) {
          s.status = 'Partial';
          s.paidDate = validRow.paymentDate;
        }

        if (remainingPayment <= 0) break;
      }

      const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      const paymentPayload = {
        id: newId,
        loanId: loan.id,
        amount: validRow.paidAmount,
        date: validRow.paymentDate,
        transactionId: validRow.transactionId,
        method: 'Bulk Upload',
        allocations,
        uploadedBy: req.user ? req.user.id : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await prisma.payments.create({ data: paymentPayload });

      // Recalculate loan totals
      loan.paidAmount = loan.schedule.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
      loan.balance = loan.principal - loan.paidAmount;

      await prisma.loans.update({ 
        where: { id: loan.id }, 
        data: { 
          schedule: loan.schedule,
          paidAmount: loan.paidAmount,
          balance: loan.balance
        } 
      });
      successfulRecords++;
    }

    const logId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const logEntryPayload = {
      id: logId,
      fileName: req.file.originalname,
      uploadedBy: req.user.id,
      totalRecords: results.total,
      successfulRecords: successfulRecords,
      failedRecords: results.errorRows.length,
      uploadErrors: results.errorRows.map(e => ({
        rowNumber: e.rowNumber,
        invoiceNumber: e.invoiceNumber,
        emiNumber: e.emiNumber,
        errorMessage: e.errorMessage
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const logEntry = await prisma.bulkuploadlogs.create({ data: logEntryPayload });

    res.status(201).json({
      message: 'Bulk EMI Upload Completed Successfully',
      logId: logEntry.id,
      totalRecords: results.total,
      successfulRecords: successfulRecords,
      failedRecords: results.errorRows.length
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBulkUploadErrorReport = async (req, res) => {
  try {
    const logId = req.params.logId;
    const logEntry = await prisma.bulkuploadlogs.findUnique({ where: { id: logId } });

    if (!logEntry) return res.status(404).json({ message: 'Log not found' });

    let errors = [];
    if (logEntry.uploadErrors && typeof logEntry.uploadErrors === 'string') {
      try { errors = JSON.parse(logEntry.uploadErrors); } catch(e) {}
    } else if (logEntry.uploadErrors) {
      errors = logEntry.uploadErrors;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Error Report');

    worksheet.columns = [
      { header: 'Row Number', key: 'rowNumber', width: 15 },
      { header: 'Invoice Number', key: 'invoiceNumber', width: 25 },
      { header: 'EMI Number', key: 'emiNumber', width: 15 },
      { header: 'Error Message', key: 'errorMessage', width: 40 }
    ];

    errors.forEach(e => {
      worksheet.addRow({
        rowNumber: e.rowNumber,
        invoiceNumber: e.invoiceNumber || 'N/A',
        emiNumber: e.emiNumber || 'N/A',
        errorMessage: e.errorMessage
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Error_Report_${logEntry.fileName}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const revokePayment = async (req, res) => {
  try {
    const payment = await prisma.payments.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status === 'Revoked') return res.status(400).json({ message: 'Payment already revoked' });

    const loan = await prisma.loans.findUnique({ where: { id: payment.loanId } });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    
    if (loan.schedule && typeof loan.schedule === 'string') {
      try { loan.schedule = JSON.parse(loan.schedule); } catch(e){}
    }
    if (loan.interestWaiverLogs && typeof loan.interestWaiverLogs === 'string') {
      try { loan.interestWaiverLogs = JSON.parse(loan.interestWaiverLogs); } catch(e){}
    }
    if (!loan.interestWaiverLogs) loan.interestWaiverLogs = [];
    
    let allocs = [];
    if (payment.allocations && typeof payment.allocations === 'string') {
      try { allocs = JSON.parse(payment.allocations); } catch(e){}
    } else if (payment.allocations) {
      allocs = payment.allocations;
    }

    loan.schedule.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    for (const alloc of allocs) {
      const s = loan.schedule.find((x, i) => (x.installment || (i + 1)) === alloc.installmentNo);
      if (!s) continue;

      if (alloc.type === 'Principal') {
        s.paidAmount = (s.paidAmount || 0) - alloc.amount;
        s.outstandingAmount = (s.outstandingAmount || 0) + alloc.amount;
      } else if (alloc.type === 'OverdueInterest') {
        s.paidOverdueInterest = (s.paidOverdueInterest || 0) - alloc.amount;
        s.overdueInterest = (s.overdueInterest || 0) + alloc.amount;
      } else if (alloc.type === 'Waived Interest') {
        s.interestWaived = false;
        s.overdueInterest = (s.overdueInterest || 0) + alloc.amount;
        loan.interestWaiverLogs = loan.interestWaiverLogs.filter(log => 
          !(log.installmentNo === alloc.installmentNo)
        );
      }

      if ((s.paidAmount || 0) === 0) {
        s.status = 'Pending';
      } else if (s.paidAmount < s.emi) {
        s.status = 'Partial';
      } else {
        s.status = 'Paid';
      }
    }

    loan.paidAmount = loan.schedule.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    loan.balance = loan.principal - loan.paidAmount;
    
    let updatePaymentData = { status: 'Revoked', updatedAt: new Date() };
    if (req.body.revokeRemark) updatePaymentData.revokeRemark = req.body.revokeRemark;

    await prisma.loans.update({ where: { id: loan.id }, data: { schedule: loan.schedule, paidAmount: loan.paidAmount, balance: loan.balance, interestWaiverLogs: loan.interestWaiverLogs } });
    const updatedPayment = await prisma.payments.update({ where: { id: payment.id }, data: updatePaymentData });

    res.json({ message: 'Payment revoked successfully', payment: { ...updatedPayment, _id: updatedPayment.id } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
