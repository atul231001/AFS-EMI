import React, { useState, useMemo, forwardRef, useImperativeHandle } from "react";
import { formatINR } from "../../../utils";
import { StatCard } from "../../ORMDashboard";
import { FileText, Search, Banknote, User, CreditCard } from "lucide-react";

const CustomerPaymentSummaryReport = forwardRef(({ customers = [], loans = [], payments = [], fmcInvoices = [], globalFilters, scrollContainerRef, isDragging, handleMouseDown, handleMouseLeave, handleMouseUp, handleMouseMove }, ref) => {
  const data = useMemo(() => {
    const allRecords = [];

    // 1. Map EMI Payments
    payments.forEach(p => {
      if (p.status !== 'Paid' && p.status !== 'Completed') return;
      const customer = customers.find(c => c._id === (p.customerId?._id || p.customerId)) || {};
      const loan = loans.find(l => l._id === (p.loanId?._id || p.loanId)) || {};
      
      const schedule = loan.schedule || [];
      const pendingSchedule = schedule.filter(s => s.status === 'Pending' || s.status === 'Overdue');
      // For cross-section we show remaining principal on the loan this payment went to
      const outstanding = pendingSchedule.length > 0 ? pendingSchedule[pendingSchedule.length - 1].balance : 0;

      allRecords.push({
        id: p._id || `EMI-${Math.random()}`,
        customerName: customer.name || 'Unknown',
        customerId: customer.customId || customer._id,
        paymentType: 'EMI',
        referenceId: loan._id || p.invoiceNumber || '-',
        amountPaid: p.amount || 0,
        paymentDate: p.paymentDate ? p.paymentDate.split('T')[0] : '-',
        methodTransactionId: `${p.paymentMethod || '-'} / ${p.transactionId || '-'}`,
        outstandingBalance: outstanding,
      });
    });

    // 2. Map FMC Invoices
    fmcInvoices.forEach(inv => {
      if (inv.status !== 'Paid') return;
      const customer = customers.find(c => c._id === inv.customerId) || {}; // Assuming we can find customer by ID

      allRecords.push({
        id: inv._id || `FMC-${Math.random()}`,
        customerName: customer.name || inv.customerName || 'Unknown',
        customerId: customer.customId || customer._id || '-',
        paymentType: 'FMC Invoice',
        referenceId: inv.invoiceNumber || '-',
        amountPaid: inv.totalAmount || 0,
        paymentDate: inv.paidAt ? inv.paidAt.split('T')[0] : '-',
        methodTransactionId: `Digital / ${inv.transactionId || '-'}`,
        outstandingBalance: 0, // Not applicable for FMC invoices in this view
      });
    });

    // Sort by date descending
    return allRecords.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
  }, [customers, loans, payments, fmcInvoices]);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    paymentType: "All Types",
  });

  const types = ["All Types", "EMI", "FMC Invoice"];

  const filteredData = data.filter((e) => {
    const matchesSearch = e.customerName.toLowerCase().includes(search.toLowerCase()) || e.referenceId.toLowerCase().includes(search.toLowerCase());
    const matchesType = filters.paymentType === "All Types" || e.paymentType === filters.paymentType;
    return matchesSearch && matchesType;
  });

  const totalCollected = filteredData.reduce((sum, e) => sum + e.amountPaid, 0);
  const totalEMIPayments = filteredData.filter(e => e.paymentType === 'EMI').reduce((sum, e) => sum + e.amountPaid, 0);
  const totalFMCPayments = filteredData.filter(e => e.paymentType === 'FMC Invoice').reduce((sum, e) => sum + e.amountPaid, 0);

  const groupedData = useMemo(() => {
    const groups = {};
    filteredData.forEach(row => {
      if (!groups[row.customerId]) {
        groups[row.customerId] = {
          customerName: row.customerName,
          customerId: row.customerId,
          payments: [],
          totalPaid: 0,
          totalOutstanding: 0
        };
      }
      groups[row.customerId].payments.push(row);
      groups[row.customerId].totalPaid += row.amountPaid;
      if (row.paymentType === 'EMI') {
         groups[row.customerId].totalOutstanding = row.outstandingBalance;
      }
    });
    return Object.values(groups).sort((a, b) => b.totalPaid - a.totalPaid);
  }, [filteredData]);

  useImperativeHandle(ref, () => ({
    exportCSV: () => {
      const headers = [
        "Customer Name", "Customer ID", "Payment Type", "Reference ID",
        "Amount Paid", "Payment Date", "Method / Transaction ID", "Outstanding Balance (EMI)"
      ];
      const dataToExport = filteredData.map(e => [
        e.customerName, e.customerId, e.paymentType, e.referenceId,
        e.amountPaid, e.paymentDate, e.methodTransactionId, e.outstandingBalance
      ]);
      return { headers, data: dataToExport, fileName: 'Customer_Payment_Summary' };
    },
    setFilters: (newFilters) => setFilters(prev => ({ ...prev, ...newFilters })),
    setSearch: (term) => setSearch(term)
  }));

  return (
    <div className="flex flex-col gap-6 min-h-0 h-full flex-1 w-full animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <StatCard icon={Banknote} label="TOTAL COLLECTED" value={formatINR(totalCollected)} accent="text-green-500" />
        <StatCard icon={CreditCard} label="EMI COLLECTED" value={formatINR(totalEMIPayments)} accent="text-blue-500" />
        <StatCard icon={FileText} label="FMC COLLECTED" value={formatINR(totalFMCPayments)} accent="text-purple-500" />
        <StatCard icon={User} label="PAYMENT RECORDS" value={filteredData.length} accent="text-orange-500" />
      </div>

      <div className="flex-1 bg-bg-card border border-border-main rounded-2xl flex flex-col shadow-xl overflow-hidden min-h-[400px]">
        <div className="px-6 py-4 border-b border-border-main bg-bg-active/50 flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
              <User size={14} className="text-primary" /> CUSTOMER PAYMENT SUMMARY
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={12} />
              <input
                type="text"
                placeholder="Search customer or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-bg-deep border border-border-main rounded-lg py-1.5 pl-8 pr-4 text-[11px] text-text-main focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pb-2 pt-1">
             <select value={filters.paymentType} onChange={(e) => setFilters({...filters, paymentType: e.target.value})} className="bg-bg-deep border border-border-main text-text-main text-[10px] rounded px-2 py-1 focus:outline-none focus:border-primary shrink-0">
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className={`flex-1 w-full max-w-full overflow-x-auto overflow-y-auto custom-scrollbar ${isDragging ? "cursor-grabbing select-none" : "cursor-grab"}`}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 bg-bg-deep z-10">
              <tr className="border-b border-border-main text-[9px] font-bold text-text-dim uppercase tracking-widest">
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Customer ID</th>
                <th className="px-6 py-4">Payment Type</th>
                <th className="px-6 py-4">Reference ID</th>
                <th className="px-6 py-4 text-right">Amount Paid</th>
                <th className="px-6 py-4">Payment Date</th>
                <th className="px-6 py-4">Method / TXN ID</th>
                <th className="px-6 py-4 text-right">Outstanding Balance (EMI)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/30">
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-bg-active transition-colors group">
                  <td className="px-6 py-4 text-[11px] font-bold text-text-main">{row.customerName}</td>
                  <td className="px-6 py-4 text-[11px] font-mono text-text-dim">{row.customerId}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${row.paymentType === "EMI" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-purple-500/10 text-purple-500 border-purple-500/20"}`}>
                      {row.paymentType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-mono text-text-main">{row.referenceId}</td>
                  <td className="px-6 py-4 text-[11px] font-mono font-bold text-green-400 text-right">{formatINR(row.amountPaid)}</td>
                  <td className="px-6 py-4 text-[11px] font-mono text-text-dim">{row.paymentDate}</td>
                  <td className="px-6 py-4 text-[11px] font-mono text-text-dim">{row.methodTransactionId}</td>
                  <td className="px-6 py-4 text-[11px] font-mono font-bold text-orange-400 text-right">{row.paymentType === 'EMI' ? formatINR(row.outstandingBalance) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default CustomerPaymentSummaryReport;
