import { generateAgreementPDF } from './backend/services/pdfService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPDF() {
  const loan = await prisma.loans.findFirst({ include: { customers: true } });
  if (!loan) { console.log('No loan found'); return; }
  
  try {
    const mappedLoan = { ...loan, _id: loan.id, customerId: loan.customers };
    const pdf = await generateAgreementPDF(mappedLoan);
    console.log('PDF generated, size:', pdf.length);
  } catch (err) {
    console.error('Error:', err);
  }
}

testPDF().catch(console.error);
