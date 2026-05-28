import React, { useState, useEffect } from 'react';
import { state } from '../state';
import {
  Palette, Type, Maximize2, ShieldCheck, UserCheck,
  HardHat, RefreshCw, Layout, Fingerprint, Save,
  CheckCircle2, AlertCircle, Mail
} from 'lucide-react';
import { showNotification } from '../utils';
import NotificationSettings from './NotificationSettings.jsx';

const GeneralSettings = () => {
  const { user, theme, settings, numbering, security, smtp, notifications } = state.data;
  const [activeTab, setActiveTab] = useState('ui');
  const [localNumbering, setLocalNumbering] = useState(numbering);
  const [isSaving, setIsSaving] = useState(false);

  const currentSettings = user?.settings || settings;
  const isOEM = user?.role === 'OEM';

  useEffect(() => {
    if (numbering) {
      setLocalNumbering(numbering);
    }
  }, [numbering]);

  const handleNumberingChange = (type, field, value) => {
    setLocalNumbering(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const saveIdentityProtocols = async () => {
    setIsSaving(true);
    try {
      await state.updateConfig({ numbering: localNumbering });
      showNotification('Identity Protocols Synced', 'success');
    } catch (err) {
      showNotification('Sync Failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecurityChange = (field, value) => {
    const updated = { ...security.captcha, [field]: value };
    state.updateConfig({ security: { captcha: updated } });
  };

  const handleThemeToggle = (newTheme) => {
    state.setState({ theme: newTheme });
    if (user) {
      state.updateSettings({ ...currentSettings, theme: newTheme });
    }
  };

  const handleFontSizeChange = (size) => {
    state.updateSettings({ ...currentSettings, fontSize: size });
  };

  const handleFontFamilyChange = (font) => {
    state.updateSettings({ ...currentSettings, fontFamily: font });
  };

  const tabs = [
    { id: 'ui', label: 'Appearance', icon: Palette, desc: 'UI/UX Visual Preferences' },
    ...(isOEM ? [
      { id: 'identity', label: 'ID Numbers', icon: Fingerprint, desc: 'ID Setup & Formats' },
      { id: 'security', label: 'Security Settings', icon: ShieldCheck, desc: 'Login & Verification' },
      { id: 'notifications', label: 'Emails & Notifications', icon: Mail, desc: 'Email Server & Alerts' }
    ] : [])
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8 h-full animate-fade-in">
      {/* Settings Internal Sidebar */}
      <div className="w-full md:w-64 space-y-2">
        <div className="mb-6 pl-2">
          <h2 className="text-xl font-black text-white tracking-tight italic uppercase">System Hub</h2>
          <p className="text-[9px] text-[#768390] font-mono tracking-widest uppercase">Manage System Settings</p>
        </div>

        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${activeTab === tab.id
                ? 'bg-[#f0883e]/10 border-[#f0883e]/30 text-[#f0883e]'
                : 'bg-transparent border-transparent text-[#768390] hover:bg-white/5'
              }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === tab.id ? 'bg-[#f0883e] text-black shadow-lg shadow-orange-500/20' : 'bg-[#161b22] text-[#444c56]'}`}>
              <tab.icon size={16} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">{tab.label}</p>
              <p className="text-[8px] font-bold text-[#444c56] uppercase mt-1 leading-none">{tab.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Main Settings Content Area */}
      <div className="flex-1 bg-[#161b22]/30 border border-white/5 rounded-[2.5rem] p-8 md:p-12 min-h-[600px] overflow-y-auto no-scrollbar shadow-2xl relative">
        {activeTab === 'ui' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Interface Configuration</h2>
              <p className="text-[10px] text-slate-500 font-mono tracking-[0.3em] uppercase">Visual Dynamics & Scaling</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Theme Selection */}
              <div className="glass-card p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#f0883e]/10 text-[#f0883e] rounded-xl flex items-center justify-center border border-[#f0883e]/20">
                    <Palette size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Atmosphere</h3>
                    <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">Select System Theme</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleThemeToggle('light')}
                    className={`flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer ${theme === 'light' ? 'border-[#f0883e] bg-[#f0883e]/5 text-[#f0883e]' : 'border-white/5 bg-white/[0.02] text-slate-500 hover:border-white/10'}`}
                  >
                    <i className="fas fa-sun text-2xl"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Photonic</span>
                  </button>
                  <button
                    onClick={() => handleThemeToggle('dark')}
                    className={`flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer ${theme === 'dark' ? 'border-[#f0883e] bg-[#f0883e]/10 text-[#f0883e]' : 'border-white/5 bg-white/[0.02] text-slate-500 hover:border-white/10'}`}
                  >
                    <i className="fas fa-moon text-2xl"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">Abyssal</span>
                  </button>
                </div>
              </div>

              {/* Font Scaling */}
              <div className="glass-card p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20">
                    <Maximize2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Scaling</h3>
                    <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">Global Node Scale</p>
                  </div>
                </div>

                <div className="p-8 bg-black/20 rounded-2xl border border-white/5 space-y-6">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Compact</span>
                    <span>Spacious</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="20"
                    step="1"
                    value={currentSettings.fontSize}
                    onChange={(e) => handleFontSizeChange(e.target.value)}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#f0883e]"
                  />
                  <div className="text-center font-mono text-xs text-[#f0883e] font-black italic">
                    {currentSettings.fontSize}PX VECTOR SCALE
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div className="glass-card p-8 space-y-6 md:col-span-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/20">
                    <Type size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Typeface Engine</h3>
                    <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">System Typography Control</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Inter', 'Roboto', 'Outfit', 'Monospace'].map(font => (
                    <button
                      key={font}
                      onClick={() => handleFontFamilyChange(font)}
                      className={`p-6 rounded-2xl border-2 transition-all text-center ${currentSettings.fontFamily === font ? 'border-[#f0883e] bg-[#f0883e]/5 text-[#f0883e]' : 'border-white/5 bg-white/[0.02] text-slate-500 hover:border-white/10'}`}
                    >
                      <p className="text-xl font-black mb-1" style={{ fontFamily: font === 'Monospace' ? 'monospace' : font }}>Aa</p>
                      <p className="text-[9px] font-black uppercase tracking-widest">{font === 'Monospace' ? 'Sys-Mono' : font}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'identity' && isOEM && localNumbering && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">ID Numbers</h2>
                <p className="text-[10px] text-slate-500 font-mono tracking-[0.3em] uppercase">How ID numbers are assigned</p>
              </div>
              <button
                onClick={saveIdentityProtocols}
                disabled={isSaving}
                className="px-8 py-3 bg-[#f0883e] text-black text-[10px] font-black rounded-xl uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                Confirm Protocols
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { id: 'customer', label: 'Clients', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { id: 'employee', label: 'Staff', icon: ShieldCheck, color: 'text-[#f0883e]', bg: 'bg-[#f0883e]/10' },
                { id: 'supervisor', label: 'Operations', icon: HardHat, color: 'text-blue-500', bg: 'bg-blue-500/10' }
              ].map(type => (
                <div key={type.id} className="glass-card p-6 space-y-6 group hover:border-[#f0883e]/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${type.bg} ${type.color} rounded-xl flex items-center justify-center border border-white/5`}>
                      <type.icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{type.label}</h3>
                      <p className="text-[8px] text-slate-500 font-mono uppercase mt-0.5">Allocation Rule</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest pl-1">ID Prefix</label>
                      <input
                        type="text"
                        value={localNumbering[type.id]?.prefix || ''}
                        onChange={(e) => handleNumberingChange(type.id, 'prefix', e.target.value.toUpperCase())}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-xs text-white font-mono font-bold focus:border-[#f0883e] outline-none transition-all"
                        placeholder="PREFIX"
                      />
                    </div>

                    <div className="flex p-1 bg-black/40 border border-white/5 rounded-xl">
                      {['Manual', 'Auto'].map(mode => (
                        <button
                          key={mode}
                          onClick={() => handleNumberingChange(type.id, 'mode', mode)}
                          className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${localNumbering[type.id]?.mode === mode ? 'bg-[#f0883e] text-black shadow-lg' : 'text-slate-500 hover:text-white'
                            }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>

                    {localNumbering[type.id]?.mode === 'Auto' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1.5 pt-4 border-t border-white/5">
                          <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest pl-1">Starting Sequence</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={localNumbering[type.id].nextNumber}
                              onChange={(e) => handleNumberingChange(type.id, 'nextNumber', parseInt(e.target.value) || 1)}
                              className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-xs text-white font-mono font-bold focus:border-[#f0883e] outline-none"
                            />
                            <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/5 min-w-[80px] text-center">
                              <p className="text-[8px] font-black text-[#f0883e] font-mono uppercase tracking-tighter">
                                {localNumbering[type.id].prefix}{localNumbering[type.id].nextNumber.toString().padStart(4, '0')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {localNumbering[type.id]?.mode === 'Manual' && (
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-3">
                        <AlertCircle size={14} className="text-slate-600" />
                        <p className="text-[8px] font-bold text-slate-500 uppercase leading-tight italic">
                          Manual allocation requires operator verification.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'security' && isOEM && security && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Security Settings</h2>
              <p className="text-[10px] text-slate-500 font-mono tracking-[0.3em] uppercase">Manage Login & Data Safety</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Captcha Configuration */}
              <div className="glass-card p-8 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#f0883e]/10 text-[#f0883e] rounded-xl flex items-center justify-center border border-[#f0883e]/20">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Captcha Gating</h3>
                    <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">Bot Prevention Protocols</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { id: 'onboardClient', label: 'Onboard Client Form' },
                    { id: 'authorizePersonnel', label: 'Authorize Personnel Form' },
                    { id: 'onboardSupervisor', label: 'Onboard Supervisor Form' }
                  ].map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl hover:border-white/10 transition-all">
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">{item.label}</span>
                      <button
                        onClick={() => handleSecurityChange(item.id, !security.captcha[item.id])}
                        className={`w-12 h-6 rounded-full transition-all relative ${security.captcha[item.id] ? 'bg-[#3fb950]' : 'bg-[#30363d]'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${security.captcha[item.id] ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Validation Protocols */}
              <div className="glass-card p-8 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/20">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Validation Rules</h3>
                    <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">Data Integrity Constraints</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <p className="text-[9px] text-blue-400 font-bold uppercase leading-relaxed">
                      System-wide unique validation is active for:
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {['EMAIL ADDRESS', 'CONTACT NUMBER', 'GSTIN/TAX ID', 'PAN IDENTIFIER', 'CUSTOM ID'].map(tag => (
                        <div key={tag} className="flex items-center gap-2 text-[8px] font-black text-slate-500">
                          <div className="w-1 h-1 bg-blue-500 rounded-full" /> {tag}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && isOEM && (
          <NotificationSettings />
        )}
      </div>
    </div>
  );
};

export default GeneralSettings;
