import React, { useState, useEffect } from 'react';
import { state } from '../state';
import {
  Layout,
  Users,
  Construction,
  CreditCard,
  HandCoins,
  Settings as SettingsIcon,
  Shield,
  Trash2,
  Plus,
  Lock,
  History,
  Check,
  X,
  ChevronRight,
  Wrench,
  Layers,
  CalendarCheck,
  FileCheck
} from 'lucide-react';
import { showNotification, hasPermission } from '../utils';

const RBACSettings = () => {
  const [stateData, setStateData] = useState(state.data);

  useEffect(() => {
    return state.subscribe(data => {
      setStateData(data);
    });
  }, []);

  const { roles, user } = stateData;
  const oemRoles = roles.filter(r => r.name.toLowerCase() !== 'customer');
  const [selectedRoleId, setSelectedRoleId] = useState(oemRoles[0]?._id || null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [editingPermissions, setEditingPermissions] = useState(null);

  useEffect(() => {
    if (oemRoles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(oemRoles[0]._id);
    }
  }, [oemRoles, selectedRoleId]);

  const selectedRole = oemRoles.find(r => r._id === selectedRoleId);

  const modules = [
    { key: 'dashboard', label: 'Dashboard', icon: Layout, actions: ['read'] },
    { key: 'customers', label: 'Customers', icon: Users, actions: ['read', 'create', 'update', 'delete'] },
    { key: 'machines', label: 'Machines', icon: Construction, actions: ['read', 'create', 'update', 'delete'] },
    { key: 'financing', label: 'Financing', icon: CreditCard, actions: ['read', 'create', 'update', 'delete'] },
    { key: 'new_financing', label: 'New Financing', icon: Plus, actions: ['read', 'create'], isSub: true },
    { key: 'financed_machines', label: 'Financed Machines', icon: History, actions: ['read', 'update'], isSub: true },
    { key: 'settlements', label: 'Settlements', icon: HandCoins, actions: ['read', 'create', 'update', 'delete'] },
    { key: 'employees', label: 'Employees', icon: Users, actions: ['read', 'create', 'update', 'delete'] },
    { key: 'fmc', label: 'FMC Module', icon: Layers, actions: ['read', 'create', 'update', 'delete'] },
    { key: 'service_desk', label: 'Service Desk', icon: Wrench, actions: ['read', 'create', 'update', 'delete'] },
    { key: 'settings_parent', label: 'Settings', icon: SettingsIcon, actions: ['read'] },
    { key: 'settings_general', label: 'General Settings', icon: SettingsIcon, actions: ['read', 'update'], isSub: true },
    { key: 'settings_rbac', label: 'Role Permissions', icon: Lock, actions: ['read', 'update'], isSub: true },
    { key: 'financing_scheduling', label: 'Scheduling Stage', icon: CalendarCheck, actions: ['read', 'approve'], isSub: true },
    { key: 'financing_invoicing', label: 'Invoice Stage', icon: FileCheck, actions: ['read', 'approve'], isSub: true }
  ];

  const handleTogglePermission = (module, action) => {
    if (!selectedRole || selectedRole.name.toLowerCase() === 'admin') return;

    const isMaster = user?.email === 'oem@liugong.com';
    if (!isMaster && !hasPermission(user, 'settings_rbac', 'update')) {
      showNotification('Access Denied: Insufficient clearance to modify security protocols.', 'error');
      return;
    }

    const permissions = JSON.parse(JSON.stringify(selectedRole.permissions || {}));
    if (!permissions[module]) permissions[module] = {};

    const currentStatus = !!permissions[module][action];
    const newStatus = !currentStatus;
    permissions[module][action] = newStatus;

    if (newStatus === true) {
      if (module === 'new_financing' || module === 'financed_machines') {
        if (!permissions.financing) permissions.financing = {};
        permissions.financing.read = true;
      }
      if (module === 'settings_general' || module === 'settings_rbac') {
        if (!permissions.settings_parent) permissions.settings_parent = {};
        permissions.settings_parent.read = true;
      }
    }

    state.updateRole(selectedRoleId, { permissions }).then(() => {
      showNotification(`PROTOCOL MODIFIED: ${module.toUpperCase()} ${action.toUpperCase()} updated.`);
    }).catch(err => {
      showNotification(`Protocol Sync Failed: ${err.message}`, 'error');
    });
  };

  const handleCreateRole = async () => {
    if (!newRoleName) return;

    const defaultPermissions = {
      dashboard: { read: true },
      customers: { read: true, create: false, update: false, delete: false },
      machines: { read: true, create: false, update: false, delete: false },
      financing: { read: true, create: false, update: false, delete: false },
      new_financing: { read: true, create: false },
      financed_machines: { read: true, update: false },
      settlements: { read: true, create: false, update: false, delete: false },
      employees: { read: false, create: false, update: false, delete: false },
      fmc: { read: true, create: false, update: false, delete: false },
      service_desk: { read: true, create: false, update: false, delete: false },
      settings_parent: { read: true },
      settings_general: { read: true, update: false },
      settings_rbac: { read: false, update: false },
      financing_scheduling: { read: true, approve: false },
      financing_invoicing: { read: true, approve: false }
    };

    try {
      const newRole = await state.addRole({
        name: newRoleName,
        permissions: defaultPermissions
      });
      setNewRoleName('');
      setIsCreating(false);
      setSelectedRoleId(newRole._id);
      showNotification('New Profile Saved');
    } catch (error) {
      console.error('Role initialization failed', error);
      showNotification('Save Failed: Duplicate or Invalid Selection', 'error');
    }
  };

  const handleDeleteRole = async (id) => {
    if (confirm('Are you sure you want to decommission this security profile?')) {
      await state.deleteRole(id);
      if (selectedRoleId === id) setSelectedRoleId(oemRoles[0]?._id || null);
      showNotification('Security Profile Removed', 'error');
    }
  };

  return (
    <div className="flex gap-8 min-h-[calc(100vh-250px)] animate-fade-in">
      {/* Sidebar: Role List */}
      <div className="w-72 flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-[#f0883e] uppercase tracking-widest">OEM Personnel Profiles</h3>
          {hasPermission(user, 'settings_rbac', 'create') && (
            <button
              onClick={() => setIsCreating(true)}
              className="p-1.5 bg-[#f0883e]/10 text-[#f0883e] rounded-md hover:bg-[#f0883e]/20 transition-all"
            >
              <Plus size={14} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
          {oemRoles.length > 0 ? oemRoles.map(role => (
            <div
              key={role._id}
              onClick={() => setSelectedRoleId(role._id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group cursor-pointer ${selectedRoleId === role._id
                ? 'bg-[#f0883e]/10 border-[#f0883e]/30 shadow-lg'
                : 'bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/[0.02] text-slate-400'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedRoleId === role._id ? 'bg-[#f0883e] text-black' : 'bg-bg-deep dark:bg-slate-800 text-text-dim group-hover:bg-bg-active dark:group-hover:bg-slate-700'}`}>
                  <Shield size={16} />
                </div>
                <div className="text-left">
                  <p className={`text-xs font-bold uppercase tracking-tight ${selectedRoleId === role._id ? 'text-[#f0883e]' : 'text-text-main'}`}>{role.name}</p>
                  <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">LVL-{role._id.substring(role._id.length - 4)}</p>
                </div>
              </div>
              {selectedRoleId === role._id && role.name.toLowerCase() !== 'admin' && hasPermission(user, 'settings_rbac', 'delete') && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteRole(role._id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-500 transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )) : (
            <div className="p-10 text-center border-2 border-dashed border-white/5 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">No OEM Roles Detected</p>
            </div>
          )}
        </div>
      </div>

      {/* Main: Permission Matrix */}
      <div className="flex-1 glass-card overflow-hidden flex flex-col !p-0">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
              OEM Administration Matrix: <span className="text-[#f0883e]">{selectedRole?.name || 'Select Role'}</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-1 uppercase">Configure personnel clearances for internal system modules</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4 px-4 py-2 bg-black/20 rounded-lg border border-white/5">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-[8px] font-black text-slate-400 uppercase">Authorized</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-slate-700 rounded-full border border-white/10"></div>
                <span className="text-[8px] font-black text-slate-400 uppercase">Restricted</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <table key={selectedRoleId} className="w-full table-fixed text-left border-collapse">
            <thead className="sticky top-0 bg-[#0d1117] z-20 border-b border-white/5 shadow-sm">
              <tr>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[40%]">System Module</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-[12%]">Read</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-[12%]">Create</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-[12%]">Update</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-[12%]">Approve</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-[12%]">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {modules.map((mod) => (
                <tr key={mod.key} className="border-b border-[#444c56]/30 hover:bg-white/5 transition-colors">
                  <td className="py-4 pl-4 pr-3">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${mod.isSub ? 'bg-slate-800/50' : 'bg-[#f0883e]/10'} flex items-center justify-center border border-white/5 shadow-inner`}>
                        <mod.icon size={18} className={mod.isSub ? 'text-slate-500' : 'text-[#f0883e]'} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-tighter text-white">{mod.label}</p>
                        <p className="text-[8px] font-mono text-[#444c56] uppercase tracking-[0.2em] mt-1">MODULE_{mod.key.toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  {['read', 'create', 'update', 'approve', 'delete'].map(action => (
                    <td key={action} className="p-6 text-center">
                      {mod.actions.includes(action) ? (
                        <button
                          onClick={() => handleTogglePermission(mod.key, action)}
                          disabled={selectedRole?.name?.toLowerCase() === 'admin'}
                          className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all duration-300 ${(selectedRole?.permissions[mod.key]?.[action] || selectedRole?.name?.toLowerCase() === 'admin')
                            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                            : 'bg-slate-200/50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                            } ${selectedRole?.name?.toLowerCase() === 'admin' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
                        >
                          {(selectedRole?.permissions[mod.key]?.[action] || selectedRole?.name?.toLowerCase() === 'admin') ? (
                            <Check size={18} className="stroke-[3]" />
                          ) : (
                            <X size={16} className="stroke-[3]" />
                          )}
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-100 mx-auto">
                          <Lock size={15} className="stroke-[3]" />
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
          <div className="glass-card !max-w-md w-full border-[#f0883e]/20 p-10 space-y-8 animate-scale-in shadow-[0_0_50px_rgba(240,136,62,0.1)]">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-[#f0883e] text-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Shield size={32} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Initialize Profile</h3>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Define new system security role</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Protocol Identity (Role Name)</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. OPERATIONS_MANAGER"
                  className="w-full bg-black/40 border-white/10 rounded-2xl p-4 text-xs font-bold text-white uppercase tracking-wider focus:border-[#f0883e]/50 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setIsCreating(false)} className="flex-1 py-4 bg-slate-800 text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-700 transition-all">Cancel</button>
              <button onClick={handleCreateRole} className="flex-1 py-4 bg-[#f0883e] text-black font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-[#ffab70] transition-all shadow-lg">Confirm and Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RBACSettings;
