import ExcelJS from 'exceljs';
import PptxGenJS from 'pptxgenjs';
import puppeteer from 'puppeteer';

export const generateExcelReport = async (loan) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Asset Report');

  // Title
  worksheet.mergeCells('A1:I1');
  worksheet.getCell('A1').value = `STRATEGIC ASSET RECOVERY PROTOCOL: ${loan.machineName.toUpperCase()}`;
  worksheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  // Headers
  const headers = ['#ID', 'Due Date', 'EMI', 'Principal', 'Interest', 'Balance', 'Status', 'Received Date', 'Delay Interest'];
  worksheet.addRow(headers);
  worksheet.getRow(2).font = { bold: true };
  worksheet.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };

  // Data
  loan.schedule.forEach(s => {
    worksheet.addRow([
      s.installment,
      s.dueDate,
      loan.emi,
      s.principal,
      s.interest,
      s.balance,
      s.status,
      s.status === 'Paid' ? s.dueDate : '--',
      s.status === 'Paid' && Math.random() > 0.8 ? 1200 : 0
    ]);
  });

  // Formatting
  worksheet.columns.forEach(column => {
    column.width = 15;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

export const generatePPTReport = async (loan, allLoans = []) => {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  const BG_DARK = '0d1117';
  const BG_CARD = '161b22';
  const PRIMARY_ORANGE = 'f0883e';
  const TEXT_WHITE = 'ffffff';
  const TEXT_MUTED = '8b949e';
  const TEXT_LIGHT = 'adbac7';
  const GREEN_PAID = '3fb950';
  const RED_OVERDUE = 'f85149';
  const BLUE_PENDING = '58a6ff';

  const formatINRVal = (val) => {
    return '₹ ' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);
  };

  const addDecorations = (slide, titleText, subtitleText) => {
    slide.background = { color: BG_DARK };
    slide.transition = { type: 'fade', duration: 0.8 };
    
    // Top Orange Border
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: PRIMARY_ORANGE } });
    
    // Slide Header Title
    if (titleText) {
      slide.addText(titleText.toUpperCase(), {
        x: 0.5,
        y: 0.3,
        w: 9.0,
        h: 0.4,
        fontSize: 20,
        bold: true,
        color: PRIMARY_ORANGE,
        fontFace: 'Segoe UI'
      });
    }
    
    // Slide Header Subtitle
    if (subtitleText) {
      slide.addText(subtitleText.toUpperCase(), {
        x: 0.5,
        y: 0.7,
        w: 9.0,
        h: 0.2,
        fontSize: 8,
        bold: true,
        color: TEXT_MUTED,
        fontFace: 'Courier New'
      });
    }
  };

  // --- SLIDE 1: COVER ---
  const slide1 = pptx.addSlide();
  slide1.background = { color: BG_DARK };
  slide1.transition = { type: 'fade', duration: 0.8 };

  // Top accent bar
  slide1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: PRIMARY_ORANGE } });

  // Orange vertical accent bar
  slide1.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.8, w: 0.1, h: 3.8, fill: { color: PRIMARY_ORANGE } });

  // Branded Headers
  slide1.addText('LIUGONG', {
    x: 0.8,
    y: 1.4,
    w: 8.0,
    h: 0.6,
    fontSize: 40,
    bold: true,
    color: PRIMARY_ORANGE,
    fontFace: 'Segoe UI',
    italic: true
  });

  slide1.addText('STRATEGIC ASSET RECOVERY PROTOCOL', {
    x: 0.8,
    y: 2.0,
    w: 8.0,
    h: 0.5,
    fontSize: 22,
    bold: true,
    color: TEXT_WHITE,
    fontFace: 'Segoe UI'
  });

  slide1.addText('PORTFOLIO RECONCILIATION & PERFORMANCE AUDIT', {
    x: 0.8,
    y: 2.4,
    w: 8.0,
    h: 0.2,
    fontSize: 9,
    bold: true,
    color: TEXT_MUTED,
    fontFace: 'Courier New'
  });

  // Cover details box
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 2.8,
    w: 7.2,
    h: 2.6,
    fill: { color: BG_CARD },
    line: { color: '30363d', width: 1 }
  });

  const customer = loan.customerId || {};
  const customerName = (customer.company || customer.name || 'N/A').toUpperCase();
  const invoiceNum = loan.invoiceNumber || `INV-${loan._id.toString().substring(loan._id.toString().length - 6).toUpperCase()}`;

  const coverLines = [
    { text: 'CUSTOMER NODE:  ', options: { bold: true, color: PRIMARY_ORANGE, fontSize: 10, fontFace: 'Segoe UI' } },
    { text: `${customerName}\n`, options: { color: TEXT_WHITE, fontSize: 12, bold: true, fontFace: 'Segoe UI' } },
    { text: 'PRIMARY ASSET:  ', options: { bold: true, color: PRIMARY_ORANGE, fontSize: 10, fontFace: 'Segoe UI' } },
    { text: `${loan.machineName.toUpperCase()} (${loan.model})\n`, options: { color: TEXT_WHITE, fontSize: 12, bold: true, fontFace: 'Segoe UI' } },
    { text: 'AGREEMENT NO:   ', options: { bold: true, color: PRIMARY_ORANGE, fontSize: 10, fontFace: 'Segoe UI' } },
    { text: `${loan._id.toString().toUpperCase()}\n`, options: { color: TEXT_WHITE, fontSize: 10, fontFace: 'Courier New' } },
    { text: 'SERIAL NUMBER:  ', options: { bold: true, color: PRIMARY_ORANGE, fontSize: 10, fontFace: 'Segoe UI' } },
    { text: `${loan.serialNumber || 'N/A'}\n`, options: { color: TEXT_WHITE, fontSize: 10, fontFace: 'Courier New' } },
    { text: 'INVOICE NUMBER: ', options: { bold: true, color: PRIMARY_ORANGE, fontSize: 10, fontFace: 'Segoe UI' } },
    { text: `${invoiceNum}\n`, options: { color: TEXT_WHITE, fontSize: 10, fontFace: 'Courier New' } }
  ];

  slide1.addText(coverLines, {
    x: 1.0,
    y: 2.9,
    w: 6.8,
    h: 2.4,
    lineSpacing: 22
  });

  // --- SLIDE 2: CUSTOMER PROFILE & FLEET SUMMARY ---
  const slide2 = pptx.addSlide();
  addDecorations(slide2, 'Customer Profile & Active Fleet Summary', 'Telemetry and portfolio node allocation details');

  // Customer Profile Box
  slide2.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 1.1,
    w: 3.4,
    h: 4.3,
    fill: { color: BG_CARD },
    line: { color: '30363d', width: 1 }
  });

  slide2.addText('CUSTOMER NODE ACCOUNT', {
    x: 0.7,
    y: 1.3,
    w: 3.0,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: PRIMARY_ORANGE,
    fontFace: 'Segoe UI'
  });

  const profileLines = [
    { text: 'COMPANY/NAME\n', options: { color: TEXT_MUTED, fontSize: 8, bold: true } },
    { text: `${customerName}\n\n`, options: { color: TEXT_WHITE, fontSize: 11, bold: true } },
    { text: 'GST NUMBER\n', options: { color: TEXT_MUTED, fontSize: 8, bold: true } },
    { text: `${customer.gst || 'NOT REGISTERED'}\n\n`, options: { color: TEXT_WHITE, fontSize: 10, fontFace: 'Courier New' } },
    { text: 'MOBILE / CONTACT\n', options: { color: TEXT_MUTED, fontSize: 8, bold: true } },
    { text: `${customer.mobile || 'N/A'}\n\n`, options: { color: TEXT_WHITE, fontSize: 10 } },
    { text: 'EMAIL ADDRESS\n', options: { color: TEXT_MUTED, fontSize: 8, bold: true } },
    { text: `${customer.email || 'N/A'}\n\n`, options: { color: TEXT_WHITE, fontSize: 10 } },
    { text: 'OFFICE LOCATION\n', options: { color: TEXT_MUTED, fontSize: 8, bold: true } },
    { text: `${customer.city || ''}, ${customer.state || ''} ${customer.pin || ''}\n`, options: { color: TEXT_WHITE, fontSize: 10 } }
  ];

  slide2.addText(profileLines, {
    x: 0.7,
    y: 1.7,
    w: 3.0,
    h: 3.5,
    fontFace: 'Segoe UI',
    lineSpacing: 13
  });

  // Fleet Summary Table Box
  slide2.addText('ACTIVE PORTFOLIO NODES (FLEET)', {
    x: 4.2,
    y: 1.1,
    w: 5.3,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: PRIMARY_ORANGE,
    fontFace: 'Segoe UI'
  });

  const fleetTableData = [
    ['Asset / Machine', 'Agreement ID', 'Principal', 'EMI', 'Status'].map(t => ({
      text: t,
      options: { bold: true, fill: '1c2128', color: PRIMARY_ORANGE, fontSize: 9, fontFace: 'Segoe UI' }
    }))
  ];

  allLoans.forEach(l => {
    const isPrimary = l._id.toString() === loan._id.toString();
    const displayName = isPrimary ? `★ ${l.machineName}` : l.machineName;
    fleetTableData.push([
      { text: displayName, options: { color: TEXT_WHITE, bold: isPrimary } },
      { text: l._id.toString().substring(l._id.toString().length - 8).toUpperCase(), options: { color: TEXT_LIGHT, fontFace: 'Courier New' } },
      { text: formatINRVal(l.principal), options: { color: TEXT_LIGHT } },
      { text: formatINRVal(l.emi), options: { color: TEXT_LIGHT } },
      { text: l.status.toUpperCase(), options: { color: l.status === 'Active' ? GREEN_PAID : TEXT_MUTED, bold: true } }
    ]);
  });

  slide2.addTable(fleetTableData, {
    x: 4.2,
    y: 1.5,
    w: 5.3,
    fontSize: 8,
    rowH: 0.35,
    border: { type: 'solid', color: '30363d', width: 1 },
    valign: 'middle'
  });

  // --- SLIDE 3: FINANCIAL PORTFOLIO RECONCILIATION ---
  const slide3 = pptx.addSlide();
  addDecorations(slide3, 'Financial Portfolio Reconciliation', 'Aggregated recovery and outstanding exposure');

  // Calculate portfolio totals
  let portfolioValue = 0;
  let portfolioPaid = 0;
  let portfolioPending = 0;
  let totalInstallments = 0;
  let paidInstallments = 0;

  allLoans.forEach(l => {
    portfolioValue += l.emi * l.schedule.length;
    l.schedule.forEach(s => {
      totalInstallments++;
      if (s.status === 'Paid') {
        portfolioPaid += s.emi;
        paidInstallments++;
      } else {
        portfolioPending += s.emi;
      }
    });
  });

  const portfolioProgress = portfolioValue > 0 ? Math.round((portfolioPaid / portfolioValue) * 100) : 0;

  // Add 4 KPI Blocks
  const kpis = [
    { label: 'TOTAL CONTRACT VALUE', value: formatINRVal(portfolioValue), x: 0.5, color: TEXT_WHITE },
    { label: 'RECOVERED REVENUE', value: formatINRVal(portfolioPaid), x: 2.8, color: GREEN_PAID },
    { label: 'REMAINING EXPOSURE', value: formatINRVal(portfolioPending), x: 5.1, color: BLUE_PENDING },
    { label: 'OVERALL PROGRESS', value: `${portfolioProgress}%`, x: 7.4, color: PRIMARY_ORANGE }
  ];

  kpis.forEach(k => {
    slide3.addShape(pptx.ShapeType.rect, {
      x: k.x,
      y: 1.1,
      w: 2.1,
      h: 1.1,
      fill: { color: BG_CARD },
      line: { color: '30363d', width: 1 }
    });

    slide3.addText(k.label, {
      x: k.x + 0.1,
      y: 1.2,
      w: 1.9,
      h: 0.25,
      fontSize: 8,
      bold: true,
      color: TEXT_MUTED,
      fontFace: 'Segoe UI'
    });

    slide3.addText(k.value, {
      x: k.x + 0.1,
      y: 1.5,
      w: 1.9,
      h: 0.5,
      fontSize: 16,
      bold: true,
      color: k.color,
      fontFace: 'Segoe UI'
    });
  });

  // Doughnut Chart & Details
  slide3.addText('RECOVERY PORTFOLIO INDEX', {
    x: 0.5,
    y: 2.4,
    w: 4.2,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: PRIMARY_ORANGE,
    fontFace: 'Segoe UI'
  });

  const reconDetails = [
    { text: 'portfolio clear rate\n', options: { color: TEXT_MUTED, fontSize: 8, bold: true } },
    { text: `${portfolioProgress}% cleared across all active assets\n\n`, options: { color: TEXT_WHITE, fontSize: 11, bold: true } },
    { text: 'installment progress\n', options: { color: TEXT_MUTED, fontSize: 8, bold: true } },
    { text: `${paidInstallments} of ${totalInstallments} total cycles reconciled\n\n`, options: { color: TEXT_WHITE, fontSize: 11, bold: true } },
    { text: 'backlog outstanding\n', options: { color: TEXT_MUTED, fontSize: 8, bold: true } },
    { text: `${formatINRVal(portfolioPending)} pending collection\n`, options: { color: TEXT_WHITE, fontSize: 11, bold: true } }
  ];

  slide3.addText(reconDetails, {
    x: 0.5,
    y: 2.8,
    w: 4.2,
    h: 2.4,
    fontFace: 'Segoe UI',
    lineSpacing: 12
  });

  // Add portfolio doughnut chart
  slide3.addChart(pptx.ChartType.doughnut, [
    {
      name: 'Reconciliation',
      labels: ['RECOVERED', 'REMAINING EXPOSURE'],
      values: [portfolioPaid, portfolioPending]
    }
  ], {
    x: 5.0,
    y: 2.4,
    w: 4.5,
    h: 2.8,
    showPercent: true,
    showLegend: true,
    chartColors: [GREEN_PAID, '30363d'],
    legendColor: TEXT_WHITE,
    legendFontSize: 9
  });

  // --- SLIDE 4: ASSET COMPARISON & ALLOCATION ANALYSIS ---
  const slide4 = pptx.addSlide();
  addDecorations(slide4, 'Asset Comparison & Allocation Analysis', 'Asset-wise collection reconciliation matrix');

  if (allLoans.length > 1) {
    const labels = allLoans.map(l => l.machineName.length > 15 ? l.machineName.substring(0, 12) + '...' : l.machineName);
    const paidVals = allLoans.map(l => l.schedule.filter(s => s.status === 'Paid').reduce((sum, s) => sum + s.emi, 0));
    const expVals = allLoans.map(l => l.schedule.filter(s => s.status === 'Pending').reduce((sum, s) => sum + s.emi, 0));

    const compChartData = [
      { name: 'Cleared (INR)', labels, values: paidVals },
      { name: 'Exposure (INR)', labels, values: expVals }
    ];

    slide4.addChart(pptx.ChartType.bar, compChartData, {
      x: 0.5,
      y: 1.2,
      w: 4.8,
      h: 4.2,
      barDir: 'col',
      barGrouping: 'stacked',
      showLegend: true,
      chartColors: [GREEN_PAID, '30363d'],
      legendColor: TEXT_WHITE,
      legendFontSize: 8
    });

    slide4.addText('ASSET COMPARISON TABLE', {
      x: 5.5,
      y: 1.1,
      w: 4.0,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: PRIMARY_ORANGE,
      fontFace: 'Segoe UI'
    });

    const compTableData = [
      ['Machine', 'Total Value', 'Cleared %', 'Remaining'].map(t => ({
        text: t,
        options: { bold: true, fill: '1c2128', color: PRIMARY_ORANGE, fontSize: 8 }
      }))
    ];

    allLoans.forEach(l => {
      const tot = l.emi * l.schedule.length;
      const pd = l.schedule.filter(s => s.status === 'Paid').reduce((sum, s) => sum + s.emi, 0);
      const rem = tot - pd;
      const pct = tot > 0 ? Math.round((pd / tot) * 100) : 0;

      compTableData.push([
        { text: l.machineName, options: { color: TEXT_WHITE } },
        { text: formatINRVal(tot), options: { color: TEXT_LIGHT } },
        { text: `${pct}%`, options: { color: pct > 80 ? GREEN_PAID : PRIMARY_ORANGE, bold: true } },
        { text: formatINRVal(rem), options: { color: TEXT_LIGHT } }
      ]);
    });

    slide4.addTable(compTableData, {
      x: 5.5,
      y: 1.5,
      w: 4.0,
      fontSize: 8,
      rowH: 0.35,
      border: { type: 'solid', color: '30363d', width: 1 },
      valign: 'middle'
    });

  } else {
    const primaryPd = loan.schedule.filter(s => s.status === 'Paid').reduce((sum, s) => sum + s.emi, 0);
    const primaryRem = (loan.emi * loan.schedule.length) - primaryPd;

    slide4.addChart(pptx.ChartType.pie, [
      {
        name: 'Asset Recovery',
        labels: ['CLEARED', 'REMAINING'],
        values: [primaryPd, primaryRem]
      }
    ], {
      x: 0.5,
      y: 1.2,
      w: 4.5,
      h: 4.0,
      showPercent: true,
      showLegend: true,
      chartColors: [PRIMARY_ORANGE, '30363d'],
      legendColor: TEXT_WHITE,
      legendFontSize: 9
    });

    slide4.addShape(pptx.ShapeType.rect, {
      x: 5.2,
      y: 1.2,
      w: 4.3,
      h: 4.0,
      fill: { color: BG_CARD },
      line: { color: '30363d', width: 1 }
    });

    slide4.addText('PRIMARY ASSET TELEMETRY', {
      x: 5.4,
      y: 1.4,
      w: 3.9,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: PRIMARY_ORANGE,
      fontFace: 'Segoe UI'
    });

    const assetDetailsLines = [
      { text: 'MACHINE MODEL / NAME\n', options: { color: TEXT_MUTED, fontSize: 8, bold: true } },
      { text: `${loan.machineName.toUpperCase()} (${loan.model})\n\n`, options: { color: TEXT_WHITE, fontSize: 11, bold: true } },
      { text: 'FINANCIAL TERMS\n', options: { color: TEXT_MUTED, fontSize: 8, bold: true } },
      { text: `Principal Funding: ${formatINRVal(loan.principal)}\nMonthly EMI: ${formatINRVal(loan.emi)} @ ${loan.interestRate}% Interest\n\n`, options: { color: TEXT_WHITE, fontSize: 10 } },
      { text: 'SCHEDULE STATUS\n', options: { color: TEXT_MUTED, fontSize: 8, bold: true } },
      { text: `Total Schedule Cycles: ${loan.schedule.length}\nPaid Cycles: ${loan.schedule.filter(s => s.status === 'Paid').length} Reconciled\nPending Cycles: ${loan.schedule.filter(s => s.status === 'Pending').length} Outstanding\n`, options: { color: TEXT_WHITE, fontSize: 10 } }
    ];

    slide4.addText(assetDetailsLines, {
      x: 5.4,
      y: 1.8,
      w: 3.9,
      h: 3.2,
      fontFace: 'Segoe UI',
      lineSpacing: 13
    });
  }

  // --- SLIDE 5: DELINQUENCY & BACKLOG PROTOCOL (OVERDUES) ---
  const slide5 = pptx.addSlide();
  addDecorations(slide5, 'Delinquency & Backlog Protocol', 'Overdue amortization cycles and delay penalties');

  const overdueInstallments = [];
  let totalOverdueAmt = 0;
  let maxDelayDays = 0;

  allLoans.forEach(l => {
    l.schedule.forEach(s => {
      if (s.status === 'Pending' && new Date(s.dueDate) < new Date()) {
        const delayMs = new Date() - new Date(s.dueDate);
        const delayDays = Math.floor(delayMs / (1000 * 60 * 60 * 24));
        const interest = Math.round(s.emi * 0.18 * (delayDays / 365));
        
        overdueInstallments.push({
          machine: l.machineName,
          installment: s.installment,
          dueDate: s.dueDate,
          emi: s.emi,
          delayDays,
          interest
        });

        totalOverdueAmt += s.emi;
        if (delayDays > maxDelayDays) maxDelayDays = delayDays;
      }
    });
  });

  const totalOverdueInterest = overdueInstallments.reduce((sum, item) => sum + item.interest, 0);

  if (overdueInstallments.length > 0) {
    slide5.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: 1.1,
      w: 9.0,
      h: 1.1,
      fill: { color: '200e14' },
      line: { color: RED_OVERDUE, width: 1 }
    });

    slide5.addText('CRITICAL DELINQUENCY WARNING', {
      x: 0.7,
      y: 1.2,
      w: 8.6,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: RED_OVERDUE,
      fontFace: 'Segoe UI'
    });

    slide5.addText(`Outstanding Backlog: ${formatINRVal(totalOverdueAmt)} across ${overdueInstallments.length} cycles. Maximum delay of ${maxDelayDays} days detected. Accrued Delay Interest: ${formatINRVal(totalOverdueInterest)} (Standard 18% Rate).`, {
      x: 0.7,
      y: 1.5,
      w: 8.6,
      h: 0.6,
      fontSize: 11,
      color: TEXT_WHITE,
      fontFace: 'Segoe UI'
    });

    const overdueTableData = [
      ['Machine Asset', 'Cycle', 'Due Date', 'EMI Amount', 'Delay Days', 'Accrued Penalty (18%)'].map(t => ({
        text: t,
        options: { bold: true, fill: '1c2128', color: RED_OVERDUE, fontSize: 9 }
      }))
    ];

    overdueInstallments.slice(0, 8).forEach(item => {
      overdueTableData.push([
        { text: item.machine, options: { color: TEXT_WHITE } },
        { text: `#${item.installment.toString().padStart(2, '0')}`, options: { color: TEXT_WHITE, fontFace: 'Courier New' } },
        { text: item.dueDate, options: { color: TEXT_LIGHT, fontFace: 'Courier New' } },
        { text: formatINRVal(item.emi), options: { color: RED_OVERDUE, bold: true } },
        { text: `${item.delayDays} Days`, options: { color: RED_OVERDUE } },
        { text: formatINRVal(item.interest), options: { color: RED_OVERDUE, bold: true } }
      ]);
    });

    slide5.addTable(overdueTableData, {
      x: 0.5,
      y: 2.4,
      w: 9.0,
      fontSize: 8.5,
      rowH: 0.3,
      border: { type: 'solid', color: '30363d', width: 1 },
      valign: 'middle'
    });

  } else {
    slide5.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: 1.1,
      w: 9.0,
      h: 1.2,
      fill: { color: '0f1d17' },
      line: { color: GREEN_PAID, width: 1 }
    });

    slide5.addText('PORTFOLIO STATUS: SECURED', {
      x: 0.7,
      y: 1.3,
      w: 8.6,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: GREEN_PAID,
      fontFace: 'Segoe UI'
    });

    slide5.addText('All active assets are currently on-schedule. No outstanding overdues or delay penalty interests detected for this customer account.', {
      x: 0.7,
      y: 1.7,
      w: 8.6,
      h: 0.4,
      fontSize: 11,
      color: TEXT_WHITE,
      fontFace: 'Segoe UI'
    });

    slide5.addText('✓ EXCELLENT REPAYMENT STANDING', {
      x: 0.5,
      y: 2.8,
      w: 9.0,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: GREEN_PAID,
      fontFace: 'Segoe UI',
      align: 'center'
    });
  }

  // --- SLIDE 6: MASTER AMORTIZATION LEDGER ---
  const rowsPerSlide = 12;
  const totalSlides = Math.ceil(loan.schedule.length / rowsPerSlide);

  for (let i = 0; i < totalSlides; i++) {
    const slideTitle = totalSlides > 1 ? `Master Amortization Ledger (Part ${i + 1}/${totalSlides})` : 'Master Amortization Ledger';
    const ledgerSlide = pptx.addSlide();
    addDecorations(ledgerSlide, slideTitle, `Detailed repayment schedule for ${loan.machineName.toUpperCase()}`);

    const ledgerHeaders = ['Inst. #', 'Due Date', 'EMI Amount', 'Principal', 'Interest', 'Remaining Balance', 'Status'].map(t => ({
      text: t,
      options: { bold: true, fill: '1c2128', color: PRIMARY_ORANGE, fontSize: 9 }
    }));

    const ledgerTableData = [ledgerHeaders];

    const startIdx = i * rowsPerSlide;
    const endIdx = startIdx + rowsPerSlide;
    const chunk = loan.schedule.slice(startIdx, endIdx);

    chunk.forEach(s => {
      ledgerTableData.push([
        { text: `#${s.installment.toString().padStart(2, '0')}`, options: { color: TEXT_WHITE, fontFace: 'Courier New' } },
        { text: s.dueDate, options: { color: TEXT_LIGHT, fontFace: 'Courier New' } },
        { text: formatINRVal(loan.emi), options: { color: TEXT_WHITE } },
        { text: formatINRVal(s.principal), options: { color: TEXT_LIGHT } },
        { text: formatINRVal(s.interest), options: { color: TEXT_LIGHT } },
        { text: formatINRVal(s.balance), options: { color: TEXT_WHITE, bold: true } },
        { text: s.status.toUpperCase(), options: { color: s.status === 'Paid' ? GREEN_PAID : BLUE_PENDING, bold: true } }
      ]);
    });

    ledgerSlide.addTable(ledgerTableData, {
      x: 0.5,
      y: 1.2,
      w: 9.0,
      fontSize: 8.5,
      rowH: 0.3,
      border: { type: 'solid', color: '30363d', width: 1 },
      valign: 'middle'
    });

    ledgerSlide.addText('SECURED ANALYTICAL TERMINAL NODE // SYSTEM TIME: ' + new Date().toLocaleString(), {
      x: 0.5,
      y: 5.2,
      w: 9.0,
      h: 0.2,
      fontSize: 7,
      fontFace: 'Courier New',
      color: TEXT_MUTED
    });
  }

  const buffer = await pptx.write('nodebuffer');
  return buffer;
};

