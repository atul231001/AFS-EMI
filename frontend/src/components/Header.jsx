import React from 'react';
import { state } from '../state';
import {
  Bell,
  Settings,
  Power,
  Activity,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';

const Header = () => {
  const { view, user, theme, settings, notifications } = state.data;

  const currentSettings = user?.settings || settings;

  const handleThemeToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    state.setState({ theme: nextTheme });
    if (user && currentSettings) {
      state.updateSettings({ ...currentSettings, theme: nextTheme });
    }
  };

  const viewNames = {
    'oem-dashboard': 'Strategic Analytics',
    'customer-dashboard': 'My Portfolio',
    'customers': 'Client Ledger',
    'machines': 'Equipment Catalog',
    'loans': 'Financing Hub',
    'payments': 'Ledger & Settlements',
    'my-machines': 'My Equipment',
    'customer-payments': 'Ledger Statement',
    'customer-analytics': 'Strategic Analytics'
  };

  const handleLogout = () => state.logout();

  return (
    <header className="h-16 border-b border-border-main bg-glass-bg px-6 lg:px-[4rem] flex items-center sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black text-text-main uppercase italic tracking-tighter flex items-center gap-3">
            {viewNames[view] || view.replace(/-/g, ' ')}
          </h2>
          <div className="h-6 w-px bg-border-main" />
          <div className="flex items-center gap-2 px-2.5 py-1 bg-bg-active border border-border-main rounded-md shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse shadow-[0_0_8px_#3fb950]" />
            <span className="text-[9px] font-black text-[#3fb950] font-mono uppercase tracking-widest">Active Session</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button
              onClick={handleThemeToggle}
              className="w-9 h-9 flex items-center justify-center text-text-dim hover:text-text-main transition-all hover:bg-bg-active rounded-lg group"
              title={theme === 'dark' ? "Switch to Photonic Theme" : "Switch to Abyssal Theme"}
            >
              {theme === 'dark' ? (
                <Sun size={18} className="group-hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon size={18} className="group-hover:-rotate-12 transition-transform duration-300 text-slate-400" />
              )}
            </button>

            <button
              className="w-9 h-9 flex items-center justify-center text-text-dim hover:text-text-main transition-all hover:bg-bg-active rounded-lg relative group"
              title="Notifications"
            >
              <Bell size={18} className="group-hover:rotate-12 transition-transform" />
              {notifications.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#f85149] rounded-full border border-bg-card" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-4 pl-6 border-l border-border-main">
            <div className="flex items-center gap-3 bg-bg-active border border-border-main rounded-xl pl-3 pr-1.5 py-1.5 hover:border-text-dim/50 transition-all group cursor-default shadow-lg">
              <div className="text-right">
                <p className="text-[11px] font-black text-white leading-none uppercase tracking-tight">{user?.name || 'Authorized Admin'}</p>
                <p className="text-[8px] text-[#768390] font-mono uppercase tracking-tighter mt-1 font-bold">
                  {user?.isSuperAdmin ? 'Master Node Administrator' : (user?.roleId?.name || user?.role || 'Authorized Personnel')}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-8 h-8 bg-[#f85149] text-white rounded-lg flex items-center justify-center hover:bg-[#ff7b72] transition-all shadow-lg active:scale-90"
                title="Logout"
              >
                <Power size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
