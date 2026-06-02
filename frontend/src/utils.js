import Swal from 'sweetalert2';

/**
 * Professional Notification System using SweetAlert2
 */
export const showNotification = (message, type = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  Toast.fire({
    icon: type,
    title: message,
    background: document.documentElement.classList.contains('dark') ? '#111418' : '#ffffff',
    color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#0f172a',
  });
};

/**
 * Professional Confirmation Dialog
 */
export const confirmAction = async (title, text, icon = 'warning') => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor: '#f0883e',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Yes, proceed',
    background: document.documentElement.classList.contains('dark') ? '#111418' : '#ffffff',
    color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#0f172a',
    customClass: {
      popup: 'rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl',
      title: 'text-xl font-black uppercase tracking-tighter italic',
      confirmButton: 'px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs',
      cancelButton: 'px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs'
    }
  });
  return result.isConfirmed;
};

/**
 * Standard EMI Calculation (Reducing Balance)
 * P = Principal
 * R = Annual Interest Rate (%)
 * N = Tenure in Months
 */
export const calculateFinanceNorms = (principal, annualRate, tenureMonths) => {
  const P = principal;
  const r = (annualRate / 12) / 100; // Monthly rate
  const n = tenureMonths; // Total months

  if (P <= 0 || r < 0 || n <= 0) return { emi: 0, totalPayable: 0, totalInterest: 0 };

  // Standard EMI Formula: [P x R x (1+R)^N]/[(1+R)^N-1]
  const emi = Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  const totalPayable = emi * n;
  const totalInterest = totalPayable - P;

  return { emi, totalPayable, totalInterest, n, r };
};

/**
 * Format Currency to INR
 */
export const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * RBAC Permission Verifier
 */
export const hasPermission = (user, module, action = 'read') => {
  if (!user) return false;

  // RBAC Split: Customer Side vs OEM Side vs Supervisor Side
  if (user.role === 'CUSTOMER') {
    // Customers have NO RBAC matrix. They have hardcoded protocol access.
    const customerModules = ['dashboard', 'machines', 'settlements', 'loan-details', 'settings', 'fmc'];
    if (action !== 'read') return false; // Customers are read-only for system nodes
    return customerModules.includes(module);
  }

  if (user.role === 'SUPERVISOR') {
    // Supervisors can ONLY access FMC operational modules
    const supervisorModules = ['fmc', 'dashboard', 'machines', 'service_desk'];
    if (!supervisorModules.includes(module)) return false;
    if (module === 'machines') return action === 'read'; // Read-only machines
    if (module === 'dashboard') return action === 'read';
    if (module === 'service_desk') {
      if (action === 'delete') return false; // Supervisors cannot delete tickets
      return true;
    }
    // FMC: full operational access (tickets, hours) but no contract/billing delete
    if (module === 'fmc') {
      if (action === 'delete') return false; // Supervisors cannot delete contracts/invoices
      return true;
    }
    return false;
  }

  // OEM Side: Protocol-based RBAC
  // Super Admin Bypass for Master Account
  if (user.isSuperAdmin || user.email === 'oem@liugong.com') return true;

  // OEM Super Admin fallback (If roleId is missing or is just a string ID, grant access)
  // This prevents blank screens during the data initialization phase
  if (user.role === 'OEM' && (!user.roleId || typeof user.roleId === 'string')) return true;

  // Fine-grained RBAC check for OEM personnel
  const permissions = user.roleId?.permissions;
  if (!permissions) return user.role === 'OEM'; // Safe fallback for OEM users

  // Hierarchical 'read' check for parent modules
  if (action === 'read') {
    if (module === 'financing') {
      return !!(permissions.financing?.read || permissions.new_financing?.read || permissions.financed_machines?.read);
    }
    if (module === 'settings') {
      return !!(permissions.settings_parent?.read || permissions.settings_general?.read || permissions.settings_rbac?.read);
    }
  }

  if (module === 'fmc') {
    if (permissions.fmc) {
      return !!permissions.fmc[action];
    }
    if (action === 'read') return true;
    const roleName = (user.roleId?.name || '').toUpperCase();
    return roleName.includes('ADMIN') || roleName.includes('SUPER') || user.email === 'oem@liugong.com';
  }

  if (module === 'service_desk') {
    if (permissions.service_desk) {
      return !!permissions.service_desk[action];
    }
    if (action === 'read' || action === 'create' || action === 'update') return true;
    const roleName = (user.roleId?.name || '').toUpperCase();
    return roleName.includes('ADMIN') || roleName.includes('SUPER') || user.email === 'oem@liugong.com';
  }

  if (!permissions[module]) return false;
  return !!permissions[module][action];
};

/**
 * Resolves the first authorized entry point for a user
 */
export const getFirstAuthorizedView = (user) => {
  if (!user) return 'landing';
  if (user.isSuperAdmin || user.email === 'oem@liugong.com') return user.role === 'OEM' ? 'oem-dashboard' : 'customer-dashboard';

  const oemModules = [
    { id: 'oem-dashboard', key: 'dashboard' },
    { id: 'customers', key: 'customers' },
    { id: 'employees', key: 'employees' },
    { id: 'machines', key: 'machines' },
    { id: 'new-financing', key: 'new_financing' },
    { id: 'financed-machines', key: 'financed_machines' },
    { id: 'payments', key: 'settlements' },
    { id: 'settings-general', key: 'settings_general' },
    { id: 'settings-rbac', key: 'settings_rbac' }
  ];

  const customerModules = [
    { id: 'customer-dashboard', key: 'dashboard' },
    { id: 'my-machines', key: 'machines' },
    { id: 'customer-payments', key: 'settlements' }
  ];

  const supervisorModules = [
    { id: 'fmc-dashboard', key: 'fmc' },
    { id: 'fmc-tickets', key: 'fmc' },
    { id: 'fmc-hours', key: 'fmc' }
  ];

  const modules = user.role === 'OEM' ? oemModules : (user.role === 'SUPERVISOR' ? supervisorModules : customerModules);

  for (const m of modules) {
    if (hasPermission(user, m.key, 'read')) return m.id;
  }

  return 'landing';
};

/**
 * Dynamic Color Helpers
 */
export const lightenDarkenColor = (col, amt) => {
  let usePound = false;
  if (col[0] === "#") {
    col = col.slice(1);
    usePound = true;
  }
  let num = parseInt(col, 16);
  let r = (num >> 16) + amt;
  if (r > 255) r = 255; else if (r < 0) r = 0;
  let b = ((num >> 8) & 0x00FF) + amt;
  if (b > 255) b = 255; else if (b < 0) b = 0;
  let g = (num & 0x0000FF) + amt;
  if (g > 255) g = 255; else if (g < 0) g = 0;
  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
};

export const hexToRGBA = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
