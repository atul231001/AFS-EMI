import React, { useState } from 'react';
import { state } from '../state';
import { hasPermission, showNotification, confirmAction } from '../utils';
import { Plus, Search, User, Phone, MapPin, Shield, Edit3, Trash2, X, Check } from 'lucide-react';

const FMCSupervisors = () => {
  const { fmcSupervisors = [], fmcContracts = [], approvalFlows = [], user } = state.data;
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = fmcSupervisors.filter(s =>
    [s.name, s.employeeId, s.mobile, s.region].some(v =>
      (v || '').toLowerCase().includes(search.toLowerCase())
    )
  );

  const handleDelete = async (id) => {
    const ok = await confirmAction('Remove Supervisor?', 'This will revoke the supervisor from the FMC node.', 'warning');
    if (ok) {
      await state.deleteFMCSupervisor(id);
      showNotification('Supervisor removed', 'success');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-text-main tracking-tight uppercase italic">FMC Field Operations</h2>
          <p className="text-[10px] font-bold text-text-dim/60 uppercase tracking-[0.2em] mt-1 font-mono">
            Supervisor Registry — {fmcSupervisors.length} Authorized Agents
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim/60" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search supervisors..."
              className="pl-9 pr-4 py-2.5 bg-bg-card border border-border-main rounded-xl text-xs text-text-main font-bold focus:border-[#f0883e] outline-none w-56" />
          </div>
          {hasPermission(user, 'fmc', 'create') && user?.role === 'OEM' && (
            <button onClick={() => { setEditing(null); setShowModal(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#f0883e] text-black text-[11px] font-black rounded-xl hover:bg-[#ffab70] transition-all shadow-lg shadow-orange-500/20">
              <Plus size={14} /> ADD SUPERVISOR
            </button>
          )}
        </div>
      </div>

      <div className="bg-bg-card border border-border-main rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-bg-active border-b border-border-main">
              {['Supervisor', 'Employee ID', 'Mobile', 'Skills', 'Assigned Staff', 'Region', 'Status', 'Assigned Contract', 'Approval Flow', 'Actions'].map(h => (
                <th key={h} className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/50">
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-5 py-16 text-center text-[10px] font-bold text-text-dim/60 uppercase tracking-widest">No supervisors found</td></tr>
            ) : filtered.map((s, i) => {
              const assignedContract = fmcContracts.find(c => c.assignedSupervisor === s.name || c._id === s.contractId);
              const assignedFlow = approvalFlows.find(f => f._id === s.approvalFlowId);
              return (
                <tr key={s._id || i} className="hover:bg-bg-active transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f0883e]/20 to-[#f0883e]/5 border border-[#f0883e]/20 flex items-center justify-center text-[#f0883e] font-black text-sm">
                        {(s.name || 'S')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-text-main text-xs">{s.name}</p>
                        <p className="text-[8px] font-mono text-text-dim/60 uppercase">Field Agent</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-text-dim">{s.employeeId || '—'}</td>
                  <td className="px-5 py-4 font-mono text-xs text-text-dim">{s.mobile || '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(s.skills || []).slice(0, 2).map((sk, j) => (
                        <span key={j} className="px-1.5 py-0.5 bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/20 rounded text-[8px] font-black">{sk}</span>
                      ))}
                    </div>
                  </td>
                  {/* Assigned Staff (mapped employees) */}
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                      {(s.assignedEmployees || []).map((empId, j) => {
                        const emp = (state.data.employees || []).find(e => e._id === empId);
                        return emp ? (
                          <span key={j} className="px-1.5 py-0.5 bg-[#ffa657]/10 text-[#ffa657] border border-[#ffa657]/20 rounded text-[8px] font-bold">{emp.name}</span>
                        ) : null;
                      })}
                      {(!s.assignedEmployees || s.assignedEmployees.length === 0) && (
                        <span className="text-[9px] text-text-dim/60 italic">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-text-dim">{s.region || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${s.status === 'Active' ? 'bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/20' : 'bg-text-dim/10 text-text-dim border-border-main'
                      }`}>{s.status || 'Active'}</span>
                  </td>
                  <td className="px-5 py-4">
                    {assignedContract
                      ? <span className="font-mono text-xs text-[#f0883e]">{assignedContract.agreementNumber}</span>
                      : <span className="text-[9px] text-text-dim/60 italic">Unassigned</span>}
                  </td>
                  <td className="px-5 py-4">
                    {assignedFlow ? (
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border bg-[#f0883e]/10 text-[#f0883e] border-[#f0883e]/20">
                        {assignedFlow.name}
                      </span>
                    ) : (
                      <span className="text-[9px] text-text-dim/60 italic">Default Flow</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      {hasPermission(user, 'fmc', 'update') && user?.role === 'OEM' && (
                        <button onClick={() => { setEditing(s); setShowModal(true); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-active text-text-dim hover:text-[#f0883e] hover:bg-[#f0883e]/10 border border-border-main transition-all">
                          <Edit3 size={13} />
                        </button>
                      )}
                      {hasPermission(user, 'fmc', 'delete') && user?.role === 'OEM' && (
                        <button onClick={() => handleDelete(s._id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-active text-text-dim hover:text-rose-500 hover:bg-rose-500/10 border border-border-main transition-all">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && <SupervisorModal supervisor={editing} onClose={() => { setShowModal(false); setEditing(null); }} />}
    </div>
  );
};

const SupervisorModal = ({ supervisor, onClose }) => {
  const { fmcContracts = [], employees = [], approvalFlows = [] } = state.data;
  const [form, setForm] = useState(supervisor ? {
    ...supervisor,
    assignedEmployees: supervisor.assignedEmployees || [],
    approvalFlowId: supervisor.approvalFlowId || ''
  } : {
    name: '', employeeId: '', mobile: '', skills: [], region: '',
    status: 'Active', contractId: '', shiftStart: '', shiftEnd: '',
    assignedEmployees: [], approvalFlowId: ''
  });
  const [email, setEmail] = useState(supervisor ? supervisor.email || '' : '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name) { showNotification('Name is required', 'error'); return; }
    if (!supervisor && (!email || !password)) {
      showNotification('Email and Password are required for new supervisors', 'error');
      return;
    }
    // Include email/password in the payload so backend can create the user account
    const result = await state.saveFMCSupervisor({ ...form, email, password });
    if (result.success) { showNotification('Supervisor saved & login account created', 'success'); onClose(); }
    else showNotification(result.message || 'Save failed', 'error');
  };

  const allSkills = ['Mechanical', 'Electrical', 'Hydraulic', 'Engine Overhaul', 'Welding', 'Diagnostics'];

  // Filter employees belonging to OEM division
  const oemEmployees = (employees || []).filter(emp => {
    const rName = (emp.roleId?.name || emp.role || '').toUpperCase();
    return rName === 'OEM' || rName.includes('ADMIN') || rName.includes('SUPER');
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-bg-card border border-border-main rounded-3xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-8 py-5 border-b border-border-main flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black text-text-main uppercase">{supervisor ? 'Edit Supervisor' : 'Add Supervisor'}</h2>
            <p className="text-[9px] font-mono text-text-dim/60 uppercase tracking-widest">FMC Field Operations Node</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-active rounded-xl text-text-dim hover:text-text-main transition-colors"><X size={18} /></button>
        </div>
        <div className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Profile Fields */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Full Name', key: 'name', placeholder: 'Supervisor name' },
              { label: 'Employee ID', key: 'employeeId', placeholder: 'EMP-XXXXX' },
              { label: 'Mobile', key: 'mobile', placeholder: '+91 XXXXX XXXXX' },
              { label: 'Region', key: 'region', placeholder: 'Assigned region' },
            ].map(f => (
              <div key={f.key}>
                <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">{f.label}</p>
                <input value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                  className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none" />
              </div>
            ))}
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Status</p>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none">
                <option>Active</option><option>On Leave</option><option>Inactive</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Assign Contract</p>
              <select value={form.contractId} onChange={e => set('contractId', e.target.value)}
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none">
                <option value="">Unassigned</option>
                {fmcContracts.map(c => <option key={c._id} value={c._id}>{c.agreementNumber}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Assign Approval Flow</p>
              <select value={form.approvalFlowId || ''} onChange={e => set('approvalFlowId', e.target.value)}
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none">
                <option value="">No Approval Flow (Uses Default)</option>
                {approvalFlows.map(f => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned Staff (OEM Employees) */}
          <div>
            <p className="text-[10px] font-bold text-text-dim mb-2 uppercase tracking-wider">Assign Staff / Employees to Supervisor</p>
            <div className="border border-border-main bg-bg-deep rounded-2xl p-4 max-h-[160px] overflow-y-auto custom-scrollbar space-y-1.5">
              {oemEmployees.map(emp => {
                const isSelected = (form.assignedEmployees || []).includes(emp._id);
                return (
                  <div
                    key={emp._id}
                    onClick={() => {
                      const list = form.assignedEmployees || [];
                      set('assignedEmployees', isSelected ? list.filter(id => id !== emp._id) : [...list, emp._id]);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${isSelected
                        ? 'bg-[#f0883e]/10 border-[#f0883e]/30 text-[#f0883e]'
                        : 'bg-black/10 border-transparent hover:bg-black/25 text-text-dim'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#f0883e] text-black' : 'bg-slate-800 text-slate-500'}`}>
                        <User size={12} />
                      </div>
                      <span className="text-xs font-bold uppercase">{emp.name} ({emp.email})</span>
                    </div>
                    {isSelected && <Check size={14} className="stroke-[3]" />}
                  </div>
                );
              })}
              {oemEmployees.length === 0 && (
                <p className="text-[9px] font-bold text-text-dim/50 uppercase tracking-widest text-center py-4">No employees registered under OEM clearance</p>
              )}
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-[10px] font-bold text-text-dim mb-2 uppercase tracking-wider">Skills</p>
            <div className="flex flex-wrap gap-2">
              {allSkills.map(sk => {
                const selected = (form.skills || []).includes(sk);
                return (
                  <button key={sk} type="button"
                    onClick={() => set('skills', selected ? (form.skills || []).filter(s => s !== sk) : [...(form.skills || []), sk])}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black border transition-all ${selected ? 'bg-[#f0883e]/10 border-[#f0883e]/40 text-[#f0883e]' : 'bg-bg-deep border-border-main text-text-dim/60 hover:text-text-dim'}`}>
                    {sk}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Credentials Section */}
          <div className="border border-border-main rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-bg-active flex items-center gap-2 border-b border-border-main">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
              <p className="text-[10px] font-black text-[#3fb950] uppercase tracking-widest">Supervisor Login Credentials</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-[#3fb950]/5 border border-[#3fb950]/20 rounded-xl">
                <p className="text-[9px] font-bold text-[#3fb950] leading-relaxed">
                  {supervisor
                    ? 'Enter new email/password to update login credentials. Leave password blank to keep existing.'
                    : 'These credentials will allow this supervisor to log in to the FMC Supervisor Dashboard.'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">
                  Login Email {!supervisor && <span className="text-[#f85149]">*</span>}
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="supervisor@company.com"
                  className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#3fb950] outline-none transition-colors"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">
                  Password {!supervisor && <span className="text-[#f85149]">*</span>}
                  {supervisor && <span className="text-text-dim/40 ml-2 font-normal normal-case tracking-normal">(leave blank to keep existing)</span>}
                </p>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={supervisor ? '••••••••' : 'Set login password'}
                    className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 pr-12 text-sm text-text-main font-bold focus:border-[#3fb950] outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim/60 hover:text-text-dim transition-colors text-xs font-bold"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-8 py-5 border-t border-border-main flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 border border-border-main text-text-dim rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-text-main transition-colors">Cancel</button>
          <button onClick={handleSave}
            className="px-8 py-2.5 bg-[#f0883e] text-black font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#ffab70] transition-all">
            {supervisor ? 'UPDATE' : 'AUTHORIZE & CREATE LOGIN'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FMCSupervisors;