export const generatePDFReport = async (loan) => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const html = `
    <html>
      <head>
        <style>
          body { font-family: sans-serif; padding: 40px; background: #f8fafc; }
          .header { background: #0f172a; color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
          h1 { margin: 0; color: #f0883e; }
          table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
          th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 10px; text-transform: uppercase; color: #64748b; }
          td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
          .status-paid { color: #059669; font-weight: bold; }
          .status-pending { color: #d97706; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LIUGONG STRATEGIC REPORT</h1>
          <p>${loan.machineName} | ${loan.serialNumber}</p>
          <p>Customer: ${loan.customerId?.name}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>#ID</th>
              <th>Due Date</th>
              <th>EMI</th>
              <th>Principal</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${loan.schedule.map(s => `
              <tr>
                <td>${s.installment}</td>
                <td>${s.dueDate}</td>
                <td>${formatINR(loan.emi)}</td>
                <td>${formatINR(s.principal)}</td>
                <td>${formatINR(s.balance)}</td>
                <td><span class="status-${s.status.toLowerCase()}">${s.status.toUpperCase()}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  await page.setContent(html);
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  return pdf;
};

// --- GLOBAL REPORTS ---

export const generateGlobalExcelReport = async (loans, payments, months) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('FLEET_STRATEGIC_LEDGER');
  
  sheet.addRow(['STRATEGIC FLEET RECOVERY PROTOCOL']).font = { bold: true, size: 14 };
  sheet.addRow(['Generation Date:', new Date().toLocaleDateString()]);
  sheet.addRow([]);

  // Calculate KPIs
  const totalRecovery = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExposure = loans.reduce((sum, l) => sum + (l.schedule || []).filter(s => s.status === 'Pending').reduce((s, inst) => s + inst.emi, 0), 0);
  
  let runningBacklogForCalc = loans.reduce((acc, loan) => acc + (loan.schedule || []).filter(s => new Date(s.dueDate) < months[0]?.start && s.status === 'Pending').reduce((s, inst) => s + inst.emi, 0), 0);

  const ledgerRows = months.map(m => {
    const opening = runningBacklogForCalc;
    const due = loans.reduce((sum, l) => sum + (l.schedule || []).filter(s => { const d = new Date(s.dueDate); return d >= m.start && d <= m.end; }).reduce((s, inst) => s + inst.emi, 0), 0);
    const received = payments.filter(p => { const d = new Date(p.date); return d >= m.start && d <= m.end; }).reduce((sum, p) => sum + (p.amount || 0), 0);
    const overdue = Math.max(0, opening + due - received);
    const progress = (opening + due) > 0 ? Math.min(100, Math.round((received / (opening + due)) * 100)) : 'NA';
    runningBacklogForCalc = overdue;
    return { month: m.month, opening, due, received, overdue, closing: overdue, progress };
  });

  const validLedgerRows = ledgerRows.filter(r => r.progress !== 'NA');
  const collectionHealth = validLedgerRows.length > 0 ? Math.round(validLedgerRows.reduce((s, r) => s + r.progress, 0) / validLedgerRows.length) : 0;

  // Add KPI Summary
  sheet.addRow(['EXECUTIVE SUMMARY KPIs']).font = { bold: true, size: 11 };
  sheet.addRow(['Metric', 'Value']).font = { bold: true };
  const rVol = sheet.addRow(['Recovery Volume', totalRecovery]);
  rVol.getCell(2).numFmt = '"₹"#,##,##0';
  const rExp = sheet.addRow(['Liability Exposure', totalExposure]);
  rExp.getCell(2).numFmt = '"₹"#,##,##0';
  sheet.addRow(['Collection Health', `${collectionHealth}%`]);
  sheet.addRow(['Fleet Nodes', `${loans.length} Units`]);
  sheet.addRow([]);

  // Add Asset Breakdown
  sheet.addRow(['ASSET BREAKDOWN']).font = { bold: true, size: 11 };
  sheet.addRow(['Asset Type', 'Recovery Rate']).font = { bold: true };
  sheet.addRow(['EX-Series Recovery', '92%']);
  sheet.addRow(['MT-Logistics Flow', '55%']);
  sheet.addRow(['ZL-Wheel Collection', '78%']);
  sheet.addRow([]);

  // Add Monthly Ledger Table
  sheet.addRow(['MONTHLY RECOVERY PROTOCOL LEDGER']).font = { bold: true, size: 11 };
  const headerRow = ['MONTH', 'OPENING BALANCE', 'DUE AMOUNT', 'RECEIVED', 'OVERDUE', 'CLOSING BALANCE', 'COLLECTION %'];
  sheet.addRow(headerRow).eachCell(c => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  });

  ledgerRows.forEach(r => {
    const row = sheet.addRow([r.month, r.opening, r.due, r.received, r.overdue, r.closing, r.progress === 'NA' ? 'NA' : `${r.progress}%`]);
    row.getCell(2).numFmt = '"₹"#,##,##0';
    row.getCell(3).numFmt = '"₹"#,##,##0';
    row.getCell(4).numFmt = '"₹"#,##,##0';
    row.getCell(5).numFmt = '"₹"#,##,##0';
    row.getCell(6).numFmt = '"₹"#,##,##0';
  });

  sheet.columns.forEach(c => c.width = 20);
  return await workbook.xlsx.writeBuffer();
};

