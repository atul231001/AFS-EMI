import React, { useState } from 'react';
import { state } from '../state';
import { hasPermission, showNotification, confirmAction } from '../utils';
import Pagination from './Pagination.jsx';
import {
  Plus, Search, AlertTriangle, Camera, Edit3, Trash2,
  Clock, User, Wrench, ChevronUp, ChevronDown, X, Check, ListOrdered, ChevronLeft, ChevronRight
} from 'lucide-react';

// ── Ticket Form Modal ──────────────────────────────────────────────────────
const TicketFormModal = ({ ticket, onClose, machines, fmcContracts }) => {
  const { user, ticketStatuses = [], approvalFlows = [], employees = [], fmcSupervisors = [], roles = [] } = state.data;
  const [form, setForm] = useState(ticket || {
    ticketNumber: `TKT-${Date.now().toString().slice(-6)}`,
    contractId: '', machineName: '', breakdownType: 'Mechanical',
    severity: 'Medium', description: '', location: '',
    hourReading: '', status: 'Requested', photos: []
  });
  const [approvalNotes, setApprovalNotes] = useState('');

  const getTicketActiveApproverId = (t) => {
    if (!t || ['Closed', 'Resolved', 'Rejected'].includes(t.status)) return null;

    let superId = t.supervisorId;
    if (!superId && t.contractId) {
      const contract = fmcContracts.find(c => c._id === t.contractId);
      if (contract && contract.assignedSupervisor) {
        const superv = fmcSupervisors.find(s => s.name === contract.assignedSupervisor || s._id === contract.assignedSupervisor);
        if (superv) superId = superv._id.toString();
      }
    }

    let flow = null;
    const ticketFlows = approvalFlows.filter(f => f.type === 'TICKET' || !f.type);
    if (superId) {
      const supervisor = fmcSupervisors.find(s => s._id?.toString() === superId?.toString());
      if (supervisor && supervisor.approvalFlowId) {
        flow = ticketFlows.find(f => f.isActive && f._id?.toString() === supervisor.approvalFlowId?.toString());
      }
      if (!flow) {
        flow = ticketFlows.find(f => f.isActive && f.supervisorId === superId);
      }
    }
    if (!flow) {
      flow = ticketFlows.find(f => f.isActive && (!f.supervisorId || f.supervisorId === ''));
    }
    if (!flow) return null;

    const stepIdx = t.currentStepIndex || 0;
    if (stepIdx >= flow.steps.length) return null;

    const activeStep = flow.steps[stepIdx];
    if (!activeStep) return null;

    return (activeStep.approverId?._id || activeStep.approverId)?.toString() || null;
  };

  const getStepApproverName = (step) => {
    const stepApprover = step.approverId || {};
    return stepApprover.name || 'Designated Approver';
  };

  const getAvailableMachines = () => {
    if (!form.contractId) return machines;
    const contract = fmcContracts.find(c => c._id === form.contractId);
    if (!contract) return machines;
    return machines.filter(m =>
      (contract.machines || []).some(mid => mid === m._id || mid === m.machineId || mid === m.name)
    );
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleMachineChange = (e) => {
    const mName = e.target.value;
    const { fmcDailyHours = [] } = state.data;
    const pastEntries = fmcDailyHours
      .filter(d => (d.machineName || d.machine) === mName)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastMeter = pastEntries.length > 0 ? pastEntries[0].endMeter : '';
    const contract = fmcContracts.find(c =>
      (c.machines || []).some(mid => machines.find(m => m._id === mid || m.machineId === mid || m.name === mid)?.name === mName)
    );
    setForm(p => ({
      ...p,
      machineName: mName,
      hourReading: lastMeter || p.hourReading,
      contractId: contract ? contract._id : p.contractId
    }));
  };

  const handleSave = async () => {
    if (!form.machineName || !form.description) {
      showNotification('Machine and description are required', 'error');
      return;
    }
    const result = await state.saveFMCTicket(form);
    if (result.success) {
      showNotification(ticket ? 'Ticket Updated' : 'Ticket Raised', 'success');
      onClose();
    } else {
      showNotification(result.message || 'Save failed', 'error');
    }
  };

  const handleApproveAction = async (action) => {
    const result = await state.approveTicket(ticket._id, action, approvalNotes);
    if (result.success) {
      showNotification(`Ticket ${action === 'Approved' ? 'Approved' : 'Rejected'} successfully`, 'success');
      onClose();
    } else {
      showNotification(result.message || 'Operation failed', 'error');
    }
  };

  // Determine which statuses are assignable by the current user
  const flowStatuses = approvalFlows.flatMap(f => f.steps || []).map(s => s.statusId?.name || s.statusId).filter(Boolean);
  const adminStatuses = ticketStatuses.map(s => s.name);
  const dynamicStatuses = [...new Set([...adminStatuses, ...flowStatuses])];

  // Ensure current ticket's status is included so dropdown displays it correctly
  if (form.status && !dynamicStatuses.includes(form.status)) {
    dynamicStatuses.unshift(form.status);
  }
  // Ensure "Requested" is included for new tickets
  if (!ticket && !dynamicStatuses.includes('Requested')) {
    dynamicStatuses.unshift('Requested');
  }

  const availableStatuses = dynamicStatuses.filter((statusName, idx, self) => {
    if (self.indexOf(statusName) !== idx) return false;

    // Check custom status user permission
    const customStatus = ticketStatuses.find(s => s.name === statusName);
    if (!customStatus) return true; // Default/fallback statuses have no restrictions

    const allowedUsers = customStatus.allowedUsers || [];
    if (allowedUsers.length === 0) return true; // No restrictions

    const currentUserId = user?._id?.toString();
    return allowedUsers.some(u => (u._id || u).toString() === currentUserId) || user?.email === 'oem@liugong.com';
  });

  // Resolve supervisor context based on logged-in user or selected contract
  let supervisorId = null;
  if (ticket && ticket.supervisorId) {
    supervisorId = ticket.supervisorId.toString();
  } else if (!ticket && user?.role === 'SUPERVISOR') {
    supervisorId = (user.supervisorId?._id || user.supervisorId)?.toString();
  } else if (form.contractId) {
    const contract = fmcContracts.find(c => c._id === form.contractId);
    if (contract && contract.assignedSupervisor) {
      const superv = fmcSupervisors.find(s => s.name === contract.assignedSupervisor);
      if (superv) {
        supervisorId = superv._id.toString();
      }
    }
  }

  // Find active flow (supervisor-specific first, falling back to global default)
  let activeFlow = null;
  const ticketFlows = approvalFlows.filter(f => f.type === 'TICKET');
  if (supervisorId) {
    const supervisor = fmcSupervisors.find(s => s._id?.toString() === supervisorId?.toString());
    if (supervisor && supervisor.approvalFlowId) {
      activeFlow = ticketFlows.find(f => f.isActive && f._id?.toString() === supervisor.approvalFlowId?.toString());
    }
    if (!activeFlow) {
      activeFlow = ticketFlows.find(f => f.isActive && f.supervisorId === supervisorId);
    }
  }
  if (!activeFlow) {
    activeFlow = ticketFlows.find(f => f.isActive && (!f.supervisorId || f.supervisorId === ''));
  }

  const currentStepIndex = ticket ? ticket.currentStepIndex || 0 : 0;

  // Permit editing if it is a new ticket OR the supervisor edits before the approval starts
  const isAdmin = user?.role === 'ADMIN' || user?.email === 'oem@liugong.com' || (user?.roleId?.name || '').toUpperCase().includes('ADMIN');
  const canEditFields = !ticket
    ? user?.role === 'SUPERVISOR'
    : (user?.role === 'SUPERVISOR' && (ticket.currentStepIndex || 0) === 0 && ticket.status === 'Requested');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-bg-card border border-border-main rounded-3xl shadow-2xl my-8">
        <div className="px-8 py-5 border-b border-border-main flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-text-main uppercase">
              {ticket ? (canEditFields ? 'Edit Ticket Details' : 'View Ticket Details') : 'Raise Breakdown Ticket'}
            </h2>
            <p className="text-[9px] font-mono text-text-dim/60 uppercase tracking-widest">FMC Service Desk — Incident Protocol</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-active rounded-xl text-text-dim hover:text-text-main transition-colors"><X size={18} /></button>
        </div>
        <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Ticket Number</p>
              <input value={form.ticketNumber} readOnly
                className="w-full bg-bg-active border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-dim font-mono font-bold outline-none cursor-not-allowed" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Severity</p>
              <select value={form.severity} onChange={e => set('severity', e.target.value)} disabled={!canEditFields}
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none disabled:opacity-75 disabled:cursor-not-allowed">
                <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Machine</p>
              <select value={form.machineName} onChange={handleMachineChange} disabled={!canEditFields}
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none disabled:opacity-75 disabled:cursor-not-allowed">
                <option value="">Select machine...</option>
                {getAvailableMachines().map(m => <option key={m._id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Breakdown Type</p>
              <select value={form.breakdownType} onChange={e => set('breakdownType', e.target.value)} disabled={!canEditFields}
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none disabled:opacity-75 disabled:cursor-not-allowed">
                <option>Mechanical</option><option>Electrical</option><option>Hydraulic</option><option>Engine</option><option>Transmission</option><option>Other</option>
              </select>
            </div>
            {ticket && (
              <div>
                <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Status</p>
                <select value={form.status} onChange={e => set('status', e.target.value)} disabled={!canEditFields}
                  className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none disabled:opacity-75 disabled:cursor-not-allowed">
                  {availableStatuses.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Hour Meter Reading</p>
              <input type="number" value={form.hourReading} onChange={e => set('hourReading', e.target.value)} disabled={!canEditFields}
                placeholder="Machine hours at breakdown"
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none disabled:opacity-75 disabled:cursor-not-allowed" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Location</p>
              <input value={form.location} onChange={e => set('location', e.target.value)} disabled={!canEditFields}
                placeholder="Site / GPS coordinates"
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none disabled:opacity-75 disabled:cursor-not-allowed" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">FMC Contract</p>
              <select value={form.contractId} onChange={e => set('contractId', e.target.value)} disabled={!canEditFields}
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none disabled:opacity-75 disabled:cursor-not-allowed">
                <option value="">Select contract...</option>
                {fmcContracts.map(c => <option key={c._id} value={c._id}>{c.agreementNumber} — {c.customerName}</option>)}
              </select>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Breakdown Description</p>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} disabled={!canEditFields}
              rows={3} placeholder="Describe the breakdown in detail..."
              className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none resize-none disabled:opacity-75 disabled:cursor-not-allowed" />
          </div>

          {/* ── Visual preview of workflow steps when raising a new ticket ── */}
          {activeFlow && !ticket && (
            <div className="border-t border-border-main/50 pt-6 mt-6 animate-in fade-in duration-300">
              <h4 className="text-[10px] font-black text-text-dim uppercase tracking-wider mb-4 flex items-center gap-2">
                <ListOrdered size={12} className="text-primary animate-pulse" /> Intended Approval Sequence
              </h4>
              <p className="text-[10px] text-text-dim/80 mb-3">
                Raising this ticket will automatically submit it to the active verification chain:
              </p>
              <div className="space-y-2">
                {activeFlow.steps.map((step, idx) => {
                  const stepStatus = step.statusId || {};
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-bg-active border border-border-main/60 rounded-2xl">
                      <div className="w-5 h-5 rounded-full bg-border-main text-text-dim flex items-center justify-center text-[9px] font-mono font-black shrink-0">
                        {step.sequence}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-text-main uppercase">{getStepApproverName(step, supervisorId)}</p>
                        <p className="text-[8px] text-text-dim mt-0.5 uppercase tracking-wide">
                          Applied Status on Approval: <span style={{ color: stepStatus.color || '#f0883e' }} className="font-black">{stepStatus.name || '—'}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Approval Flow Tracking Timeline ── */}
          {activeFlow && ticket && (
            <div className="border-t border-border-main/50 pt-6 mt-6">
              <h4 className="text-[10px] font-black text-text-dim uppercase tracking-wider mb-4 flex items-center gap-2">
                <ListOrdered size={12} className="text-primary animate-pulse" /> Ticket Approval Sequence
              </h4>

              <div className="space-y-3">
                {activeFlow.steps.map((step, idx) => {
                  const stepStatus = step.statusId || {};
                  const stepApprover = step.approverId || {};
                  const isCompleted = idx < currentStepIndex;
                  const isActiveStep = idx === currentStepIndex;

                  const historyMatch = ticket.approvalHistory?.find(h =>
                    (h.approverId?._id || h.approverId)?.toString() === (stepApprover._id || stepApprover)?.toString() &&
                    h.status === stepStatus.name
                  );

                  return (
                    <div key={idx} className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${isActiveStep
                      ? 'bg-primary/5 border-primary/40 shadow-lg shadow-primary/5'
                      : isCompleted
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-black/10 border-transparent opacity-60'
                      }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-black shrink-0 ${isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isActiveStep
                          ? 'bg-primary text-white animate-pulse shadow-[0_0_8px_var(--color-primary)]'
                          : 'bg-slate-800 text-slate-500'
                        }`}>
                        {isCompleted ? <Check size={10} /> : step.sequence}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-text-main uppercase">
                            {getStepApproverName(step, supervisorId)}
                          </p>
                          {isCompleted && (
                            <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">Completed</span>
                          )}
                          {isActiveStep && (
                            <span className="text-[8px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded animate-pulse">Awaiting Decision</span>
                          )}
                        </div>

                        <p className="text-[9px] text-text-dim mt-0.5 uppercase tracking-wide">
                          Transitions ticket status to: <span style={{ color: stepStatus.color || '#f0883e' }} className="font-black">{stepStatus.name || '—'}</span>
                        </p>

                        {historyMatch && (
                          <div className="mt-2 text-[10px] text-text-dim/80 bg-black/20 p-2.5 border border-border-main rounded-xl">
                            <p className="font-bold text-[8px] uppercase tracking-wider text-text-main mb-1">
                              Action: {historyMatch.action} by {historyMatch.approverName}
                            </p>
                            {historyMatch.notes && <p className="italic">"{historyMatch.notes}"</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Approval interactive box */}
              {currentStepIndex < activeFlow.steps.length && (() => {
                const activeApproverId = getTicketActiveApproverId(ticket);
                const isCurrentUserApprover = user?._id?.toString() === activeApproverId;

                if (!isCurrentUserApprover && !isAdmin) return null;

                return (
                  <div className="bg-bg-deep border border-primary/20 rounded-2xl p-5 mt-5 space-y-4 shadow-xl">
                    <p className="text-[10px] font-black text-primary uppercase tracking-wider">Awaiting your approval protocol</p>

                    <textarea
                      value={approvalNotes}
                      onChange={e => setApprovalNotes(e.target.value)}
                      placeholder="Add comments or review notes (optional)..."
                      rows={2}
                      className="w-full bg-bg-card border border-border-main rounded-xl px-4 py-2.5 text-xs font-bold text-text-main focus:border-[#f0883e] outline-none resize-none"
                    />

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproveAction('Rejected')}
                        className="flex-1 py-2.5 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Reject Ticket
                      </button>
                      <button
                        onClick={() => handleApproveAction('Approved')}
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-500/20"
                      >
                        Approve & Advance
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
        <div className="px-8 py-5 border-t border-border-main flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 border border-border-main text-text-dim rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-text-main transition-colors">
            {canEditFields ? 'Cancel' : 'Close'}
          </button>
          {canEditFields && (
            <button onClick={handleSave}
              className="px-8 py-2.5 bg-[#f85149] text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-400 transition-all shadow-lg shadow-red-500/20">
              {ticket ? 'UPDATE TICKET' : 'RAISE TICKET'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Tickets List ───────────────────────────────────────────────────────────
const FMCTickets = () => {
  const { fmcTickets = [], machines = [], fmcContracts = [], user, approvalFlows = [], ticketStatuses = [], fmcSupervisors = [], employees = [], roles = [] } = state.data;

  React.useEffect(() => {
    if (state?.data?.machines?.length === 0 && state.ensureMachinesLight) {
      state.ensureMachinesLight();
    }
  }, [state?.data?.machines?.length]);

  const [search, setSearch] = useState('');
  const [filterSev, setFilterSev] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isAdmin = user?.role === 'ADMIN' || user?.email === 'oem@liugong.com' || (user?.roleId?.name || '').toUpperCase().includes('ADMIN');
  const isSupervisor = user?.role === 'SUPERVISOR';
  const isApprover = !isAdmin && !isSupervisor;
  const [activeTab, setActiveTab] = useState(isAdmin || isSupervisor ? 'ALL' : 'MY_APPROVALS');

  const getTicketActiveApproverId = (t) => {
    if (!t || ['Closed', 'Resolved', 'Rejected'].includes(t.status)) return null;

    let superId = t.supervisorId;
    if (!superId && t.contractId) {
      const contract = fmcContracts.find(c => c._id === t.contractId);
      if (contract && contract.assignedSupervisor) {
        const superv = fmcSupervisors.find(s => s.name === contract.assignedSupervisor || s._id === contract.assignedSupervisor);
        if (superv) superId = superv._id.toString();
      }
    }

    let flow = null;
    const ticketFlows = approvalFlows.filter(f => f.type === 'TICKET' || !f.type);
    if (superId) {
      const supervisor = fmcSupervisors.find(s => s._id?.toString() === superId?.toString());
      if (supervisor && supervisor.approvalFlowId) {
        flow = ticketFlows.find(f => f.isActive && f._id?.toString() === supervisor.approvalFlowId?.toString());
      }
      if (!flow) {
        flow = ticketFlows.find(f => f.isActive && f.supervisorId === superId);
      }
    }
    if (!flow) {
      flow = ticketFlows.find(f => f.isActive && (!f.supervisorId || f.supervisorId === ''));
    }
    if (!flow) return null;

    const stepIdx = t.currentStepIndex || 0;
    if (stepIdx >= flow.steps.length) return null;

    const activeStep = flow.steps[stepIdx];
    if (!activeStep) return null;

    return (activeStep.approverId?._id || activeStep.approverId)?.toString() || null;
  };

  const getNextApproverName = (t) => {
    const activeApproverId = getTicketActiveApproverId(t);
    if (!activeApproverId) return '—';
    const emp = employees.find(e => e._id === activeApproverId);
    return emp ? emp.name : '—';
  };

  const isTicketPendingForUser = (t) => {
    const activeApproverId = getTicketActiveApproverId(t);
    return activeApproverId && user?._id?.toString() === activeApproverId;
  };

  const isTicketCompletedForUser = (t) => {
    const activeApproverId = getTicketActiveApproverId(t);
    const hasApprovedBefore = t.approvalHistory?.some(h =>
      (h.approverId?._id || h.approverId)?.toString() === user?._id?.toString()
    );
    return hasApprovedBefore && user?._id?.toString() !== activeApproverId;
  };

  const getSupervisorName = (t) => {
    if (!t.supervisorId) return '—';
    const s = fmcSupervisors.find(sup => sup._id?.toString() === t.supervisorId?.toString());
    return s ? s.name : '—';
  };
  let availableMachines = machines;
  let availableContracts = fmcContracts;
  let allowedMachineNames = machines.map(m => m.name);

  if (user?.role === 'SUPERVISOR') {
    const supervisorIdStr = (user.supervisorId?._id || user.supervisorId)?.toString();
    const supervisorObj = fmcSupervisors.find(s =>
      (supervisorIdStr && s._id?.toString() === supervisorIdStr) ||
      (user.name && s.name?.toLowerCase().trim() === user.name?.toLowerCase().trim())
    );
    const supervisorName = supervisorObj ? supervisorObj.name : (user.name || '');
    const resolvedSupervisorId = supervisorObj ? supervisorObj._id?.toString() : supervisorIdStr;

    const supervisorNameClean = supervisorName.toLowerCase().trim();
    const matchedContracts = fmcContracts.filter(c => {
      const assignedSupClean = (c.assignedSupervisor || '').toLowerCase().trim();
      const backupSupClean = (c.backupSupervisor || '').toLowerCase().trim();
      return (
        assignedSupClean === supervisorNameClean ||
        backupSupClean === supervisorNameClean ||
        (resolvedSupervisorId && assignedSupClean === resolvedSupervisorId.toLowerCase().trim()) ||
        (resolvedSupervisorId && backupSupClean === resolvedSupervisorId.toLowerCase().trim()) ||
        (supervisorObj && supervisorObj.contractId && c._id?.toString() === supervisorObj.contractId.toString())
      );
    });

    if (matchedContracts.length > 0) {
      availableContracts = matchedContracts;
      const assignedMachineIds = availableContracts.flatMap(c => c.machines || []);
      const matchedMachines = machines.filter(m =>
        assignedMachineIds.includes(m._id?.toString()) ||
        assignedMachineIds.includes(m.name) ||
        assignedMachineIds.includes(m.machineId)
      );
      if (matchedMachines.length > 0) {
        availableMachines = matchedMachines;
      }
      allowedMachineNames = availableMachines.map(m => m.name);
    }
  }

  // Compute filtered tickets based on search and filters
  const filtered = fmcTickets.filter(t => {
    // Search filter (ticket number, description, machine name, location)
    const matchesSearch = search
      ? (t.ticketNumber?.toString().includes(search) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
        (t.machineName && t.machineName.toLowerCase().includes(search.toLowerCase())) ||
        (t.location && t.location.toLowerCase().includes(search.toLowerCase())))
      : true;
    // Severity filter
    const matchesSev = filterSev === 'All' || t.severity === filterSev;
    // Status filter
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    // Tab-specific filtering
    if (activeTab === 'MY_APPROVALS') {
      return matchesSearch && matchesSev && matchesStatus && isTicketPendingForUser(t);
    }
    if (activeTab === 'COMPLETED_APPROVALS') {
      return matchesSearch && matchesSev && matchesStatus && isTicketCompletedForUser(t);
    }
    if (activeTab === 'APPROVER') {
      // Show all tickets (could be refined to pending approvals if needed)
      return matchesSearch && matchesSev && matchesStatus;
    }
    // Default ALL tab
    return matchesSearch && matchesSev && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const ok = await confirmAction('Delete Ticket?', 'This will permanently remove the ticket.', 'warning');
    if (ok) {
      await state.deleteFMCTicket(id);
      showNotification('Ticket deleted', 'success');
    }
  };

  const sevColor = { Critical: '#f85149', High: '#ffa657', Medium: '#ffd700', Low: '#3fb950' };

  const defaultStatusColor = {
    Requested: '#f85149', 'In Progress': '#ffa657', 'Awaiting Parts': '#d2a8ff',
    Resolved: '#3fb950', Closed: '#768390', 'Awaiting Approval': '#3b82f6'
  };

  const getStatusColor = (statusName) => {
    const customMatch = ticketStatuses.find(s => s.name === statusName);
    if (customMatch) return customMatch.color;
    return defaultStatusColor[statusName] || '#768390';
  };

  const getFilterStatuses = () => {
    const flowStatuses = approvalFlows.flatMap(f => f.steps || []).map(s => s.statusId?.name || s.statusId).filter(Boolean);
    const adminStatuses = ticketStatuses.map(s => s.name);
    const ticketActiveStatuses = fmcTickets.map(t => t.status).filter(Boolean);
    return [...new Set([...adminStatuses, ...flowStatuses, ...ticketActiveStatuses])];
  };

  return (
    <div className="space-y-6 animate-in fade-in h-[calc(100vh-140px)] overflow-hidden flex flex-col">
      <div className="flex flex-col gap-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-text-main tracking-tight uppercase italic">FMC Service Desk</h2>
            <p className="text-[10px] font-bold text-text-dim/60 uppercase tracking-[0.2em] mt-1 font-mono">
              Breakdown Ticket Management — {fmcTickets.filter(t => !['Closed', 'Resolved'].includes(t.status)).length} Open
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select value={filterSev} onChange={e => setFilterSev(e.target.value)}
              className="bg-bg-card border border-border-main rounded-xl px-3 py-2.5 text-xs text-text-dim font-bold focus:border-[#f0883e] outline-none">
              <option>All</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-bg-card border border-border-main rounded-xl px-3 py-2.5 text-xs text-text-dim font-bold focus:border-[#f0883e] outline-none">
              <option value="All">All</option>
              {getFilterStatuses().map(statusName => (
                <option key={statusName} value={statusName}>{statusName}</option>
              ))}
            </select>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim/60" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..." className="pl-9 pr-4 py-2.5 bg-bg-card border border-border-main rounded-xl text-xs text-text-main font-bold focus:border-[#f0883e] outline-none w-56" />
            </div>
            {user?.role === 'SUPERVISOR' && (
              <button onClick={() => { setEditingTicket(null); setShowModal(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#f85149] text-white text-[11px] font-black rounded-xl hover:bg-red-400 transition-all shadow-lg shadow-red-500/20">
                <Plus size={14} /> RAISE TICKET
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 border-b border-border-main mb-6 px-2">
          {isAdmin && (
            <button
              className={`pb-3 px-1 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'ALL' ? 'border-[#f0883e] text-[#f0883e]' : 'border-transparent text-text-dim hover:text-text-main'}`}
              onClick={() => setActiveTab('ALL')}
            >
              All Tickets
            </button>
          )}
          {isSupervisor && (
            <button
              className={`pb-3 px-1 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'ALL' ? 'border-[#f0883e] text-[#f0883e]' : 'border-transparent text-text-dim hover:text-text-main'}`}
              onClick={() => setActiveTab('ALL')}
            >
              My Tickets
            </button>
          )}
          {isApprover && (
            <>
              <button
                className={`flex items-center gap-2 pb-3 px-1 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'MY_APPROVALS' ? 'border-[#f0883e] text-[#f0883e]' : 'border-transparent text-text-dim hover:text-text-main'}`}
                onClick={() => setActiveTab('MY_APPROVALS')}
              >
                My Pending Approvals
                {fmcTickets.filter(isTicketPendingForUser).length > 0 && (
                  <span className="bg-[#f0883e] text-black w-5 h-5 flex items-center justify-center rounded-full text-[9px] animate-pulse">
                    {fmcTickets.filter(isTicketPendingForUser).length}
                  </span>
                )}
              </button>
              <button
                className={`pb-3 px-1 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'COMPLETED_APPROVALS' ? 'border-[#f0883e] text-[#f0883e]' : 'border-transparent text-text-dim hover:text-text-main'}`}
                onClick={() => setActiveTab('COMPLETED_APPROVALS')}
              >
                Completed Approvals
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-bg-card border border-border-main rounded-2xl overflow-hidden shadow-2xl flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left relative">
            <thead className="sticky top-0 z-[40] bg-bg-active shadow-sm">
              <tr className="border-b border-border-main">
                {['Ticket #', 'Supervisor', 'Machine / Type', 'Severity', 'Description', 'Location', 'Status', 'Next Approver', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-dim bg-bg-active">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/50">
              {paginatedData.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center text-[10px] font-bold text-text-dim/60 uppercase tracking-widest">No tickets found</td></tr>
              ) : paginatedData.map((t, i) => (
                <tr key={t._id || i} onClick={() => { setEditingTicket(t); setShowModal(true); }} className="hover:bg-bg-active transition-colors group cursor-pointer">
                  <td className="px-5 py-4">
                    <span className="font-mono font-black text-[#f0883e] text-xs">{t.ticketNumber}</span>
                    <p className="text-[8px] font-mono text-text-dim/60 mt-0.5">{t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-CA') : '—'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-text-main font-bold">{getSupervisorName(t)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-black text-text-main text-xs">{t.machineName || '—'}</p>
                    <p className="text-[9px] font-mono text-text-dim/60">{t.breakdownType}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border"
                      style={{ background: `${sevColor[t.severity]}15`, color: sevColor[t.severity], borderColor: `${sevColor[t.severity]}30` }}>
                      {t.severity}
                    </span>
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <p className="text-xs text-text-dim truncate">{t.description}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-text-dim">{t.location || '—'}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border"
                      style={{ background: `${getStatusColor(t.status)}15`, color: getStatusColor(t.status), borderColor: `${getStatusColor(t.status)}30` }}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {getNextApproverName(t) || '—'}
                  </td>
                  <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      {user?.role === 'SUPERVISOR' && (t.currentStepIndex || 0) === 0 && t.status === 'Requested' && (
                        <button onClick={() => { setEditingTicket(t); setShowModal(true); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-active text-text-dim hover:text-[#f0883e] hover:bg-[#f0883e]/10 border border-border-main transition-all">
                          <Edit3 size={13} />
                        </button>
                      )}
                      {user?.role === 'SUPERVISOR' && (t.currentStepIndex || 0) === 0 && t.status === 'Requested' && (
                        <button onClick={(e) => handleDelete(t._id, e)}
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
      {/* Pagination Footer */}
      <Pagination 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        itemName="Tickets"
        className="bg-bg-card border border-border-main p-4 flex flex-col sm:flex-row items-center justify-between flex-shrink-0 mt-4 rounded-xl shadow-lg gap-4 sm:gap-0"
      />
      {showModal && <TicketFormModal ticket={editingTicket} onClose={() => { setShowModal(false); setEditingTicket(null); }} machines={availableMachines} fmcContracts={availableContracts} />}
    </div>
  );
};

export default FMCTickets;
