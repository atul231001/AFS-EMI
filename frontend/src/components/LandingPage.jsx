import React from 'react';
import { state } from '../state';
import { Cpu, ShieldCheck, TrendingUp, ChevronRight, Truck } from 'lucide-react';

const LandingPage = () => {
  const handleGetStarted = () => {
    state.setState({ view: 'login' });
  };

  return (
    <div className="w-full min-h-screen bg-bg-deep text-text-main selection:bg-primary/30 overflow-x-hidden transition-colors duration-500">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-between overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-bg-deep via-bg-deep/60 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-bg-deep via-transparent to-transparent z-10"></div>
          <img
            src="/liugong_hero_machine.png"
            className="w-full h-full object-cover opacity-70 scale-105 animate-slow-zoom"
            alt="Excavator"
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex items-center pt-20 pb-10">
          <div className="container mx-auto px-6 lg:px-12 z-20">
            <div className="max-w-5xl space-y-8 md:space-y-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f0883e]/10 border border-[#f0883e]/20 rounded-full animate-fade-in backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-[#f0883e] animate-pulse"></span>
                <span className="text-[#f0883e] text-[0.625rem] md:text-[0.75rem] font-black uppercase tracking-[0.4em]">The Future of Heavy Equipment Financing</span>
              </div>

              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[1.1] tracking-tighter animate-slide-up">
                EMPOWERING <br />
                <span className="text-[#f0883e] bg-gradient-to-r from-[#f0883e] to-[#ffab70] bg-clip-text text-transparent">INFRASTRUCTURE</span>
              </h1>

              <p className="text-lg md:text-2xl text-text-dim max-w-3xl font-medium leading-relaxed animate-fade-in delay-300">
                Liugong Finance Hub: Streamlined machine financing for global construction leaders. Precision engineering meets financial intelligence.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 pt-6 animate-fade-in delay-500">
                <button
                  onClick={handleGetStarted}
                  className="group px-8 md:px-12 py-5 bg-[#f0883e] text-black font-black rounded-2xl hover:bg-[#ffab70] transition-all shadow-2xl shadow-orange-500/20 uppercase tracking-widest text-[0.625rem] md:text-xs cursor-pointer flex items-center justify-center gap-3"
                >
                  Access Platform <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 md:px-12 py-5 border-2 border-border-main text-text-main font-black rounded-2xl hover:bg-bg-active transition-all uppercase tracking-widest text-[0.625rem] md:text-xs cursor-pointer">
                  Explore Catalog
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="container mx-auto px-6 lg:px-12 pb-12 z-20">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 lg:gap-0 border-t border-white/5 pt-12">
            <div className="flex flex-wrap gap-12 sm:gap-20">
              <div>
                <p className="text-[0.625rem] md:text-[0.75rem] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Global Market Presence</p>
                <p className="text-3xl md:text-5xl font-black text-white">100+ <span className="text-[#f0883e]">Countries</span></p>
              </div>
              <div>
                <p className="text-[0.625rem] md:text-[0.75rem] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Strategic Assets Managed</p>
                <p className="text-3xl md:text-5xl font-black text-white">$12.5B <span className="text-[#f0883e]">USD</span></p>
              </div>
            </div>
            <div className="flex items-center gap-6 p-4 bg-bg-card/40 border border-border-main rounded-2xl backdrop-blur-sm shadow-sm">
              <div className="text-right">
                <p className="text-[0.625rem] font-black text-text-dim uppercase tracking-[0.2em] mb-1">Official OEM Partner</p>
                <p className="text-lg md:text-xl font-black text-text-main tracking-widest">LIUGONG <span className="text-primary">PLATINUM</span></p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#f0883e] flex items-center justify-center text-black shadow-lg shadow-orange-500/20">
                <Truck size={24} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-40 bg-bg-deep/50 relative border-t border-border-main">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="mb-16 md:mb-24">
            <h2 className="text-[0.625rem] md:text-[0.75rem] font-black text-primary uppercase tracking-[0.5em] mb-4">Core Ecosystem</h2>
            <p className="text-3xl md:text-5xl font-black text-text-main max-w-2xl leading-tight">Advanced Financial Protocol for Heavy Industry</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            <FeatureCard
              icon={Cpu}
              title="Smart Amortization"
              desc="Real-time interest recalculation based on market nodes and asset health."
              accent="text-[#f0883e]"
              bg="bg-[#f0883e]/10"
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Zero Trust Audit"
              desc="Secure, encrypted settlement ledger ensuring transparent financing cycles."
              accent="text-blue-500"
              bg="bg-blue-500/10"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Asset Intelligence"
              desc="Detailed machine analytics coupled with repayment health indicators."
              accent="text-emerald-500"
              bg="bg-emerald-500/10"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, accent, bg }) => (
  <div className="p-8 md:p-12 bg-bg-card border border-border-main rounded-[2.5rem] space-y-6 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden shadow-sm">
    <div className={`w-16 h-16 ${bg} rounded-2xl flex items-center justify-center ${accent} transition-transform group-hover:scale-110`}>
      <Icon size={32} />
    </div>
    <h3 className="text-2xl font-black text-text-main">{title}</h3>
    <p className="text-text-dim font-medium leading-relaxed">{desc}</p>
    <div className="pt-4 flex items-center gap-2 text-[0.625rem] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
      Learn More <ChevronRight size={12} />
    </div>
  </div>
);

export default LandingPage;