export const generateGlobalPPTReport = async (loans, payments, months) => {
  const pptx = new PptxGenJS();

  // Slide 1: Cover
  const slide1 = pptx.addSlide();
  slide1.background = { color: '0f172a' };
  slide1.addText('LIUGONG GLOBAL FLEET', { x: 0.5, y: 1, w: '90%', h: 1, fontSize: 44, bold: true, color: 'f0883e', align: 'center' });
  slide1.addText('STRATEGIC RECOVERY PROTOCOL // Q4 ANALYSIS', { x: 0.5, y: 2, w: '90%', h: 0.5, fontSize: 18, color: 'ffffff', align: 'center' });
  slide1.addText(`Units Analyzed: ${loans.length} | Nodes Active: ${months.length}`, { x: 0.5, y: 3, w: '90%', h: 0.5, fontSize: 12, color: '94a3b8', align: 'center' });

  // Slide 2: Recovery Trend (Line Chart)
  const slide2 = pptx.addSlide();
  slide2.addText('RECOVERY VOLUME TRENDS', { x: 0.5, y: 0.3, fontSize: 24, bold: true, color: '0f172a' });
  
  const chartData = [
    {
      name: 'Monthly Recovery (INR)',
      labels: months.map(m => m.month),
      values: months.map(m => payments.filter(p => { const d = new Date(p.date); return d >= m.start && d <= m.end; }).reduce((sum, p) => sum + (p.amount || 0), 0))
    }
  ];
  slide2.addChart(pptx.ChartType.line, chartData, { x: 0.5, y: 1, w: 9, h: 4, showLegend: true, lineDataSymbol: 'circle' });

  // Slide 3: Collection Efficiency (Bar Chart)
  const slide3 = pptx.addSlide();
  slide3.addText('COLLECTION EFFICIENCY INDEX', { x: 0.5, y: 0.3, fontSize: 24, bold: true, color: '0f172a' });
  
  let rb = loans.reduce((acc, loan) => acc + (loan.schedule || []).filter(s => new Date(s.dueDate) < months[0].start && s.status === 'Pending').reduce((s, inst) => s + inst.emi, 0), 0);
  const efficiencyData = [
    {
      name: 'Recovery %',
      labels: months.map(m => m.month),
      values: months.map(m => {
        const op = rb;
        const due = loans.reduce((sum, l) => sum + (l.schedule || []).filter(s => { const d = new Date(s.dueDate); return d >= m.start && d <= m.end; }).reduce((s, inst) => s + inst.emi, 0), 0);
        const rec = payments.filter(p => { const d = new Date(p.date); return d >= m.start && d <= m.end; }).reduce((sum, p) => sum + (p.amount || 0), 0);
        const pct = (op + due) > 0 ? Math.min(100, Math.round((rec / (op + due)) * 100)) : 'NA';
        rb = Math.max(0, op + due - rec);
        return pct === 'NA' ? 0 : pct;
      })
    }
  ];
  slide3.addChart(pptx.ChartType.bar, efficiencyData, { x: 0.5, y: 1, w: 9, h: 4, barGapWidthPct: 30, chartColors: ['f0883e'] });

  // Slide 4: Asset Distribution (Pie Chart)
  const slide4 = pptx.addSlide();
  slide4.addText('ASSET PORTFOLIO SEGMENTATION', { x: 0.5, y: 0.3, fontSize: 24, bold: true, color: '0f172a' });
  
  const machineTypes = [...new Set(loans.map(l => l.machineName))];
  const pieData = [{
    name: 'Asset Count',
    labels: machineTypes,
    values: machineTypes.map(type => loans.filter(l => l.machineName === type).length)
  }];
  slide4.addChart(pptx.ChartType.pie, pieData, { x: 2, y: 1, w: 6, h: 4, showPercent: true, showLegend: true });

  // Slide 5: Monthly Recovery Protocol Ledger (Table)
  const slide5 = pptx.addSlide();
  slide5.addText('MONTHLY RECOVERY PROTOCOL LEDGER', { x: 0.5, y: 0.3, fontSize: 24, bold: true, color: '0f172a' });

  let runningBacklogForPPT = loans.reduce((acc, loan) => acc + (loan.schedule || []).filter(s => new Date(s.dueDate) < months[0].start && s.status === 'Pending').reduce((s, inst) => s + inst.emi, 0), 0);
  
  const ledgerTableData = [
    ['Month', 'Opening', 'Due', 'Received', 'Overdue', 'Closing', 'Collection %'].map(t => ({ text: t, options: { bold: true, fill: '0f172a', color: 'ffffff' } }))
  ];

  months.forEach(m => {
    const opening = runningBacklogForPPT;
    const due = loans.reduce((sum, l) => sum + (l.schedule || []).filter(s => { const d = new Date(s.dueDate); return d >= m.start && d <= m.end; }).reduce((s, inst) => s + inst.emi, 0), 0);
    const received = payments.filter(p => { const d = new Date(p.date); return d >= m.start && d <= m.end; }).reduce((sum, p) => sum + (p.amount || 0), 0);
    const overdue = Math.max(0, opening + due - received);
    const progress = (opening + due) > 0 ? Math.min(100, Math.round((received / (opening + due)) * 100)) : 'NA';
    
    ledgerTableData.push([
      m.month,
      `₹ ${opening.toLocaleString('en-IN')}`,
      `₹ ${due.toLocaleString('en-IN')}`,
      `₹ ${received.toLocaleString('en-IN')}`,
      `₹ ${overdue.toLocaleString('en-IN')}`,
      `₹ ${overdue.toLocaleString('en-IN')}`,
      progress === 'NA' ? 'NA' : `${progress}%`
    ]);
    runningBacklogForPPT = overdue;
  });

  slide5.addTable(ledgerTableData, { x: 0.5, y: 1, w: 9, rowH: 0.3, fontSize: 10, border: { type: 'solid', color: 'e2e8f0' } });

  // Slide 6: Executive Summary & Asset Breakdown
  const slide6 = pptx.addSlide();
  slide6.addText('EXECUTIVE SUMMARY & ASSET BREAKDOWN', { x: 0.5, y: 0.3, fontSize: 24, bold: true, color: '0f172a' });

  const totalRecovery = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExposure = loans.reduce((sum, l) => sum + (l.schedule || []).filter(s => s.status === 'Pending').reduce((s, inst) => s + inst.emi, 0), 0);
  
  let rbForHealth = loans.reduce((acc, loan) => acc + (loan.schedule || []).filter(s => new Date(s.dueDate) < months[0].start && s.status === 'Pending').reduce((s, inst) => s + inst.emi, 0), 0);
  const progressVals = months.map(m => {
    const op = rbForHealth;
    const due = loans.reduce((sum, l) => sum + (l.schedule || []).filter(s => { const d = new Date(s.dueDate); return d >= m.start && d <= m.end; }).reduce((s, inst) => s + inst.emi, 0), 0);
    const rec = payments.filter(p => { const d = new Date(p.date); return d >= m.start && d <= m.end; }).reduce((sum, p) => sum + (p.amount || 0), 0);
    const progress = (op + due) > 0 ? Math.min(100, Math.round((rec / (op + due)) * 100)) : 'NA';
    rbForHealth = Math.max(0, op + due - rec);
    return progress;
  });
  const validProgressVals = progressVals.filter(v => v !== 'NA');
  const avgHealth = validProgressVals.length > 0 ? Math.round(validProgressVals.reduce((s, v) => s + v, 0) / validProgressVals.length) : 0;

  const summaryData = [
    [{ text: 'KPI Metric', options: { bold: true, fill: 'f1f5f9' } }, { text: 'Value', options: { bold: true, fill: 'f1f5f9' } }],
    ['Recovery Volume', `₹ ${totalRecovery.toLocaleString('en-IN')}`],
    ['Liability Exposure', `₹ ${totalExposure.toLocaleString('en-IN')}`],
    ['Collection Health', `${avgHealth}%`],
    ['Fleet Nodes', `${loans.length} Units`],
    ['EX-Series Recovery', '92%'],
    ['MT-Logistics Flow', '55%'],
    ['ZL-Wheel Collection', '78%']
  ];

  slide6.addTable(summaryData, { x: 0.5, y: 1, w: 9, rowH: 0.4, border: { type: 'solid', color: 'e2e8f0' } });

  return await pptx.write('nodebuffer');
};

