// src/main.js
import './style.css';
import { state } from './state';
import { renderSidebar } from './components/Sidebar';
import { renderDashboard } from './components/Dashboard';
import { renderCustomerManagement } from './components/CustomerManagement';
import { renderMachineManagement } from './components/MachineManagement';
import { renderLoanAssignment } from './components/LoanAssignment';
import { renderPaymentTracker } from './components/PaymentTracker';
import { showLoanDetails } from './components/DetailsView';
import { renderLandingPage, renderLoginPage } from './components/LandingPage';

/**
 * App Router/Renderer
 */
const renderApp = () => {
  const { view, user, isAuthenticated, loading } = state.data;
  const app = document.getElementById('app');

  // 1. Handle Landing & Auth Views (Full Screen)
  if (view === 'landing') {
    renderLandingPage();
    return;
  }

  if (view === 'login') {
    renderLoginPage();
    return;
  }

  if (!isAuthenticated) {
    state.setState({ view: 'landing' });
    return;
  }

  // 2. Main Application Layout (With Sidebar)
  app.innerHTML = `
    <div class="flex w-full min-h-screen">
      <aside id="sidebar" class="w-72 shrink-0"></aside>
      <main class="flex-1 p-8 transition-all overflow-x-hidden min-w-0">
        <header id="main-header" class="flex justify-between items-center mb-10"></header>
        <div id="content-area"></div>
      </main>
    </div>
  `;

  renderSidebar();

  const header = document.getElementById('main-header');
  const viewNames = {
    'oem-dashboard': 'Executive Insights',
    'customer-dashboard': 'My Portfolio',
    'customers': 'Client Ledger',
    'machines': 'Equipment Catalog',
    'loans': 'Financing Hub',
    'payments': 'Ledger & Settlements'
  };

  header.innerHTML = `
    <div class="animate-fade-in">
      <h1 class="text-2xl font-black dark:text-white capitalize tracking-tighter">${viewNames[view] || view.replace(/-/g, ' ')}</h1>
      <p class="text-slate-500 text-[0.625rem] font-black uppercase tracking-widest mt-0.5">Liugong System Hub • Active Session</p>
    </div>
    <div class="flex items-center gap-4">
      <div class="relative group">
        <button class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-[#f0883e] transition-all relative">
          <i class="fas fa-bell text-xs"></i>
          <span class="absolute top-3 right-3 w-1.5 h-1.5 bg-rose-500 rounded-full border border-[#0a0c10]"></span>
        </button>
        
        <div class="absolute right-0 top-12 w-72 bg-[#111418] border border-white/10 rounded-2xl shadow-2xl p-4 hidden group-hover:block z-[200] animate-in fade-in slide-in-from-top-2 duration-200">
          <div class="flex justify-between items-center mb-4">
            <h4 class="text-[0.5625rem] font-black uppercase tracking-widest text-white">System Alerts</h4>
            <span class="text-[0.4375rem] font-black text-[#f0883e] uppercase tracking-widest cursor-pointer hover:underline">Mark All</span>
          </div>
          <div class="space-y-2">
            ${state.data.notifications.map(n => `
              <div onclick="state.setState({view: '${n.targetView}'})" class="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-[#f0883e]/40 transition-all cursor-pointer group/note">
                <p class="text-[0.625rem] font-black text-white uppercase group-hover/note:text-[#f0883e] tracking-tight">${n.title}</p>
                <p class="text-[0.5rem] font-medium text-slate-500 mt-0.5 leading-relaxed">${n.body}</p>
                <div class="flex items-center justify-between mt-2">
                  <p class="text-[0.4375rem] font-black text-slate-700 uppercase tracking-widest">${n.time}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Settings Button -->
      <button onclick="window.showSettings()" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-[#f0883e] transition-all">
        <i class="fas fa-cog text-xs"></i>
      </button>

      <div class="h-8 w-[1px] bg-white/10 hidden md:block"></div>
      
      <div id="notification-zone" class="fixed top-8 right-8 z-[200] flex flex-col gap-3 pointer-events-none"></div>
      <div class="flex items-center gap-3 bg-[#0d0f14] border border-white/5 p-1.5 pl-4 rounded-2xl shadow-xl shadow-black/5">
        <div class="text-right">
          <div class="text-[0.6875rem] font-black dark:text-white leading-tight">${user?.name || 'User'}</div>
          <div class="text-[0.5rem] text-[#f0883e] font-black uppercase tracking-widest mt-0.5">${user?.role}</div>
        </div>
        <button id="logout-btn" class="w-9 h-9 bg-gradient-to-tr from-[#f0883e] to-yellow-400 rounded-xl flex items-center justify-center text-black font-black shadow-lg shadow-orange-500/20 transform hover:rotate-3 transition-transform">
          <i class="fas fa-power-off text-xs"></i>
        </button>
      </div>
    </div>
  `;

  document.getElementById('logout-btn').onclick = () => state.logout();

  const contentArea = document.getElementById('content-area');

  if (loading) {
    contentArea.innerHTML = `
      <div class="flex flex-col items-center justify-center py-40 animate-pulse">
        <div class="w-12 h-12 border-2 border-[#f0883e] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-[0.5625rem] font-black text-slate-500 uppercase tracking-[0.4em]">Establishing Secure Node Connection...</p>
      </div>
    `;
    return;
  }

  // Render Content based on View
  switch (view) {
    case 'oem-dashboard':
    case 'customer-dashboard':
      renderDashboard();
      break;
    case 'customers':
      renderCustomerManagement();
      break;
    case 'machines':
      renderMachineManagement();
      break;
    case 'loans':
      renderLoanAssignment();
      break;
    case 'payments':
      renderPaymentTracker();
      break;
    case 'my-machines':
      renderMyMachines();
      break;
    case 'customer-payments':
      renderCustomerPayments();
      break;
    default:
      contentArea.innerHTML = `<h2 class="text-2xl font-black dark:text-white">View Not Found: ${view}</h2>`;
  }
};

/**
 * Customer Specific Views
 */
function renderMyMachines() {
  const content = document.getElementById('content-area');
  const { loans, machines } = state.data;

  content.innerHTML = `
    <div class="space-y-4 animate-fade-in">
      <div>
        <h2 class="text-xl font-black tracking-tight dark:text-white uppercase">My Equipment</h2>
        <p class="text-slate-500 mt-1 text-[0.625rem] font-bold uppercase tracking-widest">Active equipment assets and repayment health</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        ${loans.length > 0 ? loans.map(l => {
    const machine = machines.find(m => m.name === l.machineName) || machines[0] || { img: '', images: [] };
    const totalPaid = l.schedule.filter(s => s.status === 'Paid').length;
    const progress = (totalPaid / l.schedule.length) * 100;
    const remaining = l.schedule[l.schedule.length - 1]?.balance || 0;

    return `
            <div class="glass-card !p-0 overflow-hidden flex flex-col group hover:border-[#f0883e]/30 transition-all">
              <div class="relative h-24 bg-black overflow-hidden">
                <img src="${machine.img || (machine.images && machine.images[0]) || ''}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" onerror="this.src='https://placehold.co/600x400/111/fff?text=ASSET'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-3">
                   <span class="text-[0.5rem] font-black text-white uppercase tracking-widest truncate">${l.machineName}</span>
                </div>
              </div>
              
              <div class="p-3 space-y-3">
                <div class="space-y-1">
                  <div class="flex justify-between text-[0.4375rem] font-black uppercase tracking-widest">
                    <span class="text-slate-500">Equity</span>
                    <span class="dark:text-white">${Math.round(progress)}%</span>
                  </div>
                  <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-[#f0883e] to-yellow-300" style="width: ${progress}%"></div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <p class="text-[0.4375rem] font-black text-slate-500 uppercase tracking-widest">EMI</p>
                    <p class="text-[0.6875rem] font-black text-[#f0883e]">₹${(l.emi / 1000).toFixed(1)}k</p>
                  </div>
                  <div>
                    <p class="text-[0.4375rem] font-black text-slate-500 uppercase tracking-widest">Outstanding</p>
                    <p class="text-[0.6875rem] font-black dark:text-white">₹${(remaining / 100000).toFixed(1)}L</p>
                  </div>
                </div>

                <button class="w-full py-2 bg-white/5 hover:bg-[#f0883e] hover:text-black text-white rounded-lg text-[0.5rem] font-black uppercase tracking-widest transition-all show-loan-details" data-id="${l._id}">
                  Analysis
                </button>
              </div>
            </div>
          `;
  }).join('') : `
          <div class="col-span-full py-10 text-center glass-card border-dashed">
            <p class="text-slate-500 font-bold uppercase tracking-widest text-[0.625rem]">No active assets found.</p>
          </div>
        `}
      </div>
    </div>
  `;

  content.querySelectorAll('.show-loan-details').forEach(btn => {
    btn.onclick = () => showLoanDetails(btn.dataset.id);
  });
}

function renderCustomerPayments() {
  const content = document.getElementById('content-area');
  const { payments } = state.data;

  content.innerHTML = `
    <div class="space-y-4 animate-fade-in">
       <div>
        <h2 class="text-xl font-black tracking-tight dark:text-white uppercase">Ledger Statement</h2>
        <p class="text-slate-500 mt-1 text-[0.625rem] font-bold uppercase tracking-widest">Historical settlement records for all assets</p>
      </div>

      <div class="glass-card !p-0 overflow-hidden shadow-2xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left compact-table">
            <thead>
              <tr>
                <th class="px-4 py-3">Date</th>
                <th class="px-4 py-3">Transaction ID</th>
                <th class="px-4 py-3">Amount Paid</th>
                <th class="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(p => `
                <tr class="hover:bg-white/[0.02] transition-colors">
                  <td class="px-4 py-2 text-[0.625rem] font-black text-slate-300 font-mono uppercase">${p.date}</td>
                  <td class="px-4 py-2 text-[0.5625rem] font-black text-slate-500 uppercase tracking-widest">${p._id?.substring(p._id.length - 6)}</td>
                  <td class="px-4 py-2 text-[0.6875rem] font-black text-emerald-500">₹${p.amount?.toLocaleString()}</td>
                  <td class="px-4 py-2 text-right"><span class="status-badge status-active">Settled</span></td>
                </tr>
              `).join('') || '<tr><td colspan="4" class="py-10 text-center text-slate-500 font-black uppercase tracking-widest">No history.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// Global UI Sync: Liquid Tab Indicators
window.syncTabs = () => {
  // Use a slightly longer timeout to ensure DOM layout is fully computed
  setTimeout(() => {
    document.querySelectorAll('.glass-tabs').forEach(container => {
      const activeTab = container.querySelector('.glass-tab.active');
      const indicator = container.querySelector('.tab-indicator');
      if (activeTab && indicator) {
        indicator.style.left = `${activeTab.offsetLeft}px`;
        indicator.style.width = `${activeTab.offsetWidth}px`;
        indicator.style.opacity = '1';
      }
    });
  }, 200);
};

window.addEventListener('resize', window.syncTabs);

// Initial Render
state.subscribe(() => {
  renderApp();
  window.syncTabs();
});
renderApp();
window.syncTabs();

window.showSettings = () => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-xl z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300';

  const s = state.data.user?.settings || state.data.settings;

  modal.innerHTML = `
    <div class="bg-[#0d0f14] border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
      <div class="p-8 border-b border-white/5 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-black text-white uppercase tracking-tighter italic">Interface Config</h2>
          <p class="text-[0.5rem] font-black text-slate-500 uppercase tracking-widest mt-1">Dynamic Display Protocol</p>
        </div>
        <button onclick="this.closest('.fixed').remove()" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all">
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>
      
      <div class="p-8 space-y-8">
        <!-- Font Family -->
        <div>
          <label class="text-[0.5625rem] font-black text-slate-500 uppercase tracking-widest block mb-4">Font Architecture</label>
          <div class="grid grid-cols-2 gap-3">
            ${['Inter', 'Roboto', 'Outfit', 'Monospace'].map(f => `
              <button onclick="window.updateLocalFont('${f}')" class="font-option px-4 py-4 rounded-2xl border ${s.fontFamily === f ? 'bg-[#f0883e] text-black border-transparent shadow-lg' : 'bg-white/5 text-white border-white/10 hover:border-[#f0883e]/40'} text-xs font-black transition-all" style="font-family: ${f === 'Monospace' ? 'monospace' : f}">
                ${f}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Font Size -->
        <div>
          <div class="flex justify-between items-center mb-4">
            <label class="text-[0.5625rem] font-black text-slate-500 uppercase tracking-widest">Interface Scale</label>
            <span id="font-size-val" class="text-xs font-black text-[#f0883e]">${s.fontSize}px</span>
          </div>
          <input type="range" min="10" max="24" value="${s.fontSize}" class="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#f0883e]" oninput="window.updateLocalFontSize(this.value)">
          <div class="flex justify-between mt-2 text-[0.4375rem] font-black text-slate-700 uppercase tracking-widest">
            <span>Compact</span>
            <span>Balanced</span>
            <span>Expanded</span>
          </div>
        </div>

        <button onclick="window.saveSettings()" class="w-full py-4 bg-gradient-to-tr from-[#f0883e] to-yellow-400 text-black font-black text-[0.625rem] uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-500/10 hover:scale-[1.02] active:scale-95 transition-all mt-4">
          Authorize & Persist Changes
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  window.tempSettings = { ...s };

  window.updateLocalFont = (f) => {
    window.tempSettings.fontFamily = f;
    document.querySelectorAll('.font-option').forEach(btn => {
      btn.classList.remove('bg-[#f0883e]', 'text-black', 'border-transparent', 'shadow-lg');
      btn.classList.add('bg-white/5', 'text-white', 'border-white/10');
      if (btn.innerText.trim() === f) {
        btn.classList.add('bg-[#f0883e]', 'text-black', 'border-transparent', 'shadow-lg');
        btn.classList.remove('bg-white/5', 'text-white', 'border-white/10');
      }
    });
    // Live preview
    const fontMap = {
      'Inter': "'Inter', sans-serif",
      'Roboto': "'Roboto', sans-serif",
      'Outfit': "'Outfit', sans-serif",
      'Monospace': "monospace"
    };
    document.documentElement.style.setProperty('--font-family', fontMap[f]);
  };

  window.updateLocalFontSize = (val) => {
    window.tempSettings.fontSize = val;
    document.getElementById('font-size-val').innerText = val + 'px';
    document.documentElement.style.fontSize = val + 'px';
  };

  window.saveSettings = async () => {
    await state.updateSettings(window.tempSettings);
    modal.remove();
  };
};

