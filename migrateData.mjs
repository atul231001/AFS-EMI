import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function migrate() {
  const data = JSON.parse(fs.readFileSync('./backend/mongodb_sample.json', 'utf8'));

  // 1. Users
  if (data.users) {
    for (const u of data.users) {
      await prisma.users.upsert({
        where: { id: u._id },
        update: {},
        create: {
          id: u._id,
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role,
          customerId: u.customerId || null,
          status: u.status || 'Active'
        }
      });
    }
    console.log('Users migrated');
  }

  // 2. Customers
  // Actually mongodb_sample.json does not have "customers" collection directly, wait, yes it does?
  if (data.customers) {
    for (const c of data.customers) {
      await prisma.customers.upsert({
        where: { id: c._id },
        update: {},
        create: {
          id: c._id,
          name: c.name,
          customId: c.customId || null,
          mobile: c.mobile || null,
          email: c.email || null,
          gst: c.gst || null,
          pan: c.pan || null,
          bankAcc: c.bankAcc || null,
          ifsc: c.ifsc || null,
          status: c.status || 'Active',
          type: c.type || 'Standard',
          city: c.city || null,
          pin: c.pin || null,
          address: c.address || null
        }
      });
    }
    console.log('Customers migrated');
  }

  // 3. Machines
  if (data.machines) {
    for (const m of data.machines) {
      await prisma.machines.upsert({
        where: { id: m._id },
        update: {},
        create: {
          id: m._id,
          name: m.name,
          model: m.model,
          category: m.category,
          machineType: m.machineType,
          brand: m.brand,
          status: m.status,
          specs: m.specs ? JSON.stringify(m.specs) : null,
          pricing: m.pricing ? JSON.stringify(m.pricing) : null,
          warranty: m.warranty ? JSON.stringify(m.warranty) : null
        }
      });
    }
    console.log('Machines migrated');
  }

  // 4. Loans
  if (data.loans) {
    for (const l of data.loans) {
      await prisma.loans.upsert({
        where: { id: l._id },
        update: {},
        create: {
          id: l._id,
          customerId: l.customerId,
          machineName: l.machineName,
          principal: l.principal,
          emi: l.emi,
          tenure: l.tenure,
          interestRate: l.interestRate,
          downPayment: l.downPayment,
          machinePrice: l.machinePrice,
          discountAmount: l.discountAmount,
          discountPercentage: l.discountPercentage,
          delayInterest: l.delayInterest,
          status: l.status,
          approvalStatus: l.approvalStatus,
          agreementGenerated: l.agreementGenerated,
          downPaymentInstallments: l.downPaymentInstallments,
          compoundOverdueInterest: l.compoundOverdueInterest,
          schedule: l.schedule ? JSON.stringify(l.schedule) : null,
          startDate: l.startDate,
          approvalHistory: l.approvalHistory ? JSON.stringify(l.approvalHistory) : null,
          approvalFlowId: l.approvalFlowId,
          agreementUrl: l.agreementUrl,
          invoiceData: l.invoiceData ? JSON.stringify(l.invoiceData) : null,
          invoiceNumber: l.invoiceNumber,
          dispatchData: l.dispatchData ? JSON.stringify(l.dispatchData) : null,
          dispatchDate: l.dispatchDate,
          serialNumber: l.serialNumber,
          commissionDate: l.commissionDate
        }
      });
    }
    console.log('Loans migrated');
  }

  // 5. SystemConfig
  if (data.systemconfigs) {
    for (const c of data.systemconfigs) {
      await prisma.systemconfigs.upsert({
        where: { id: c._id },
        update: {},
        create: {
          id: c._id,
          categories: c.categories ? JSON.stringify(c.categories) : null,
          dieselTypes: c.dieselTypes ? JSON.stringify(c.dieselTypes) : null,
          evTypes: c.evTypes ? JSON.stringify(c.evTypes) : null,
          transmissionTypes: c.transmissionTypes ? JSON.stringify(c.transmissionTypes) : null,
          attachmentTypes: c.attachmentTypes ? JSON.stringify(c.attachmentTypes) : null,
          numbering: c.numbering ? JSON.stringify(c.numbering) : null,
          security: c.security ? JSON.stringify(c.security) : null,
          notifications: c.notifications ? JSON.stringify(c.notifications) : null
        }
      });
    }
    console.log('System Config migrated');
  }

  // 6. ApprovalFlows
  if (data.approvalflows) {
    for (const f of data.approvalflows) {
      await prisma.approvalflows.upsert({
        where: { id: f._id },
        update: {},
        create: {
          id: f._id,
          name: f.name,
          type: f.type,
          steps: f.steps ? JSON.stringify(f.steps) : null,
          isActive: f.isActive,
          supervisorId: f.supervisorId
        }
      });
    }
    console.log('Approval Flows migrated');
  }

  console.log('Migration completed successfully.');
  process.exit(0);
}

migrate().catch(console.error);
