import React, { useState, useEffect } from 'react';
import { state } from '../state';
import { hasPermission } from '../utils';
import {
  FileText, Wrench, Users, Clock, AlertTriangle, TrendingUp, Settings,
  CheckCircle, XCircle, Activity, DollarSign, Shield, Zap,
  ChevronRight, RefreshCw, BarChart2, Calendar
} from 'lucide-react';

const FMCDashboard = () => {
  const { fmcContracts = [], fmcTickets = [], fmcSupervisors = [], fmcDailyHours = [], fmcInvoices = [], user, approvalFlows = [] } = state.data;

  // --- KPI Aggregation ---
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  const toggleTicket = (id) => {
    setSelectedTicketIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };
  const activeContracts = fmcContracts.filter(c => c.status === 'Active');
  const openTickets = fmcTickets.filter(t => !['Closed', 'Resolved'].includes(t.status));
  const criticalTickets = fmcTickets.filter(t => t.severity === 'Critical' && !['Closed', 'Resolved'].includes(t.status));
  const totalMachines = fmcContracts.reduce((s, c) => s + (c.machines?.length || 0), 0);
  const totalHoursToday = fmcDailyHours
    .filter(d => d.date === new Date().toISOString().split('T')[0])
    .reduce((s, d) => s + (d.totalHours || 0), 0);
  const pendingInvoices = fmcInvoices.filter(i => i.status === 'Pending');
  const pendingAmount = pendingInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const monthlyRevenue = fmcInvoices
    .filter(i => {
      const d = new Date(i.billingMonth);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && i.status === 'Paid';
    })
    .reduce((s, i) => s + (i.totalAmount || 0), 0);

  const KPICard = ({ icon: Icon, label, value, sub, color, onClick }) => (
    <div
      onClick={onClick}
      className={`bg-bg-card border border-border-main rounded-2xl p-6 flex flex-col justify-between h-36 hover:border-[${color}]/40 transition-all cursor-pointer group relative overflow-hidden`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">{label}</span>
        <div className={`p-2 rounded-xl`} style={{ background: `${color}15` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-mono font-black text-text-main tracking-tighter">{value}</p>
        {sub && <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest mt-1">{sub}</p>}
      </div>
    </div>
  );
  const hasCompletedApprovalFlow = (t) => {
    if (!t) return false;
    if (['Closed', 'Resolved', 'Rejected'].includes(t.status)) return true;

    let superId = t.supervisorId;
    if (!superId && t.contractId) {
      const contract = fmcContracts.find(c => c._id === t.contractId);
      if (contract && contract.assignedSupervisor) {
        const superv = fmcSupervisors.find(s => s.name === contract.assignedSupervisor || s._id === contract.assignedSupervisor);
        if (superv) superId = superv._id.toString();
      }
    }

    let flow = null;
    if (superId) {
      flow = approvalFlows.find(f => f.isActive && f.supervisorId === superId);
    }
    if (!flow) {
      flow = approvalFlows.find(f => f.isActive && (!f.supervisorId || f.supervisorId === ''));
    }
    if (!flow) return false;

    const stepIdx = t.currentStepIndex || 0;
    return stepIdx >= flow.steps.length;
  };

  const recentTickets = fmcTickets
    .filter(t => !hasCompletedApprovalFlow(t))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const recentContracts = [...fmcContracts]
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight uppercase italic">FMC Command Center</h2>
          <p className="text-[10px] font-bold text-text-dim uppercase tracking-[0.2em] mt-1 font-mono">
            Full Maintenance Contract — Fleet Operations Node
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-main rounded-xl">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-text-dim uppercase tracking-widest">Live Node</span>
          </div>
          {hasPermission(user, 'fmc', 'create') && (
            <button
              onClick={() => state.setState({ view: 'fmc-contracts', fmcSubView: 'new-contract' })}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-[11px] font-black rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              <FileText size={14} /> NEW CONTRACT
            </button>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard icon={FileText} label="Active Contracts" value={activeContracts.length} sub="FMC Agreements" color="#f0883e"
          onClick={() => state.setState({ view: 'fmc-contracts' })} />
        <KPICard icon={Wrench} label="Active Machines" value={totalMachines} sub="Under Maintenance" color="#58a6ff"
          onClick={() => state.setState({ view: 'fmc-machines' })} />
        <KPICard icon={AlertTriangle} label="Open Tickets" value={openTickets.length}
          sub={`${criticalTickets.length} Critical`} color="#f85149"
          onClick={() => state.setState({ view: 'fmc-tickets' })} />
        <KPICard icon={Users} label="Supervisors" value={fmcSupervisors.length} sub="Field Agents" color="#3fb950"
          onClick={() => state.setState({ view: 'fmc-supervisors' })} />
        <KPICard icon={DollarSign} label="Monthly Revenue"
          value={`₹${(monthlyRevenue / 100000).toFixed(1)}L`} sub="Paid This Month" color="#d2a8ff"
          onClick={() => state.setState({ view: 'fmc-billing' })} />
        <KPICard icon={Clock} label="Hours Today"
          value={totalHoursToday.toFixed(0)} sub="Running Hours" color="#ffa657"
          onClick={() => state.setState({ view: 'fmc-hours' })} />
      </div>

      {/* Body: Tickets + Contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="bg-bg-card border border-border-main rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border-main flex items-center justify-between">
            <h3 className="text-[11px] font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-500" /> Service Desk — Active Tickets
            </h3>
            <button onClick={() => state.setState({ view: 'fmc-tickets' })} className="text-[9px] font-black text-[#f0883e] hover:underline uppercase tracking-widest flex items-center gap-1">
              View All <ChevronRight size={10} />
            </button>
          </div>
          <div className="divide-y divide-[#30363d]/50">
            {recentTickets.length === 0 ? (
              <div className="py-12 text-center text-[10px] font-bold text-[#444c56] uppercase tracking-widest">
                No active tickets — All systems operational
              </div>
            ) : recentTickets.map((t, i) => (
              <div key={t._id || i} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <input type="checkbox" checked={selectedTicketIds.includes(t._id || i)} onChange={() => toggleTicket(t._id || i)} className="mr-2 h-4 w-4 rounded text-primary border-gray-300 focus:ring-primary" />
                  <div className={`w-2 h-2 rounded-full ${t.severity === 'Critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]' : t.severity === 'High' ? 'bg-orange-400' : 'bg-green-500'}`} />
                  <div>
                    <p className="text-xs font-black text-white">{t.ticketNumber || `TKT-${String(i + 1).padStart(4, '0')}`}</p>
                    <p className="text-[9px] font-bold text-[#444c56] uppercase tracking-wider">{t.breakdownType} · {t.machineName || t.machine}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${t.status === 'Open' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  t.status === 'In Progress' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                    'bg-bg-active text-text-dim border-border-main'
                  }`}>{t.status}</span>

              </div>
            ))}
          </div>
        </div>

        {/* Recent Contracts */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between">
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <FileText size={14} className="text-[#f0883e]" /> FMC Contracts — Registry
            </h3>
            <button onClick={() => state.setState({ view: 'fmc-contracts' })} className="text-[9px] font-black text-[#f0883e] hover:underline uppercase tracking-widest flex items-center gap-1">
              View All <ChevronRight size={10} />
            </button>
          </div>
          <div className="divide-y divide-[#30363d]/50">
            {recentContracts.length === 0 ? (
              <div className="py-12 text-center text-[10px] font-bold text-[#444c56] uppercase tracking-widest">
                No contracts registered yet
              </div>
            ) : recentContracts.map((c, i) => (
              <div key={c._id || i} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div>
                  <p className="text-xs font-black text-white">{c.agreementNumber || `AGR-${String(i + 1).padStart(3, '0')}`}</p>
                  <p className="text-[9px] font-bold text-[#444c56] uppercase tracking-wider">{c.customerName} · {c.siteName}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${c.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    c.status === 'Expired' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-bg-active text-text-dim border-border-main'
                    }`}>{c.status || 'Draft'}</span>
                  <p className="text-[8px] font-mono text-[#444c56] mt-1">{c.billingCycle} billing</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div >

      {/* Pending Billing Alert */}
      {
        pendingInvoices.length > 0 && (
          <div className="p-4 bg-[#ffa657]/5 border border-[#ffa657]/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#ffa657]/10 rounded-xl">
                <DollarSign size={16} className="text-[#ffa657]" />
              </div>
              <div>
                <p className="text-sm font-black text-text-main">{pendingInvoices.length} Pending Invoice{pendingInvoices.length > 1 ? 's' : ''}</p>
                <p className="text-[10px] font-mono text-orange-500">Total Outstanding: ₹{pendingAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <button onClick={() => state.setState({ view: 'fmc-invoices' })}
              className="px-5 py-2 bg-[#ffa657]/10 border border-[#ffa657]/30 text-[#ffa657] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#ffa657]/20 transition-all">
              Review
            </button>
          </div>
        )
      }
    </div >
  );
};

export default FMCDashboard;
