import React, { useState } from 'react';
import { state } from '../state';
import { hasPermission, showNotification } from '../utils';
import { Plus, Search, DollarSign, FileText, Edit3, Trash2, X, Download } from 'lucide-react';

// ── Billing Engine ─────────────────────────────────────────────────────────
const FMCBilling = () => {
  const { fmcInvoices = [], fmcContracts = [], fmcDailyHours = [], machines = [], user } = state.data;
  const [showGenModal, setShowGenModal] = useState(false);

  let availableContracts = fmcContracts;
  let filteredInvoices = fmcInvoices;

  if (user?.role === 'SUPERVISOR' && user.supervisorId) {
    availableContracts = fmcContracts.filter(c => 
      c.assignedSupervisor === user.supervisorId || c.backupSupervisor === user.supervisorId
    );
    const assignedContractIds = availableContracts.map(c => c._id);
    filteredInvoices = fmcInvoices.filter(i => assignedContractIds.includes(i.contractId));
  }

  const totalRevenue = filteredInvoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalPending = filteredInvoices.filter(i => i.status === 'Pending').reduce((s, i) => s + (i.totalAmount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight uppercase italic">FMC Billing Engine</h2>
          <p className="text-[10px] font-bold text-text-dim/60 uppercase tracking-[0.2em] mt-1 font-mono">
            Monthly Invoice Generation — {filteredInvoices.length} Invoices
          </p>
        </div>
        {hasPermission(user, 'fmc', 'create') && (
          <button onClick={() => setShowGenModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#f0883e] text-black text-[11px] font-black rounded-xl hover:bg-[#ffab70] transition-all shadow-lg shadow-orange-500/20">
            <Plus size={14} /> GENERATE INVOICE
          </button>
        )}
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${(totalRevenue / 100000).toFixed(2)}L`, sub: 'All Paid Invoices', color: '#3fb950' },
          { label: 'Pending Amount', value: `₹${(totalPending / 100000).toFixed(2)}L`, sub: `${filteredInvoices.filter(i => i.status === 'Pending').length} Outstanding`, color: '#ffa657' },
          { label: 'Active Contracts', value: availableContracts.filter(c => c.status === 'Active').length, sub: 'Billing Active', color: '#58a6ff' },
        ].map(k => (
          <div key={k.label} className="bg-bg-card border border-border-main rounded-2xl p-6 flex flex-col justify-between h-32">
            <span className="text-[10px] font-black text-text-dim/60 uppercase tracking-widest">{k.label}</span>
            <div>
              <p className="text-3xl font-mono font-black tracking-tighter" style={{ color: k.color }}>{k.value}</p>
              <p className="text-[9px] font-bold text-text-dim/60 uppercase tracking-widest mt-0.5">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Invoices Table */}
      <InvoiceTable invoices={filteredInvoices} user={user} />

      {showGenModal && <GenerateInvoiceModal onClose={() => setShowGenModal(false)} contracts={availableContracts} dailyHours={fmcDailyHours} machines={machines} />}
    </div>
  );
};

const InvoiceTable = ({ invoices, user }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = invoices.filter(i => {
    const matchSearch = [i.invoiceNumber, i.customerName, i.agreementNumber].some(v =>
      (v || '').toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === 'All' || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id) => {
    await state.deleteFMCInvoice(id);
    showNotification('Invoice deleted', 'success');
  };

  const statusColor = { Paid: '#3fb950', Pending: '#ffa657', Overdue: '#f85149', Cancelled: '#768390' };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim/60" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..."
            className="pl-9 pr-4 py-2.5 bg-bg-card border border-border-main rounded-xl text-xs text-text-main font-bold focus:border-[#f0883e] outline-none w-full" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-bg-card border border-border-main rounded-xl px-3 py-2.5 text-xs text-text-dim font-bold focus:border-[#f0883e] outline-none">
          <option>All</option><option>Pending</option><option>Paid</option><option>Overdue</option><option>Cancelled</option>
        </select>
      </div>
      <div className="bg-bg-card border border-border-main rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-bg-active border-b border-border-main">
              {['Invoice #', 'Customer', 'Billing Month', 'Hours', 'Usage Charge', 'Parts', 'Total Amount', 'Overdue', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/50">
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-5 py-16 text-center text-[10px] font-bold text-text-dim/60 uppercase tracking-widest">No invoices found</td></tr>
            ) : filtered.map((inv, i) => (
              <tr key={inv._id || i} className="hover:bg-bg-active transition-colors group">
                <td className="px-4 py-4 font-mono font-black text-[#f0883e] text-xs">{inv.invoiceNumber}</td>
                <td className="px-4 py-4">
                  <p className="font-black text-text-main text-xs">{inv.customerName || '—'}</p>
                  <p className="text-[9px] font-mono text-text-dim/60">{inv.agreementNumber}</p>
                </td>
                <td className="px-4 py-4 font-mono text-xs text-text-dim">{inv.billingMonth || '—'}</td>
                <td className="px-4 py-4 font-mono text-xs text-text-dim">{inv.totalHours || 0} hrs</td>
                <td className="px-4 py-4 font-mono text-xs text-text-dim">₹{(inv.usageCharge || 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-4 font-mono text-xs text-text-dim">₹{(inv.partsCharge || 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-4 font-mono font-black text-text-main text-sm">₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-4 font-mono text-xs text-red-500 font-bold">
                  {inv.status === 'Pending' && (() => {
                    const [y, m] = (inv.billingMonth || '').split('-').map(Number);
                    const now = new Date();
                    const cy = now.getFullYear();
                    const cm = now.getMonth() + 1;
                    return (y < cy || (y === cy && m < cm));
                  })() ? `₹${(inv.totalAmount || 0).toLocaleString('en-IN')}` : '—'}
                </td>
                <td className="px-4 py-4">
                  <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border"
                    style={{ background: `${statusColor[inv.status] || '#768390'}15`, color: statusColor[inv.status] || '#768390', borderColor: `${statusColor[inv.status] || '#768390'}30` }}>
                    {inv.status || 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    {hasPermission(user, 'fmc', 'update') && (
                      <button
                        onClick={async () => {
                          await state.saveFMCInvoice({ ...inv, status: inv.status === 'Pending' ? 'Paid' : 'Pending' });
                          showNotification('Status updated', 'success');
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-active text-text-dim hover:text-[#3fb950] hover:bg-[#3fb950]/10 border border-border-main transition-all" title="Toggle Status">
                        <DollarSign size={13} />
                      </button>
                    )}
                    {hasPermission(user, 'fmc', 'delete') && (
                      <button onClick={() => handleDelete(inv._id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-active text-text-dim hover:text-rose-500 hover:bg-rose-500/10 border border-border-main transition-all">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const GenerateInvoiceModal = ({ onClose, contracts, dailyHours, machines }) => {
  const [contractId, setContractId] = useState('');
  const [billingMonth, setBillingMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const selectedContract = contracts.find(c => c._id === contractId);

  // Auto-compute billing
  const contractMachineNames = machines.filter(m => selectedContract?.machines?.includes(m._id)).map(m => m.name);

  const monthHours = dailyHours
    .filter(d => {
      if (!d.date?.startsWith(billingMonth)) return false;
      return d.contractId === contractId || contractMachineNames.includes(d.machineName || d.machine);
    })
    .reduce((s, d) => s + (d.totalHours || 0), 0);

  const hourlyRate = selectedContract?.hourlyRate || 0;
  const fixedCharge = selectedContract?.fixedMonthlyCharge || 0;
  const minHours = selectedContract?.minBillingHours || 0;
  const billedHours = Math.max(monthHours, minHours);
  const overtimeHours = Math.max(0, monthHours - minHours);
  const overtimeRate = selectedContract?.overtimeRate || 0;
  const usageCharge = billedHours * hourlyRate + overtimeHours * overtimeRate + fixedCharge;
  const gst = Math.round(usageCharge * 0.18);
  const totalAmount = usageCharge + gst;

  const handleGenerate = async () => {
    if (!contractId) { showNotification('Select a contract', 'error'); return; }
    const invoice = {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      contractId, agreementNumber: selectedContract?.agreementNumber,
      customerName: selectedContract?.customerName,
      billingMonth, totalHours: monthHours, billedHours,
      hourlyRate, fixedCharge, usageCharge,
      partsCharge: 0, laborCharge: 0, gst, totalAmount,
      status: 'Pending'
    };
    const result = await state.saveFMCInvoice(invoice);
    if (result.success) { showNotification('Invoice generated', 'success'); onClose(); }
    else showNotification(result.message || 'Failed', 'error');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-bg-card border border-border-main rounded-3xl shadow-2xl">
        <div className="px-8 py-5 border-b border-border-main flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-text-main uppercase">Generate Invoice</h2>
            <p className="text-[9px] font-mono text-text-dim/60 uppercase tracking-widest">FMC Billing Engine — Auto Compute</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-active rounded-xl text-text-dim hover:text-text-main transition-colors"><X size={18} /></button>
        </div>
        <div className="p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">FMC Contract</p>
              <select value={contractId} onChange={e => setContractId(e.target.value)}
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none">
                <option value="">Select contract...</option>
                {contracts.filter(c => c.status === 'Active').map(c => (
                  <option key={c._id} value={c._id}>{c.agreementNumber} — {c.customerName}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Billing Month</p>
              <input type="month" value={billingMonth} onChange={e => setBillingMonth(e.target.value)}
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none" />
            </div>
          </div>

          {/* Auto-computed breakdown */}
          {contractId && (
            <div className="bg-bg-deep border border-border-main rounded-2xl p-6 space-y-3">
              <p className="text-[10px] font-black text-[#f0883e] uppercase tracking-widest mb-4 flex items-center gap-2">
                <DollarSign size={12} /> Auto-Computed Billing Breakdown
              </p>
              {[
                { label: 'Running Hours (Actual)', value: `${monthHours} hrs` },
                { label: 'Billed Hours (Min Guaranteed)', value: `${billedHours} hrs` },
                { label: 'Hourly Rate', value: `₹${hourlyRate.toLocaleString('en-IN')}` },
                { label: 'Fixed Monthly Charge', value: `₹${fixedCharge.toLocaleString('en-IN')}` },
                { label: 'Usage Charge', value: `₹${usageCharge.toLocaleString('en-IN')}` },
                { label: 'GST @ 18%', value: `₹${gst.toLocaleString('en-IN')}` },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center text-xs">
                  <span className="font-bold text-text-dim">{row.label}</span>
                  <span className="font-mono font-black text-text-main">{row.value}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-border-main flex justify-between items-center">
                <span className="font-black text-text-main uppercase tracking-widest text-xs">Total Amount</span>
                <span className="font-mono font-black text-[#f0883e] text-xl">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>
        <div className="px-8 py-5 border-t border-border-main flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 border border-border-main text-text-dim rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-text-main transition-colors">Cancel</button>
          <button onClick={handleGenerate}
            className="px-8 py-2.5 bg-[#f0883e] text-black font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#ffab70] transition-all">
            GENERATE INVOICE
          </button>
        </div>
      </div>
    </div>
  );
};

export default FMCBilling;
