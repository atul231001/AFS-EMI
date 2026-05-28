import React, { useState } from 'react';
import { state } from '../state';
import Modal from './Modal.jsx';
import RBACSettings from './RBACSettings.jsx';
import { hasPermission } from '../utils';
import { Palette, ShieldAlert } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
  const { user, theme, settings } = state.data;
  const [activeTab, setActiveTab] = useState('interface');
  const currentSettings = user?.settings || settings;

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

  const isOEM = user?.role === 'OEM';
  const canManageRBAC = hasPermission(user, 'settings', 'update');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Terminal Settings"
      subtitle={activeTab === 'interface' ? "Interface & Accessibility Node" : "Security & Protocol Access Control"}
      maxWidth={activeTab === 'interface' ? "max-w-md" : "max-w-5xl"}
    >
      <div className="flex flex-col gap-6 py-4 h-full min-h-[500px]">
        {/* Tabs */}
        {isOEM && (
          <div className="flex gap-1 p-1 bg-black/20 rounded-xl border border-white/5 shrink-0">
            <button
              onClick={() => setActiveTab('interface')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'interface' ? 'bg-[#f0883e] text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Palette size={14} /> Interface
            </button>
            {canManageRBAC && (
              <button
                onClick={() => setActiveTab('rbac')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'rbac' ? 'bg-[#f0883e] text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <ShieldAlert size={14} /> Security Protocol
              </button>
            )}
          </div>
        )}

        <div className="flex-1">
          {activeTab === 'interface' ? (
            <div className="space-y-8 animate-fade-in">
              {/* Theme Selection */}
              <div className="space-y-3">
                <label className="text-[0.625rem] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Atmosphere Protocol</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleThemeToggle('light')}
                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${theme === 'light' ? 'border-primary bg-primary/5 text-primary' : 'border-border-main bg-bg-active text-text-dim'}`}
                  >
                    <i className="fas fa-sun"></i>
                    <span className="text-[0.625rem] font-black uppercase">Light</span>
                  </button>
                  <button
                    onClick={() => handleThemeToggle('dark')}
                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${theme === 'dark' ? 'border-primary bg-primary/10 text-primary' : 'border-border-main bg-bg-active text-text-dim'}`}
                  >
                    <i className="fas fa-moon"></i>
                    <span className="text-[0.625rem] font-black uppercase">Dark</span>
                  </button>
                </div>
              </div>

              {/* Font Scaling */}
              <div className="space-y-3">
                <label className="text-[0.625rem] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Interface Scaling</label>
                <div className="flex items-center gap-4 p-4 bg-bg-active rounded-2xl border border-border-main">
                  <span className="text-[0.5rem] font-black text-text-dim">AA</span>
                  <input
                    type="range"
                    min="12"
                    max="20"
                    step="1"
                    value={currentSettings.fontSize}
                    onChange={(e) => handleFontSizeChange(e.target.value)}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-lg font-black text-text-main">AA</span>
                </div>
              </div>

              {/* Typography */}
              <div className="space-y-3">
                <label className="text-[0.625rem] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Typography Engine</label>
                <select
                  value={currentSettings.fontFamily}
                  onChange={(e) => handleFontFamilyChange(e.target.value)}
                  className="w-full p-4 bg-bg-active border border-border-main rounded-2xl text-xs font-black uppercase tracking-widest cursor-pointer text-text-main outline-none focus:border-primary"
                >
                  <option value="Inter">Inter (Default)</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Outfit">Outfit</option>
                  <option value="Monospace">System Mono</option>
                </select>
              </div>

              {/* Accent Color Selection */}
              <div className="space-y-3">
                <label className="text-[0.625rem] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Color Matrix Configuration</label>
                <div className="flex flex-wrap gap-2 p-4 bg-bg-active rounded-2xl border border-border-main">
                  {[
                    { name: 'LiuGong', color: '#f0883e' },
                    { name: 'Cobalt', color: '#3b82f6' },
                    { name: 'Emerald', color: '#10b981' },
                    { name: 'Crimson', color: '#ef4444' },
                    { name: 'Purple', color: '#8b5cf6' },
                    { name: 'Slate', color: '#475569' }
                  ].map(c => (
                    <button
                      key={c.color}
                      onClick={() => state.updateSettings({ ...currentSettings, accentColor: c.color })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${currentSettings.accentColor === c.color ? 'border-text-main scale-125' : 'border-transparent hover:scale-110'}`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[8px] font-black text-text-dim uppercase">Custom</span>
                    <input
                      type="color"
                      value={currentSettings.accentColor || '#f0883e'}
                      onChange={(e) => state.updateSettings({ ...currentSettings, accentColor: e.target.value })}
                      className="w-8 h-8 bg-transparent cursor-pointer border-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border-main flex justify-end">
                <button
                  onClick={onClose}
                  className="btn-primary !px-10 !py-4"
                >
                  Synchronize Changes
                </button>
              </div>
            </div>
          ) : (
            <RBACSettings />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
