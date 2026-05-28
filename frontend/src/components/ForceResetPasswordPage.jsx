import React, { useState } from 'react';
import { state } from '../state';

const ForceResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = state.data.user || {};
  const accentColor = user.role === 'OEM' ? '#f0883e' : '#3b82f6';

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const result = await state.forceResetPassword(newPassword);
    if (result.success) {
      setSuccess('Credentials successfully initialized. Launching dashboard...');
    } else {
      setError(result.message);
    }
  };

  const handleLogout = () => {
    state.logout();
  };

  return (
    <div className="w-full min-h-screen bg-bg-deep flex items-center justify-center p-8 overflow-hidden relative transition-colors duration-500">
      {/* Realistic Background */}
      <div className="absolute inset-0 z-0">
        <img src="/excavator_reveal.png" className="w-full h-full object-cover opacity-60 scale-105" alt="Site" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-deep via-bg-deep/40 to-transparent"></div>
        <div
          className="absolute top-1/4 left-1/3 w-96 h-96 blur-[120px] rounded-full animate-pulse"
          style={{ backgroundColor: `${accentColor}1a` }}
        ></div>
      </div>

      {/* Holographic Terminal */}
      <div className="max-w-md w-full p-8 rounded-[2.5rem] bg-bg-card/40 backdrop-blur-xl border border-border-main shadow-2xl z-20 space-y-6 animate-fade-in">
        <div className="flex flex-col items-center gap-2">
          <p className="text-[0.5rem] font-black text-slate-500 uppercase tracking-[0.4em]">Initial Login Protocol</p>
          <p className="text-[0.5rem] font-black text-slate-500 uppercase tracking-[0.4em]">Initial Login Protocol</p>
        </div>

        <div className="text-center space-y-4">
          <div className="h-12 w-full flex items-center justify-center">
            <img
              src="/logo.png"
              alt="LiuGong Logo"
              className="logo-image h-full object-contain brightness-0 invert opacity-90"
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter italic">
              Password <span style={{ color: accentColor }}>Initialization</span>
            </h2>
            <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed">
              Your account has been initialized with a temporary access key. Please configure a personalized cipher to secure your node access.
            </p>
            <div className="h-px w-12 mx-auto bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          </div>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[0.5625rem] font-black text-slate-500 uppercase tracking-[0.2em] ml-4">New Password</label>
            <div className="relative group">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="relative w-full !bg-bg-active/10 !border-border-main !text-text-main !p-4 !rounded-[1.25rem] focus:!bg-bg-active/20 transition-all outline-none text-xs"
                style={{ borderColor: 'var(--border-main)' }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[0.5625rem] font-black text-slate-500 uppercase tracking-[0.2em] ml-4">Confirm New Password</label>
            <div className="relative group">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="relative w-full !bg-bg-active/10 !border-border-main !text-text-main !p-4 !rounded-[1.25rem] focus:!bg-bg-active/20 transition-all outline-none text-xs"
                style={{ borderColor: 'var(--border-main)' }}
              />
            </div>
          </div>

          {error && (
            <div className="text-rose-500 text-[0.5rem] font-black uppercase tracking-widest text-center p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-500 text-[0.5rem] font-black uppercase tracking-widest text-center p-3 bg-green-500/10 rounded-2xl border border-green-500/20">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 font-black rounded-[1.25rem] uppercase tracking-[0.4em] text-[0.625rem] transition-all hover:scale-[1.02] active:scale-95 shadow-2xl relative group overflow-hidden cursor-pointer bg-[#f0883e] text-black"
            style={{ background: accentColor, color: user.role === 'OEM' ? 'black' : 'white' }}
          >
            <span className="relative z-10">Initialize Credentials</span>
          </button>
        </form>

        <div className="flex justify-center px-4 text-[0.5rem] font-black text-slate-600 uppercase tracking-widest">
          <button
            type="button"
            className="hover:text-[var(--text-main)] transition-colors cursor-pointer"
            onClick={handleLogout}
          >
            <i className="fas fa-arrow-left mr-2"></i> Abort / Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForceResetPasswordPage;
