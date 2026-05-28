import { generateReceiptPDF } from '../backend/services/pdfService.js';
import fs from 'fs';
import path from 'path';

async function testPDF() {
  const mockLoan = {
    _id: { toString: () => '6a05b0e8b17d23f6f52e3c56' },
    customerId: { name: 'Test Customer' },
    machineName: 'Excavator 3000',
    serialNumber: 'SN-123456',
    emi: 50000,
  };

  const mockInstallment = {
    installment: 7,
    dueDate: '2024-05-15',
    principal: 40000,
    interest: 10000
  };

  try {
    console.log('Generating PDF...');
    const pdfBuffer = await generateReceiptPDF(mockLoan, mockInstallment);
    
    const outputPath = path.join(process.cwd(), 'scratch', 'test_receipt.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`PDF generated successfully at: ${outputPath}`);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPDF();
