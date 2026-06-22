import React, { useState } from 'react';
import { state } from '../state';
import { hasPermission, showNotification } from '../utils';
import { Plus, Clock, Fuel, AlertCircle, X, Calendar, Search } from 'lucide-react';

const FMCDailyHours = () => {
  const { fmcDailyHours = [], machines = [], fmcContracts = [], fmcSupervisors = [], user } = state.data;

  React.useEffect(() => {
    if (state?.data?.machines?.length === 0 && state.ensureMachinesLight) {
      state.ensureMachinesLight();
    }
  }, [state?.data?.machines?.length]);

  const [showModal, setShowModal] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');
  const [filterMachine, setFilterMachine] = useState('All');
  const [filterAgreement, setFilterAgreement] = useState('All');
  const [filterParty, setFilterParty] = useState('All');

  let availableMachines = machines;
  let allowedMachineNames = machines.map(m => m.name);

  if (user?.role === 'SUPERVISOR' && user.supervisorId) {
    const assignedContracts = fmcContracts.filter(c =>
      c.assignedSupervisor === user.supervisorId || c.backupSupervisor === user.supervisorId
    );
    const assignedMachineIds = assignedContracts.flatMap(c => c.machines || []);
    availableMachines = machines.filter(m => assignedMachineIds.includes(m._id));
    allowedMachineNames = availableMachines.map(m => m.name);
  }

  const filtered = fmcDailyHours.filter(d => {
    if (filterDate && d.date !== filterDate) return false;
    if (user?.role === 'SUPERVISOR' && !allowedMachineNames.includes(d.machineName || d.machine)) return false;

    const mName = d.machineName || d.machine;
    if (filterMachine !== 'All' && mName !== filterMachine) return false;

    const contract = fmcContracts.find(c =>
      c._id === d.contractId ||
      (c.machines || []).some(mid => machines.find(m => m._id === mid)?.name === mName)
    );

    if (filterAgreement !== 'All' && contract?.agreementNumber !== filterAgreement) return false;
    if (filterParty !== 'All' && contract?.customerName !== filterParty) return false;

    if (search) {
      const s = search.toLowerCase();
      const party = contract?.customerName || '';
      const agr = contract?.agreementNumber || '';
      const mach = mName || '';
      if (!party.toLowerCase().includes(s) && !agr.toLowerCase().includes(s) && !mach.toLowerCase().includes(s)) return false;
    }

    return { ...d, contract };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const contractMachineMap = machines.reduce((acc, m) => {
    const contract = fmcContracts.find(c => (c.machines || []).includes(m._id));
    acc[m.name] = contract;
    return acc;
  }, {});

  const todayHours = fmcDailyHours
    .filter(d => d.date === new Date().toISOString().split('T')[0])
    .reduce((s, d) => s + (d.totalHours || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-text-main tracking-tight uppercase italic">Daily Machine Hours</h2>
            <p className="text-[10px] font-bold text-text-dim/60 uppercase tracking-[0.2em] mt-1 font-mono">
              Hour Meter Tracking Node — {todayHours.toFixed(0)} hrs logged today
            </p>
          </div>
          {hasPermission(user, 'fmc', 'create') && (
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#f0883e] text-black text-[12px] font-black rounded-2xl hover:bg-[#ffab70] transition-all shadow-xl shadow-orange-500/20 active:scale-95">
              <Plus size={16} /> LOG MACHINE HOURS
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-bg-card border border-border-main rounded-2xl">
          <div className="relative flex-1 min-w-[300px]">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/60" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Party, Machine, Agreement..."
              className="w-full pl-10 pr-4 py-3 bg-bg-deep border border-border-main rounded-xl text-xs text-text-main font-bold focus:border-[#f0883e] outline-none transition-all" />
          </div>

          <div className="flex items-center gap-2">
            <select value={filterMachine} onChange={e => setFilterMachine(e.target.value)}
              className="bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-xs text-[#768390] font-bold focus:border-[#f0883e] outline-none hover:bg-[#161b22] transition-colors">
              <option value="All">All Machines</option>
              {allowedMachineNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>

            <select value={filterAgreement} onChange={e => setFilterAgreement(e.target.value)}
              className="bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-xs text-[#768390] font-bold focus:border-[#f0883e] outline-none hover:bg-[#161b22] transition-colors">
              <option value="All">All Agreements</option>
              {[...new Set(fmcContracts.map(c => c.agreementNumber))].map(num => <option key={num} value={num}>{num}</option>)}
            </select>

            <select value={filterParty} onChange={e => setFilterParty(e.target.value)}
              className="bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-xs text-[#768390] font-bold focus:border-[#f0883e] outline-none hover:bg-[#161b22] transition-colors">
              <option value="All">All Parties</option>
              {[...new Set(fmcContracts.map(c => c.customerName))].map(name => <option key={name} value={name}>{name}</option>)}
            </select>

            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim/60" />
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                className="pl-9 pr-4 py-3 bg-bg-deep border border-border-main rounded-xl text-xs text-text-dim font-bold focus:border-[#f0883e] outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Entries', value: filtered.length, color: '#f0883e' },
          { label: 'Total Hours', value: filtered.reduce((s, d) => s + (d.totalHours || 0), 0).toFixed(0), color: '#58a6ff' },
          { label: 'Avg per Machine', value: filtered.length ? (filtered.reduce((s, d) => s + (d.totalHours || 0), 0) / filtered.length).toFixed(1) : '0', color: '#3fb950' },
          { label: 'Idle Hours', value: filtered.reduce((s, d) => s + (d.idleHours || 0), 0).toFixed(0), color: '#ffa657' },
        ].map(k => (
          <div key={k.label} className="bg-bg-card border border-border-main rounded-2xl p-5 flex flex-col justify-between h-28">
            <span className="text-[10px] font-black text-text-dim/60 uppercase tracking-widest">{k.label}</span>
            <p className="text-3xl font-mono font-black tracking-tighter" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Entries Table */}
      <div className="bg-bg-card border border-border-main rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-bg-active border-b border-border-main">
              {['Date', 'Agreement / Party', 'Machine', 'Start Meter', 'End Meter', 'Total Hrs', 'Idle Hrs', 'Fuel (L)', 'Remarks'].map(h => (
                <th key={h} className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/50">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-16 text-center text-[10px] font-bold text-text-dim/60 uppercase tracking-widest">No hour entries for selected date</td></tr>
            ) : filtered.map((d, i) => {
              const mName = d.machineName || d.machine;
              const contract = d.contract || contractMachineMap[mName];

              return (
                <tr key={d._id || i} className="hover:bg-bg-active transition-colors border-b border-border-main/20 last:border-0">
                  <td className="px-5 py-5 font-mono text-xs text-text-dim">{d.date}</td>
                  <td className="px-5 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-[#f0883e] text-xs tracking-tight">{contract?.agreementNumber || '—'}</span>
                      <span className="text-[9px] font-bold text-text-dim/60 uppercase mt-0.5 max-w-[120px] truncate" title={contract?.customerName}>
                        {contract?.customerName || 'No Contract Found'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-5">
                    <span className="font-black text-text-main text-xs px-2 py-1 bg-bg-deep rounded-md border border-border-main">{mName}</span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-text-dim">{d.startMeter || '—'}</td>
                  <td className="px-5 py-4 font-mono text-xs text-text-dim">{d.endMeter || '—'}</td>
                  <td className="px-5 py-4">
                    <span className="font-mono font-black text-[#3fb950] text-sm">{d.totalHours || 0}</span>
                    <span className="text-[9px] text-text-dim/60 ml-1">hrs</span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-[#ffa657]">{d.idleHours || 0}</td>
                  <td className="px-5 py-4 font-mono text-xs text-text-dim">{d.fuelConsumption || '—'}</td>
                  <td className="px-5 py-4 text-xs text-text-dim max-w-xs truncate">{d.remarks || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && <HourEntryModal onClose={() => setShowModal(false)} machines={availableMachines} />}
    </div>
  );
};

const HourEntryModal = ({ onClose, machines }) => {
  const { fmcContracts = [], fmcDailyHours = [] } = state.data;
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    machineName: '', contractId: '',
    startMeter: '', endMeter: '', idleHours: 0,
    fuelConsumption: '', remarks: ''
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleMachineChange = (e) => {
    const mName = e.target.value;
    const pastEntries = fmcDailyHours
      .filter(d => (d.machineName || d.machine) === mName)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const lastMeter = pastEntries.length > 0 ? pastEntries[0].endMeter : '';

    setForm(p => ({ ...p, machineName: mName, startMeter: lastMeter || '' }));
  };

  const totalHours = form.startMeter && form.endMeter
    ? Math.max(0, parseFloat(form.endMeter) - parseFloat(form.startMeter))
    : 0;

  const handleSave = async () => {
    if (!form.machineName || !form.date) {
      showNotification('Machine and Date are required', 'error');
      return;
    }
    if (totalHours < 0) {
      showNotification('End meter cannot be less than start meter', 'error');
      return;
    }
    const result = await state.saveFMCDailyHour({ ...form, totalHours });
    if (result.success) { showNotification('Hours logged successfully', 'success'); onClose(); }
    else showNotification(result.message || 'Save failed', 'error');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-bg-card border border-border-main rounded-3xl shadow-2xl">
        <div className="px-8 py-5 border-b border-border-main flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-text-main uppercase">Log Machine Hours</h2>
            <p className="text-[9px] font-mono text-text-dim/60 uppercase tracking-widest">FMC Daily Hour Entry Protocol</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-active rounded-xl text-text-dim hover:text-text-main transition-colors"><X size={18} /></button>
        </div>
        <div className="p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Date</p>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Machine</p>
              <select value={form.machineName} onChange={handleMachineChange}
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none">
                <option value="">Select machine...</option>
                {machines.map(m => <option key={m._id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Start Hour Meter</p>
              <input type="number" value={form.startMeter} onChange={e => set('startMeter', e.target.value)}
                placeholder="e.g. 1250"
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">End Hour Meter</p>
              <input type="number" value={form.endMeter} onChange={e => set('endMeter', e.target.value)}
                placeholder="e.g. 1258"
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Idle Hours</p>
              <input type="number" value={form.idleHours} onChange={e => set('idleHours', parseFloat(e.target.value) || 0)}
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Fuel Consumption (L)</p>
              <input type="number" value={form.fuelConsumption} onChange={e => set('fuelConsumption', e.target.value)}
                className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none" />
            </div>
          </div>
          {/* Auto-computed total */}
          {(form.startMeter || form.endMeter) && (
            <div className={`p-4 rounded-xl border ${totalHours < 0 ? 'bg-[#f85149]/5 border-[#f85149]/30' : 'bg-[#3fb950]/5 border-[#3fb950]/30'}`}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: totalHours < 0 ? '#f85149' : '#3fb950' }}>
                {totalHours < 0 ? '⚠ Negative Mismatch Detected' : 'Auto-Computed Total'}
              </p>
              <p className="text-2xl font-mono font-black text-text-main">{Math.max(0, totalHours).toFixed(1)} <span className="text-sm text-text-dim/60">hrs</span></p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold text-text-dim mb-1.5 uppercase tracking-wider">Operator Remarks</p>
            <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)}
              rows={3} placeholder="Any notes about machine condition, performance issues..."
              className="w-full bg-bg-deep border border-border-main rounded-lg px-4 py-2.5 text-sm text-text-main font-bold focus:border-[#f0883e] outline-none resize-none" />
          </div>
        </div>
        <div className="px-8 py-5 border-t border-border-main flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 border border-border-main text-text-dim rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-text-main transition-colors">Cancel</button>
          <button onClick={handleSave}
            className="px-8 py-2.5 bg-[#f0883e] text-black font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#ffab70] transition-all">
            LOG HOURS
          </button>
        </div>
      </div>
    </div>
  );
};

export default FMCDailyHours;
