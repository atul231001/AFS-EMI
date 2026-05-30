import React from 'react';
import { state } from '../state';
import { formatINR } from '../utils';
import { Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const PaymentTracker = () => {
  const { payments, loans, user } = state.data;
  const uCustId = (user?.customerId?._id || user?.customerId)?.toString();


  // const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  const isAdmin = user?.role === 'OEM' || user?.role === 'Admin';
  const isCustomer = user?.role === 'CUSTOMER' || (!isAdmin && user?.role !== 'SUPERVISOR');

  // 1. Process Settled Payments
  const settledEntries = (isCustomer
    ? payments.filter(p => {
      const pCustId = (p.loanId?.customerId?._id || p.loanId?.customerId)?.toString();
      return pCustId && uCustId && pCustId === uCustId;
    })
    : payments
  ).map(p => ({
    ...p,
    entryType: 'SETTLED',
    displayAmount: p.amount,
    displayDate: p.date,
    assetName: p.loanId?.machineName,
    customerName: p.loanId?.customerId?.name
  }));

  // 2. Process Pending EMIs from Loans
  const clientLoans = isCustomer
    ? loans.filter(l => {
      const lCustId = (l.customerId?._id || l.customerId)?.toString();
      return lCustId && uCustId && lCustId === uCustId;
    })
    : loans;

  const pendingEntries = clientLoans.flatMap(l =>
    (l.schedule || [])
      .filter(s => s.status === 'Pending')
      .map(s => ({
        _id: `pending-${l._id}-${s.dueDate}`,
        entryType: 'PENDING',
        displayAmount: s.emi,
        displayDate: s.dueDate,
        assetName: l.machineName,
        customerName: l.customerId?.name || 'Customer',
        isOverdue: new Date(s.dueDate) < new Date()
      }))
  );
  // 3. Combine and Sort
  const allEntries = [...settledEntries, ...pendingEntries].sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate));

  const totalCollected = settledEntries.reduce((acc, p) => acc + p.displayAmount, 0);
  const totalPending = pendingEntries.reduce((acc, p) => acc + p.displayAmount, 0);

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Settlement Ledger');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Customer', key: 'customer', width: 25 },
      { header: 'Asset', key: 'asset', width: 20 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    allEntries.forEach(e => {
      worksheet.addRow({
        date: e.displayDate,
        customer: e.customerName || 'Unknown',
        asset: e.assetName || 'Asset',
        amount: e.displayAmount,
        status: e.entryType === 'SETTLED' ? 'Settled' : (e.isOverdue ? 'Overdue' : 'Pending')
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Settlement_Ledger_${new Date().getTime()}.xlsx`);
  };




  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight uppercase italic">
            Settlement Ledger
          </h2>

          <p className="text-[0.625rem] font-bold text-text-dim uppercase tracking-[0.2em] mt-1">
            Transaction History & Reconciliation Node
          </p>
        </div>

        <button
          onClick={handleExport}
          className="btn-primary flex items-center"
        >
          <Download size={16} className="mr-2" />
          EXPORT PROTOCOL
        </button>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Total Collections */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-5 shadow-sm flex flex-col justify-between">

          <p className="text-[0.5rem] font-black text-text-dim uppercase tracking-widest">
            Total Collections
          </p>

          <p className="text-xl font-black text-green-500">
            {formatINR(totalCollected)}
          </p>

        </div>

        {/* Total Exposure */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-5 shadow-sm flex flex-col justify-between">

          <p className="text-[0.5rem] font-black text-text-dim uppercase tracking-widest">
            Total Exposure
          </p>

          <p className="text-xl font-black text-red-500">
            {formatINR(totalPending)}
          </p>

        </div>

        {/* Reconciliation Units */}
        <div className="bg-bg-card border border-border-main rounded-2xl p-5 shadow-sm flex flex-col justify-between">

          <p className="text-[0.5rem] font-black text-text-dim uppercase tracking-widest">
            Reconciliation Units
          </p>

          <p className="text-xl font-black text-primary">
            {allEntries.length}
          </p>

        </div>

      </div>

      {/* Table */}
      <div className="bg-bg-card border border-border-main rounded-2xl overflow-hidden shadow-xl">

        <div className="overflow-x-auto">

          <table className="w-full text-left compact-table">

            <thead>
              <tr className="bg-bg-deep border-b border-border-main">

                <th className="px-6 py-4 text-[9px] font-black text-text-dim uppercase tracking-widest">
                  Date
                </th>

                <th className="px-6 py-4 text-[9px] font-black text-text-dim uppercase tracking-widest">
                  Customer
                </th>

                <th className="px-6 py-4 text-[9px] font-black text-text-dim uppercase tracking-widest">
                  Asset
                </th>

                <th className="px-6 py-4 text-[9px] font-black text-text-dim uppercase tracking-widest">
                  Amount
                </th>

                <th className="px-6 py-4 text-right text-[9px] font-black text-text-dim uppercase tracking-widest">
                  Status
                </th>

              </tr>
            </thead>

            <tbody>

              {allEntries.length > 0 ? (
                allEntries.map((e) => {

                  const isSettled = e?.entryType === 'SETTLED';
                  const isOverdue = e?.isOverdue;

                  return (
                    <tr
                      key={e?._id}
                      className={`hover:bg-bg-active transition-colors ${e?.entryType === 'PENDING' ? 'opacity-80' : ''
                        }`}
                    >

                      {/* Date */}
                      <td
                        className={`px-6 py-4 text-[0.625rem] font-black font-mono uppercase ${isOverdue ? 'text-red-500' : 'text-text-dim'
                          }`}
                      >
                        {e?.displayDate || '-'}
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">

                        <div className="font-black text-text-main text-[0.6875rem]">
                          {e?.customerName || 'Unknown'}
                        </div>

                        <div className="text-[0.5rem] font-bold text-text-dim uppercase tracking-tighter">
                          REF: {e?._id?.toString()?.slice(-4)?.toUpperCase()}
                        </div>

                      </td>

                      {/* Asset */}
                      <td className="px-6 py-4">

                        <span className="px-2.5 py-1 bg-bg-deep border border-border-main rounded-md text-[8px] font-black text-text-dim uppercase tracking-widest">
                          {e?.assetName || 'Asset'}
                        </span>

                      </td>

                      {/* Amount */}
                      <td
                        className={`px-6 py-4 text-[0.6875rem] font-black ${isSettled ? 'text-green-600' : 'text-primary'
                          }`}
                      >
                        {formatINR(e?.displayAmount || 0)}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-right">

                        {isSettled ? (
                          <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-md text-[8px] font-black text-green-500 uppercase tracking-widest">
                            Settled
                          </span>
                        ) : (
                          <span
                            className={`px-2.5 py-1 border rounded-md text-[8px] font-black uppercase tracking-widest ${isOverdue
                              ? 'bg-red-500/10 border-red-500/20 text-red-500'
                              : 'bg-primary/10 border-primary/20 text-primary'
                              }`}
                          >
                            {isOverdue ? 'Overdue' : 'Pending'}
                          </span>
                        )}

                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-10 text-text-dim text-sm font-bold"
                  >
                    No settlement entries found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
};

export default PaymentTracker;