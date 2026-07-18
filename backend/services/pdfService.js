import puppeteer from 'puppeteer';
import { getAgreementPages } from './agreementText.js';
import fs from 'fs';
import path from 'path';

const launchBrowser = async () => {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

  if (isProduction) {
    console.log("Launching browser using @sparticuz/chromium...");
    try {
      const sparticuzChromium = (await import('@sparticuz/chromium')).default;
      const puppeteerCore = (await import('puppeteer-core')).default;
      
      return await puppeteerCore.launch({
        args: sparticuzChromium.args,
        defaultViewport: sparticuzChromium.defaultViewport,
        executablePath: await sparticuzChromium.executablePath(),
        headless: sparticuzChromium.headless,
      });
    } catch (err) {
      console.error("Sparticuz Chromium launch failed, falling back to standard puppeteer:", err);
    }
  }

  const options = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  try {
    return await puppeteer.launch(options);
  } catch (err) {
    console.warn("Puppeteer launch failed, trying with channel 'chrome'...", err.message);
    try {
      return await puppeteer.launch({
        ...options,
        channel: 'chrome'
      });
    } catch (fallbackErr) {
      console.error("Puppeteer fallback launch also failed:", fallbackErr);
      throw fallbackErr;
    }
  }
};

const convertNumberToWords = (amount) => {
  if (amount === 0) return 'Zero';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const numToWords = (num) => {
    let str = '';
    if (num > 99) {
      str += a[Math.floor(num / 100)] + 'Hundred ';
      num = num % 100;
    }
    if (num > 19) {
      str += b[Math.floor(num / 10)] + ' ';
      num = num % 10;
    }
    if (num > 0) {
      str += a[num];
    }
    return str;
  };

  let numStr = Math.floor(amount).toString();
  if (numStr.length > 9) return 'Overflow';
  
  const parts = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{3})$/);
  if (!parts) return '';
  
  let out = '';
  if (Number(parts[1]) !== 0) out += numToWords(Number(parts[1])) + 'Crore ';
  if (Number(parts[2]) !== 0) out += numToWords(Number(parts[2])) + 'Lakh ';
  if (Number(parts[3]) !== 0) out += numToWords(Number(parts[3])) + 'Thousand ';
  if (Number(parts[4]) !== 0) out += numToWords(Number(parts[4]));
  
  return out.trim();
};