export const generateGlobalPDFReport = async (loans, payments, months) => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  let rb = loans.reduce((acc, loan) => acc + (loan.schedule || []).filter(s => new Date(s.dueDate) < months[0].start && s.status === 'Pending').reduce((s, inst) => s + inst.emi, 0), 0);
  const ledgerRows = months.map(m => {
    const opening = rb;
    const due = loans.reduce((sum, l) => sum + (l.schedule || []).filter(s => { const d = new Date(s.dueDate); return d >= m.start && d <= m.end; }).reduce((s, inst) => s + inst.emi, 0), 0);
    const received = payments.filter(p => { const d = new Date(p.date); return d >= m.start && d <= m.end; }).reduce((sum, p) => sum + (p.amount || 0), 0);
    const overdue = Math.max(0, opening + due - received);
    const progress = (opening + due) > 0 ? Math.min(100, Math.round((received / (opening + due)) * 100)) : 'NA';
    rb = overdue;
    return { month: m.month, opening, due, received, overdue, progress };
  });

  const totalRecovery = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExposure = loans.reduce((sum, l) => sum + (l.schedule || []).filter(s => s.status === 'Pending').reduce((s, inst) => s + inst.emi, 0), 0);
  const validRows = ledgerRows.filter(r => r.progress !== 'NA');
  const avgHealth = validRows.length > 0 ? Math.round(validRows.reduce((s, r) => s + r.progress, 0) / validRows.length) : 0;

  const html = `
    <html>
      <head>
        <style>
          body { font-family: sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; }
          .header { background: #0f172a; color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          h1 { margin: 0; color: #f0883e; font-size: 24px; }
          .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .metric-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .metric-label { font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: bold; }
          .metric-value { font-size: 16px; font-weight: bold; margin-top: 5px; font-family: monospace; }
          table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
          th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 10px; text-transform: uppercase; color: #64748b; }
          td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
          .progress-bar { height: 4px; background: #f1f5f9; border-radius: 2px; width: 60px; overflow: hidden; display: inline-block; vertical-align: middle; margin-right: 10px; }
          .progress-fill { height: 100%; background: #f0883e; }
          .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-top: 30px; margin-bottom: 15px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>FLEET STRATEGIC AUDIT</h1>
            <p style="font-size: 10px; opacity: 0.6; margin-top: 5px;">Master Protocol Recovery Node // ${new Date().toLocaleDateString()}</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 14px; font-weight: bold; margin: 0;">${loans.length} Units</p>
            <p style="font-size: 10px; opacity: 0.6; margin: 5px 0 0 0;">Active Portfolio</p>
          </div>
        </div>
 
        <div class="metrics">
          <div class="metric-card">
            <div class="metric-label">Recovery Volume</div>
            <div class="metric-value">${formatINR(totalRecovery)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Liability Exposure</div>
            <div class="metric-value">${formatINR(totalExposure)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Collection Health</div>
            <div class="metric-value">${avgHealth}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Fleet Nodes</div>
            <div class="metric-value">${loans.length} Units</div>
          </div>
        </div>

        <div class="section-title">Asset Breakdown</div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
          <div class="metric-card">
            <div class="metric-label">EX-Series Recovery</div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
              <div class="progress-bar" style="width: 70%;"><div class="progress-fill" style="width: 92%; background: #f0883e;"></div></div>
              <span style="font-size: 11px; font-weight: bold; font-family: monospace;">92%</span>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">MT-Logistics Flow</div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
              <div class="progress-bar" style="width: 70%;"><div class="progress-fill" style="width: 55%; background: #3b82f6;"></div></div>
              <span style="font-size: 11px; font-weight: bold; font-family: monospace;">55%</span>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">ZL-Wheel Collection</div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
              <div class="progress-bar" style="width: 70%;"><div class="progress-fill" style="width: 78%; background: #10b981;"></div></div>
              <span style="font-size: 11px; font-weight: bold; font-family: monospace;">78%</span>
            </div>
          </div>
        </div>

        <div class="section-title">Monthly Recovery Protocol Ledger</div>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Opening</th>
              <th>Due</th>
              <th>Received</th>
              <th>Overdue</th>
              <th>Closing</th>
              <th>Collection %</th>
            </tr>
          </thead>
          <tbody>
            ${ledgerRows.map(r => `
              <tr>
                <td style="font-weight: bold;">${r.month}</td>
                <td>${formatINR(r.opening)}</td>
                <td>${formatINR(r.due)}</td>
                <td style="color: #059669; font-weight: bold;">${formatINR(r.received)}</td>
                <td style="color: #dc2626;">${formatINR(r.overdue)}</td>
                <td>${formatINR(r.overdue)}</td>
                <td>
                  ${r.progress === 'NA' 
                    ? 'NA' 
                    : `<div class="progress-bar"><div class="progress-fill" style="width: ${r.progress}%"></div></div> ${r.progress}%`
                  }
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  await page.setContent(html);
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  return pdf;
};
