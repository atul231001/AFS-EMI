import React, { useState } from 'react';
import { state } from '../state';
import { formatINR } from '../utils';
import {
  TrendingUp, AlertCircle, Truck, History, ShieldCheck,
  ChevronRight, ArrowUpRight, ArrowDownRight, Activity as ActivityIcon,
  Wrench, HandCoins, Construction, Download
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, accent, trend, isUp }) => (
  <div className="bg-bg-card border border-border-main rounded-xl p-5 group hover:border-text-dim transition-all relative overflow-hidden shadow-sm">
    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -mr-8 -mt-8" />
    <div className="flex items-center justify-between mb-4">
      <span className="text-[10px] font-bold text-text-dim tracking-widest font-mono uppercase">{label}</span>
      <div className={`p-1.5 bg-bg-deep border border-border-main rounded-lg group-hover:scale-110 group-hover:border-primary/30 transition-all`}>
        <Icon size={14} className={accent} />
      </div>
    </div>
    <div className="flex items-baseline justify-between">
      <div className="text-xl font-black text-text-main font-mono tracking-tighter">{value}</div>
      {trend && (
        <div className={`flex items-center gap-0.5 text-[10px] font-bold font-mono ${isUp ? 'text-green-500' : 'text-red-500'}`}>
          {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {trend}
        </div>
      )}
    </div>
  </div>
);

const CustomerDashboard = () => {
  const { loans, user } = state.data;
  const clientLoans = loans.filter(l => {
    const loanCustId = (l.customerId?._id || l.customerId)?.toString();
    const userCustId = (user?.customerId?._id || user?.customerId)?.toString();
    return loanCustId && userCustId && loanCustId === userCustId && l.approvalStatus === 'Active';
  });
  const totalFinanced = clientLoans.reduce((sum, l) => sum + (l.principal || 0), 0);
  let totalPaidAmt = 0;
  let totalOutstanding = 0;
  let overdueAmount = 0;
  let lastPaymentDate = null;

  clientLoans.forEach(loan => {
    const paid = (loan.schedule || []).filter(s => s.status === 'Paid');
    const pending = (loan.schedule || []).filter(s => s.status === 'Pending');

    totalPaidAmt += paid.length * (loan.emi || 0);

    const nextInstallment = pending.length > 0 ? pending[0] : loan.schedule[loan.schedule.length - 1];
    if (nextInstallment) {
      totalOutstanding += nextInstallment.balance || 0;
    }

    pending.forEach(s => {
      if (new Date(s.dueDate) < new Date()) {
        overdueAmount += loan.emi;
      }
    });

    paid.forEach(s => {
      if (!lastPaymentDate || new Date(s.dueDate) > new Date(lastPaymentDate)) {
        lastPaymentDate = s.dueDate;
      }
    });
  });

  const nextPayment = clientLoans
    .flatMap(l => (l.schedule || []).filter(s => s.status === 'Pending'))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  return (
    <div className="space-y-8 animate-slide-up pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-bg-card border border-primary/30 rounded-xl p-6 relative overflow-hidden shadow-sm flex flex-col justify-center">
          <span className="text-[11px] font-bold text-primary tracking-widest font-mono uppercase block mb-4">NEXT SETTLEMENT</span>
          <span className="text-3xl font-bold text-text-main font-mono mb-2">{nextPayment ? formatINR(nextPayment.emi) : 'CLEAR'}</span>
          {nextPayment && <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">DUE: {nextPayment.dueDate}</span>}
        </div>
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard icon={TrendingUp} label="TOTAL PAID" value={formatINR(totalPaidAmt)} accent="text-[#3fb950]" />
          <StatCard icon={AlertCircle} label="OUTSTANDING BAL" value={formatINR(totalOutstanding)} accent="text-white" />
          <StatCard icon={History} label="OVERDUE AMOUNT" value={formatINR(overdueAmount)} accent="text-rose-500" />
          <StatCard icon={Truck} label="SECURED ASSETS" value={clientLoans.length} accent="text-primary" />
          <StatCard icon={History} label="TOTAL FINANCED" value={formatINR(totalFinanced)} accent="text-text-dim" />
          <StatCard icon={History} label="LAST PAYMENT" value={lastPaymentDate || '--'} accent="text-[#768390]" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-bg-card border border-border-main rounded-xl p-8">
          <h3 className="text-[11px] font-bold font-mono tracking-[0.2em] text-text-dim uppercase mb-6">Payment Terminal</h3>
          <div className="p-6 bg-bg-deep border border-border-main rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Next EMI Due</p>
              <p className="text-2xl font-bold text-text-main font-mono">{formatINR(nextPayment?.emi || 0)}</p>
            </div>
            <div className="w-px h-8 bg-border-main hidden sm:block"></div>
            <div>
              <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Overdue Penalty</p>
              <p className="text-2xl font-bold text-rose-500 font-mono">{formatINR(overdueAmount)}</p>
            </div>
            <button className="px-6 py-3 bg-primary text-black font-black text-[11px] uppercase tracking-widest rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(240,136,62,0.15)] active:scale-95 whitespace-nowrap" disabled={!nextPayment}>Pay Now</button>
          </div>
        </section>
        <section className="bg-bg-card border border-border-main rounded-xl p-8 flex flex-col justify-between shadow-sm">
          <h3 className="text-[11px] font-bold font-mono tracking-[0.2em] text-text-dim uppercase mb-4">Strategic Support</h3>
          <p className="text-[12px] text-text-dim leading-relaxed">Access 24/7 technical assistance for your Liugong assets. Fast-track your service requests.</p>
          <div className="grid grid-cols-2 gap-3 mt-8">
            <button className="py-3 bg-bg-deep border border-border-main rounded-lg text-[10px] font-black text-text-main uppercase tracking-widest hover:bg-bg-active transition-all">Request NOC</button>
            <button className="py-3 bg-bg-deep border border-border-main rounded-lg text-[10px] font-black text-text-main uppercase tracking-widest hover:bg-bg-active transition-all">Contact Ops</button>
          </div>
        </section>
      </div>
    </div>
  );
};

const FMCStatCard = ({ icon: Icon, label, value, subtitle, color }) => (
  <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 group hover:border-[#8b949e] transition-all relative overflow-hidden flex flex-col justify-between min-h-[160px] shadow-lg">
    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20 z-0" />
    <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.03] rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" style={{ backgroundColor: color }} />
    <div className="absolute -bottom-4 -right-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500" style={{ color }}>
      <Icon size={140} />
    </div>
    
    <div className="flex items-center justify-between relative z-10">
      <span className="text-[12px] font-black text-[#8b949e] tracking-[0.2em] uppercase">{label}</span>
      <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl group-hover:scale-110 transition-all shadow-sm" style={{ color }}>
        <Icon size={20} />
      </div>
    </div>
    <div className="relative z-10 mt-6">
      <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tighter drop-shadow-sm">{value}</div>
      {subtitle && <div className="text-[11px] font-bold text-[#8b949e] uppercase tracking-widest mt-2">{subtitle}</div>}
    </div>
  </div>
);

const FMCCustomerDashboard = () => {
  const { fmcContracts, fmcTickets, fmcDailyHours, fmcInvoices, user, machines } = state.data;

  React.useEffect(() => {
    if (state?.data?.machines?.length === 0 && state.ensureMachinesLight) {
      state.ensureMachinesLight();
    }
  }, [state?.data?.machines?.length]);

  const myContracts = fmcContracts.filter(c =>
    (c.customerId && user?.customerId && c.customerId.toString() === user.customerId.toString()) ||
    (c.customerName === user?.name)
  );
  const myMachineIds = myContracts.flatMap(c => c.machines || []);
  const myMachines = machines.filter(m => myMachineIds.includes(m._id));
  const myMachineNames = myMachines.map(m => m.name);
  const myTickets = fmcTickets.filter(t => myMachineNames.includes(t.machineName));
  const myHours = fmcDailyHours.filter(d => myMachineNames.includes(d.machineName || d.machine));
  const myInvoices = fmcInvoices.filter(inv => myContracts.some(c => c._id === inv.contractId));
  const totalHours = myHours.reduce((sum, h) => sum + (h.totalHours || 0), 0);
  const activeTickets = myTickets.filter(t => !['Resolved', 'Closed'].includes(t.status)).length;
  const resolvedTickets = myTickets.filter(t => t.status === 'Resolved' && t.updatedAt && t.createdAt);
  const avgMTTR = resolvedTickets.length > 0 ? (resolvedTickets.reduce((sum, t) => sum + (new Date(t.updatedAt) - new Date(t.createdAt)), 0) / resolvedTickets.length / (1000 * 60 * 60)).toFixed(1) : '0';

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
            <ShieldCheck className="text-[#3fb950]" size={40} /> FMC Client Terminal
          </h2>
          <p className="text-[12px] font-bold text-[#8b949e] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <ActivityIcon size={14} className="text-[#3fb950]" /> Real-time Fleet Telemetry & Maintenance Ledger
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FMCStatCard icon={Construction} label="Fleet Assets" value={myMachines.length} subtitle="Active Machines" color="#f0883e" />
        <FMCStatCard icon={ActivityIcon} label="Machine Hours" value={`${totalHours.toFixed(0)}`} subtitle="Total Running Hours" color="#58a6ff" />
        <FMCStatCard icon={Wrench} label="Breakdown Desk" value={activeTickets} subtitle="Open Tickets" color="#f85149" />
        <FMCStatCard icon={HandCoins} label="Monthly Billing" value={myInvoices.filter(i => i.status === 'Pending').length} subtitle="Pending Invoices" color="#3fb950" />
        <FMCStatCard icon={History} label="Payment Ledger" value={myInvoices.filter(i => i.status === 'Paid').length} subtitle="Settled Invoices" color="#d2a8ff" />
        <FMCStatCard icon={ActivityIcon} label="Mean MTTR" value={`${avgMTTR}`} subtitle="Hours Avg Resolution" color="#ffab70" />
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
        <section className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          <div className="px-8 py-6 border-b border-[#30363d] bg-[#0d1117]/50 flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-black text-white uppercase tracking-[0.2em]">Fleet Asset Ledger</h3>
              <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mt-1">Real-time Telemetry</p>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead className="bg-[#0d1117]">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-[#8b949e] tracking-widest">Asset</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-[#8b949e] tracking-widest">Hours</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-[#8b949e] tracking-widest">Contract</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-[#8b949e] tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]/50">
                {myMachines.map(m => (
                  <tr key={m._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <p className="font-black text-white text-sm">{m.name}</p>
                      <p className="text-[10px] font-mono text-[#8b949e] uppercase mt-1">{m.model}</p>
                    </td>
                    <td className="px-8 py-5 font-mono text-sm text-[#58a6ff] font-bold">
                      {myHours.filter(h => (h.machineName || h.machine) === m.name).reduce((s, h) => s + (h.totalHours || 0), 0).toFixed(0)} hrs
                    </td>
                    <td className="px-8 py-5 text-[11px] text-[#8b949e]">
                      {myContracts.find(c => (c.machines || []).includes(m._id))?.agreementNumber || '—'}
                    </td>
                    <td className="px-8 py-5">
                      {myTickets.some(t => t.machineName === m.name && !['Resolved', 'Closed'].includes(t.status)) ? (
                        <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest">Down</span>
                      ) : (
                        <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-[9px] font-black uppercase tracking-widest">Live</span>
                      )}
                    </td>
                  </tr>
                ))}
                {myMachines.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-8 py-12 text-center text-[11px] font-bold text-[#8b949e] uppercase tracking-widest">
                      No fleet assets registered
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-8 flex flex-col">
          <section className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-[#30363d] bg-[#0d1117]/50 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-black text-white uppercase tracking-[0.2em]">Service Desk</h3>
                <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mt-1">Recent Activity</p>
              </div>
            </div>
            <div className="p-8 space-y-4">
              {myTickets.slice(0, 4).map(t => (
                <div key={t._id} className="p-5 bg-[#0d1117] border border-[#30363d] rounded-xl flex items-center justify-between group hover:border-[#f0883e]/50 transition-all shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className={`w-2.5 h-2.5 rounded-full ${t.status === 'Requested' ? 'bg-red-500' : 'bg-[#3fb950]'} animate-pulse`} />
                    <div>
                      <p className="text-[11px] font-black text-white uppercase tracking-wider">{t.ticketNumber}</p>
                      <p className="text-[10px] text-[#8b949e] mt-1">{t.machineName}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">{t.status}</span>
                </div>
              ))}
              {myTickets.length === 0 && (
                <div className="py-8 text-center text-[11px] font-bold text-[#8b949e] uppercase tracking-widest">
                  No active service requests
                </div>
              )}
            </div>
          </section>

          <section className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-[#30363d] bg-[#0d1117]/50 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-black text-[#3fb950] uppercase tracking-[0.2em]">Settlement Ledger</h3>
                <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mt-1">Recent Invoices</p>
              </div>
            </div>
            <div className="p-8 space-y-4">
              {myInvoices.slice(0, 3).map(inv => (
                <div key={inv._id} className="p-5 bg-[#0d1117] border border-[#30363d] rounded-xl hover:border-[#3fb950]/50 transition-all shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[11px] font-bold text-white font-mono">{inv.invoiceNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${inv.status === 'Paid' ? 'bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/20' : 'bg-[#f0883e]/10 text-[#f0883e] border-[#f0883e]/20'}`}>{inv.status}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">{inv.billingMonth}</p>
                      <p className="text-2xl font-black text-white font-mono mt-1">{formatINR(inv.totalInvoice)}</p>
                    </div>
                    <button className="p-2.5 bg-white/5 rounded-lg text-[#8b949e] hover:text-white hover:bg-white/10 transition-colors">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {myInvoices.length === 0 && (
                <div className="py-8 text-center text-[11px] font-bold text-[#8b949e] uppercase tracking-widest">
                  No recent settlements
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { view, user, fmcContracts } = state.data;

  if (view === 'fmc-customer-dashboard') return <FMCCustomerDashboard />;
  if (view === 'emi-dashboard') return <CustomerDashboard />;
  if (view === 'rental-dashboard') return <CustomerDashboard />; // Render same as EMI portal for now

  // Fallback for default 'customer-dashboard'
  const userTypes = Array.isArray(user?.type) 
    ? user.type.map(t => (t || '').toUpperCase()) 
    : [(user?.type || '').toUpperCase()].filter(Boolean);

  const hasFMCContracts = (fmcContracts || []).some(c =>
    (c.customerId && user?.customerId && c.customerId.toString() === user.customerId.toString()) ||
    (c.customerName === user?.name)
  );

  const isFMC = userTypes.includes('FMC') || hasFMCContracts;

  if (isFMC && userTypes.length === 1) return <FMCCustomerDashboard />;
  if (isFMC && userTypes.length === 0) return <FMCCustomerDashboard />;
  if (isFMC && !userTypes.includes('EMI') && !userTypes.includes('RENTAL')) return <FMCCustomerDashboard />;
  
  return <CustomerDashboard />;
};

export default Dashboard;