export const generateReceiptPDF = async (loan, installment) => {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const index = loan.schedule.findIndex(s => s._id === installment._id || s === installment);
  const instNum = installment.installment || installment.installmentNo || (index + 1);
  const invoiceNo = `AS${940 + instNum}`; // Matches AS940 style
  const customerName = (loan.customerId?.name || 'CLIENT').toUpperCase();
  const assetName = (loan.machineName || 'Asset').toUpperCase();
  const serialNo = loan.serialNumber || 'SN-8821034';
  
  const paidBaseEmi = installment.paidAmount !== undefined ? installment.paidAmount : loan.emi;
  const paidOverdue = installment.paidOverdueInterest || 0;
  const totalPaid = paidBaseEmi + paidOverdue;
  
  const receiptDate = installment.paidDate 
    ? new Date(installment.paidDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) 
    : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const amountInWords = convertNumberToWords(totalPaid);
  const bankNarration = installment.remarks || `FT - LIUGONG INDIA PVT LTD Cr - 50200059887830 - ${customerName}`;
  const ofmNumber = loan.ofmNumber || `OFM/271/Feb/LIPL`;

  const logoPath = path.join(process.cwd(), '../frontend/public/liugong_logo.png');
  let logoImgTag = '';
  if (fs.existsSync(logoPath)) {
    const logoData = fs.readFileSync(logoPath);
    const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
    logoImgTag = `<img src="${logoBase64}" class="logo" alt="LiuGong India" />`;
  } else {
    logoImgTag = `<div class="logo" style="font-size: 20px; font-weight: 900; color: #1e293b; padding-top: 10px;">LIUGONG</div>`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { size: A4 landscape; margin: 40px; }
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; color: #000; background: white; }
        .box { border: 2px solid #000; padding: 30px 40px; box-sizing: border-box; position: relative; height: calc(100vh - 80px); min-height: 600px; }
        
        .header { display: flex; text-align: center; margin-bottom: 20px; position: relative; }
        .logo { position: absolute; left: 0; top: -5px; max-height: 80px; max-width: 250px; object-fit: contain; }
        .company-info { flex: 1; text-align: center; }
        .company-name { font-size: 24px; font-weight: 900; margin: 0; letter-spacing: 0.5px; }
        .company-address { font-size: 11px; font-weight: 800; margin: 5px 0 0; line-height: 1.4; }
        
        .receipt-title { font-size: 14px; font-weight: 900; text-decoration: underline; text-align: center; margin: 30px 0; }
        
        .table-grid { width: 100%; font-size: 12px; font-weight: 800; line-height: 1.8; margin-bottom: 20px; }
        .row { display: flex; margin-bottom: 12px; align-items: flex-end; }
        .col-label { padding-right: 15px; white-space: nowrap; font-size: 11px; }
        .col-value { flex: 1; border-bottom: 2px dashed #000; font-size: 11px; padding-bottom: 2px; }
        
        .stamp-area { position: absolute; bottom: 40px; left: 40px; }
        .stamp-container { display: flex; align-items: center; margin-bottom: 40px; margin-top: 10px; }
        .stamp { width: 70px; height: 70px; border: 2px solid #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #3b82f6; font-weight: 900; text-align: center; transform: rotate(-5deg); position: relative; margin-left: 20px; }
        .stamp-inner { position: absolute; border: 1px dashed #3b82f6; width: 62px; height: 62px; border-radius: 50%; }
        
        .footer-text { position: absolute; bottom: 15px; left: 40px; font-size: 11px; font-weight: 800; }
      </style>
    </head>
    <body>
      <div class="box">
        <div class="header">
          ${logoImgTag}
          <div class="company-info">
            <div class="company-name">LIUGONG INDIA PVT. LTD</div>
            <div class="company-address">101, OKHLA INDUSTRIAL ESTATE, PHASE-III<br>NEW DELHI- 110020<br>011 47272200, FAX : 011 47272220</div>
          </div>
        </div>
        
        <div class="receipt-title">RECEIPT NOTE</div>
        
        <div class="table-grid">
          <div class="row">
            <div class="col-label" style="width: 150px;">Receipt No.</div>
            <div class="col-value" style="border: none; font-size: 11px;">${invoiceNo}</div>
            <div class="col-label" style="margin-left: 20px;">DATE</div>
            <div class="col-value" style="flex: 0.5; border: none; text-align: right; font-size: 11px;">${receiptDate}</div>
          </div>
          
          <div class="row">
            <div class="col-label" style="width: 150px;">Received from M/s.</div>
            <div class="col-value">${customerName}</div>
          </div>
          
          <div class="row">
            <div class="col-label" style="width: 150px;">Customer Name</div>
            <div class="col-value">${customerName}</div>
          </div>
          
          <div class="row" style="margin-top: 20px;">
            <div class="col-label" style="width: 150px;">A sum of Rs.</div>
            <div class="col-value" style="display: flex; align-items: baseline;">
               <span style="font-weight: 900; font-size: 14px;">₹ ${formatAmount(totalPaid)}</span>
               <span style="margin-left: 20px;">Rupees ${amountInWords} Only</span>
            </div>
          </div>
          
          <div class="row" style="margin-top: 20px;">
            <div class="col-label" style="width: 150px;">Vide cheque No. / DD No.</div>
            <div class="col-value">${installment.transactionId || ''}</div>
          </div>
          
          <div class="row">
            <div class="col-label" style="width: 150px;">Against Sale of/ Advance</div>
            <div class="col-value">${loan.invoiceNumber || loan.invoiceData?.invoiceNumber || ''}</div>
          </div>
          
          <div class="row">
            <div class="col-label" style="width: 150px;">Machine Serial Number</div>
            <div class="col-value" style="flex: 0.5;">${serialNo}</div>
            <div class="col-label" style="margin-left: 20px;">Ofm Number:</div>
            <div class="col-value" style="flex: 0.5;">${ofmNumber}</div>
          </div>
          
          <div class="row">
            <div class="col-label" style="width: 150px;">Bank Narration</div>
            <div class="col-value">${bankNarration}</div>
          </div>
        </div>
        
        <div class="stamp-area">
          <div style="font-size: 11px; font-weight: 800;">For Liugong India Pvt. Ltd. <span style="margin-left: 10px; font-weight: 900; font-size: 10px;">HYP: HDFC BANK LIMITED</span></div>
          <div class="stamp-container">
            <div class="stamp">
               <div class="stamp-inner"></div>
               <div>LIUGONG<br>INDIA PVT.<br>LTD.<br><span style="font-size: 7px;">(New Delhi)</span></div>
            </div>
          </div>
          <div style="font-size: 11px; font-weight: 800;">Authorised Signatory</div>
        </div>
        
        <div class="footer-text">Receipt valid subject to encashment of cheque</div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
  });

  await browser.close();
  return pdf;
};

export const generateAgreementHTML = (loan, isForBrowserPrint = false) => {
  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatExecutionDate = (dateStr) => {
    const date = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(date.getTime())) return '25th day of April, 2026';
    const day = date.getDate();
    const year = date.getFullYear();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const month = monthNames[date.getMonth()];
    
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
    
    return `${day}<sup>${suffix}</sup> day of ${month}, ${year}`;
  };

  const formatDateGB = (dateStr) => {
    if (!dateStr) return 'TBD';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const customerName = (loan.customerId?.name || 'CLIENT').toUpperCase();
  const customerCompany = (loan.customerId?.company || loan.customerId?.name || 'CLIENT').toUpperCase();
  const customerAddress = loan.customerId?.address || 'ABC';
  const customerCity = loan.customerId?.city || '';
  const customerState = loan.customerId?.state || '';
  const customerPin = loan.customerId?.pin || loan.customerId?.pincode || '';
  const customerPan = loan.customerId?.pan || 'PAN-TBD';
  const customerGst = loan.customerId?.gst || 'GST-TBD';
  const contactPerson = loan.customerId?.contactPerson || 'Mohinderpal Singh Mann';

  const assetName = (loan.machineName || 'Asset').toUpperCase();
  const modelNo = (loan.model || 'Model No').toUpperCase();
  const tenure = loan.tenure || 36;
  const executionDate = formatExecutionDate(loan.startDate || loan.createdAt);
  const overduePenalty = loan.delayInterest !== undefined ? loan.delayInterest : 24;

  const attachmentTotal = (loan.selectedAttachments || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const manualChargesTotal = (loan.manualCharges || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const baseMachinePrice = (loan.machinePrice || 0) - (loan.discountAmount || 0) + attachmentTotal + manualChargesTotal;

  const gstRate = 0.18;
  const tcsRate = (loan.tcsPercentage !== undefined ? parseFloat(loan.tcsPercentage) : 0.1) / 100;

  const baseGst = Math.round(baseMachinePrice * gstRate * 100) / 100;
  const baseSaleValue = baseMachinePrice + baseGst;
  const baseTcs = Math.round(baseSaleValue * tcsRate * 100) / 100;
  const baseInvoiceValue = baseSaleValue + baseTcs;
  const baseFinancedAmount = Math.max(0, Math.round(baseInvoiceValue) - (loan.downPayment || 0));

  const rMonthly = ((loan.interestRate || 12) / 12) / 100;
  let interestAmount = 0;
  if (baseFinancedAmount > 0 && (loan.interestRate || 12) > 0) {
    const baseEmi = Math.round((baseFinancedAmount * rMonthly * Math.pow(1 + rMonthly, tenure)) / (Math.pow(1 + rMonthly, tenure) - 1));
    interestAmount = (baseEmi * tenure) - baseFinancedAmount;
  }

  const salePrice = Math.round(baseMachinePrice + interestAmount);
  const gst = Math.round(salePrice * gstRate);
  const saleValue = salePrice + gst;
  const tcs = Math.round(saleValue * tcsRate);
  const invoiceValue = saleValue + tcs;
  const financedAmount = Math.max(0, invoiceValue - (loan.downPayment || 0));
  const finalEmi = Math.round(financedAmount / tenure);

  const agreementPages = getAgreementPages({
    executionDate,
    customerCompany,
    customerPan,
    customerAddress,
    customerCity,
    customerState,
    customerPin,
    contactPerson,
    tenure,
    overduePenalty,
    formatINR,
    salePrice,
    gst,
    tcs,
    invoiceValue,
    financedAmount,
    finalEmi,
    downPayment: loan.downPayment || 0
  });

  const printStylesAndMenu = isForBrowserPrint ? `
    <div class="no-print">
      <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
      <button class="btn-close" onclick="window.close()">Close Window</button>
    </div>
  ` : '';

  const printScript = isForBrowserPrint ? `
    <script>
      window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          window.print();
        }, 500);
      });
    </script>
  ` : '';

  return `
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Inter', sans-serif;
          color: #1e293b;
          line-height: 1.35;
          font-size: 11px;
          background-color: #ffffff;
          padding: 0;
          margin: 0;
        }
        .page {
          padding: 0;
          page-break-after: always;
          box-sizing: border-box;
          position: relative;
        }
        .page:last-child {
          page-break-after: avoid;
        }
        p {
          margin: 0 0 4px 0;
        }
        h1, h2, h3, h4 {
          color: #0f172a;
          font-weight: 700;
          margin-top: 0;
          text-align: center;
        }
        h1.title {
          font-size: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 60px;
          margin-bottom: 20px;
        }
        h2.subtitle {
          font-size: 14px;
          text-transform: uppercase;
          margin-bottom: 30px;
        }
        .text-justify {
          text-align: justify;
        }
        .section-title {
          font-weight: bold;
          margin-top: 25px;
          margin-bottom: 8px;
          text-transform: uppercase;
          font-size: 14px;
          border-bottom: 1.5px solid #cbd5e1;
          padding-bottom: 4px;
        }
        .clause-text {
          margin-bottom: 15px;
        }
        .bullet-list {
          padding-left: 20px;
          margin-top: 5px;
          margin-bottom: 10px;
        }
        .bullet-list li {
          margin-bottom: 5px;
        }
        .financial-table, .schedule-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          margin-bottom: 15px;
        }
        .financial-table th, .schedule-table th {
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 10px;
          font-weight: bold;
          text-align: left;
          font-size: 12px;
        }
        .financial-table td, .schedule-table td {
          border: 1px solid #cbd5e1;
          padding: 10px;
          font-size: 12px;
        }
        .financial-table tr.total-row td {
          font-weight: bold;
          background-color: #f1f5f9;
        }
        .signatures-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px;
          margin-top: 60px;
        }
        .sig-block {
          text-align: center;
        }
        .sig-line {
          border-top: 1.5px solid #0f172a;
          margin-top: 65px;
          padding-top: 10px;
          font-weight: bold;
          font-size: 13px;
        }
        
        /* Premium Floating Navigation Menu for Browser Printing */
        .no-print {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(8px);
          padding: 12px 24px;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s ease;
        }
        .no-print button {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        .btn-print {
          background: #f0883e;
          color: white;
        }
        .btn-print:hover {
          background: #e0772d;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(240, 136, 62, 0.3);
        }
        .btn-close {
          background: transparent;
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
        }
        .btn-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        @page {
          size: A4;
          margin: 65px 50px 65px 50px;
        }
        
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page {
            page-break-after: always;
            page-break-inside: avoid;
            margin: 0;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      ${printStylesAndMenu}

      ${agreementPages.map(pageHtml => `
        <div class="page">
          ${pageHtml}
        </div>
      `).join('')}

      <!-- SCHEDULE 1 TABLE A -->
      <div class="page">
        <div style="text-align: center; font-weight: bold; font-size: 16px; text-transform: uppercase; margin-bottom: 40px; letter-spacing: 1px;">
          SCHEDULE 1<br/>
          Table - A<br/>
          DETAILS OF MACHINERY AND EQUIPMENT
        </div>
        
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Machine Type</th>
              <th>Model No</th>
              <th>No of Machine</th>
              <th>Number of Instalments</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${assetName}</strong></td>
              <td><strong>${modelNo}</strong></td>
              <td>1</td>
              <td>${tenure}</td>
            </tr>
            <tr style="font-weight: bold; background-color: #f1f5f9;">
              <td colspan="2">Total</td>
              <td>1</td>
              <td></td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 120px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
            <span>FOR LIUGONG INDIA PVT. LTD.</span>
            <span>FOR ${customerCompany}</span>
          </div>
          
          <div class="signatures-grid" style="margin-top: 120px;">
            <div class="sig-block">
              <div class="sig-line">Authorised Signatory</div>
              <div style="font-size: 13px; margin-top: 8px; font-weight: bold;">Name - Nischal Mehrotra</div>
            </div>
            <div class="sig-block">
              <div class="sig-line">Partner / (Authorised Signatory)</div>
              <div style="font-size: 13px; margin-top: 8px; font-weight: bold;">Name - ${contactPerson}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- TABLE B PAYMENT SCHEDULE -->
      <div class="page" style="page-break-after: avoid !important;">
        <div style="text-align: center; font-weight: bold; font-size: 15px; text-transform: uppercase; margin-bottom: 30px; letter-spacing: 0.5px;">
          TABLE - B HIRE PURCHASE PAYMENT SCHEDULE<br/>
          For Machinery and Equipment: One (1) ${assetName} ${modelNo}
        </div>
        
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Hire purchase Instalment Number</th>
              <th style="text-align: right;">Instalment Amount</th>
              <th style="text-align: center;">Due Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Initial Deposit</strong></td>
              <td style="text-align: right; font-weight: bold;">${formatINR(loan.downPayment || 0)}</td>
              <td style="text-align: center; font-weight: bold;">${formatDateGB(loan.startDate || loan.createdAt)}</td>
            </tr>
            ${loan.schedule.map((s, index) => `
              <tr>
                <td>${getOrdinal(s.installment || (index + 1))}</td>
                <td style="text-align: right;">${formatINR(s.emi)}</td>
                <td style="text-align: center;">${formatDateGB(s.dueDate)}</td>
              </tr>
            `).join('')}
            <tr style="font-weight: bold; background-color: #f1f5f9;">
              <td>Total</td>
              <td style="text-align: right; color: #f0883e; font-size: 14px;">${formatINR(invoiceValue)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 120px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
            <span>FOR LIUGONG INDIA PVT. LTD.</span>
            <span>FOR ${customerCompany}</span>
          </div>
          
          <div class="signatures-grid" style="margin-top: 120px;">
            <div class="sig-block">
              <div class="sig-line">Authorised Signatory</div>
              <div style="font-size: 13px; margin-top: 8px; font-weight: bold;">Name - Nischal Mehrotra</div>
            </div>
            <div class="sig-block">
              <div class="sig-line">Partner / (Authorised Signatory)</div>
              <div style="font-size: 13px; margin-top: 8px; font-weight: bold;">Name - ${contactPerson}</div>
            </div>
          </div>
        </div>
      </div>

      ${printScript}
    </body>
    </html>
  `;
};

export const generateAgreementPDF = async (loan) => {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  const html = generateAgreementHTML(loan, false);

  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pageHeights = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('.page'));
    return divs.map((div, index) => {
      const titleEl = div.querySelector('h1, h2, .section-title, strong');
      return {
        index: index + 1,
        height: div.offsetHeight,
        title: titleEl ? titleEl.innerText.trim().replace(/\n/g, ' ').substring(0, 60) : 'No Title'
      };
    });
  });
  console.log('--- Page Heights inside Puppeteer ---');
  pageHeights.forEach(ph => {
    console.log(`Page ${ph.index} (${ph.title}): ${ph.height}px ${ph.height > 962 ? 'OVERFLOWS (> 962px)' : 'OK'}`);
  });
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '65px', right: '50px', bottom: '65px', left: '50px' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-size: 8px; width: 100%; text-align: center; font-family: 'Inter', sans-serif; color: #64748b; padding: 0 50px; box-sizing: border-box; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-bottom: 20px;">
        <span style="font-weight: bold;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        <span>(Agreement No.- LIPL/HP/26-27/\${loan._id.toString().slice(-4).toUpperCase()})</span>
      </div>
    `
  });

  await browser.close();
  return pdf;
};
