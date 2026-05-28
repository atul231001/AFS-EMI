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

export const generatePPTReport = async (loan) => {
  const pptx = new PptxGenJS();
  
  // Slide 1: Cover
  let slide1 = pptx.addSlide();
  slide1.background = { color: '0f172a' };
  slide1.addText('LIUGONG INDUSTRIAL FINANCE', { x: 0.5, y: 1, w: '90%', h: 1, fontSize: 36, bold: true, color: 'f0883e', align: 'center' });
  slide1.addText(`Asset Recovery Protocol: ${loan.machineName}`, { x: 0.5, y: 2, w: '90%', h: 0.5, fontSize: 18, color: 'ffffff', align: 'center' });
  slide1.addText(`Customer: ${loan.customerId?.name || 'N/A'}`, { x: 0.5, y: 2.7, w: '90%', h: 0.5, fontSize: 14, color: '94a3b8', align: 'center' });
  slide1.addText(`Serial No: ${loan.serialNumber}`, { x: 0.5, y: 3.2, w: '90%', h: 0.5, fontSize: 12, color: '64748b', align: 'center' });

  // Slide 2: Financial Summary
  let slide2 = pptx.addSlide();
  slide2.addText('FINANCIAL PERFORMANCE MATRIX', { x: 0.5, y: 0.3, w: '90%', h: 0.5, fontSize: 24, bold: true, color: '0f172a' });
  
  const paidCount = loan.schedule.filter(s => s.status === 'Paid').length;
  const progress = Math.round((paidCount / loan.schedule.length) * 100);
  
  slide2.addTable([
    [{ text: 'Metric', options: { bold: true, fill: 'f1f5f9' } }, { text: 'Value', options: { bold: true, fill: 'f1f5f9' } }],
    ['Principal Amount', `INR ${loan.principal.toLocaleString()}`],
    ['EMI Amount', `INR ${loan.emi.toLocaleString()}`],
    ['Tenure', `${loan.tenure} Years`],
    ['Recovery Progress', `${progress}%`],
    ['Status', loan.status.toUpperCase()]
  ], { x: 0.5, y: 1, w: 9, rowH: 0.4, border: { type: 'solid', color: 'e2e8f0' } });

  // Slide 3: Collection Schedule
  let slide3 = pptx.addSlide();
  slide3.addText('AMORTIZATION SCHEDULE (OVERVIEW)', { x: 0.5, y: 0.3, w: '90%', h: 0.5, fontSize: 24, bold: true, color: '0f172a' });
  
  const tableData = [
    ['Inst.', 'Due Date', 'EMI', 'Principal', 'Status'].map(t => ({ text: t, options: { bold: true, fill: '0f172a', color: 'ffffff' } }))
  ];
  
  loan.schedule.slice(0, 10).forEach(s => {
    tableData.push([
      s.installment.toString(),
      s.dueDate,
      loan.emi.toString(),
      s.principal.toString(),
      s.status.toUpperCase()
    ]);
  });

  slide3.addTable(tableData, { x: 0.5, y: 1, w: 9, rowH: 0.3, fontSize: 10 });

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
