import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronDown, ChevronUp, Clock, Banknote, Users, Truck,
  Settings2, RotateCcw, CheckCircle2, FileText, Wrench, Receipt
} from 'lucide-react';

// ========================
// CONSTANTS & CONFIGURATION
// ========================

const SECTIONS = [
  { key: 'emi', label: 'EMI Loan & Payment', icon: Banknote },
  { key: 'fmc_contracts', label: 'FMC Contracts', icon: FileText },
  { key: 'fmc_invoices', label: 'FMC Invoices', icon: Receipt },
  { key: 'tickets', label: 'Service Desk', icon: Wrench },
];

const createInitialFilters = (section) => {
  switch (section) {
    case 'emi':
      return {
        date: { type: 'EMI Due Date', from: '', to: '' },
        financial: {
          principal: { min: '', max: '' },
          emi: { min: '', max: '' },
          interestRate: { min: '', max: '' },
          tenure: { min: '', max: '' },
          overdueEmiCount: { min: '', max: '' },
        },
        status: [],
        approvalStatus: [],
        customer: { name: '', id: '' },
        machine: { name: '', category: '' },
        booleanFlags: { agreementGenerated: '', hasDispatchData: '' },
      };
    case 'fmc_invoices':
      return {
        invoiceNumber: '',
        agreementNumber: '',
        customerName: '',
        billingMonth: { from: '', to: '' },
        totalHours: { min: '', max: '' },
        hourlyRate: { min: '', max: '' },
        invoiceTotal: { min: '', max: '' },
        paymentStatus: [],
        paidDate: { from: '', to: '' },
      };
    case 'fmc_contracts':
      return {
        contractId: '',
        customerName: '',
        machineName: '',
        startDate: { from: '', to: '' },
        endDate: { from: '', to: '' },
        status: [],
      };
    case 'tickets':
      return {
        ticketNumber: '',
        machineName: '',
        contractId: '',
        breakdownType: [],
        severity: [],
        status: [],
        location: '',
        hourReading: { min: '', max: '' },
        assignedSupervisor: '',
        createdDate: { from: '', to: '' },
        updatedDate: { from: '', to: '' },
      };
    default:
      return {};
  }
};

const DATE_TYPES = ['EMI Start Date', 'Next EMI Due Date'];
const EMI_STATUSES = ['Active', 'Pending', 'Closed', 'Overdue', 'Completed'];
const APPROVAL_STATUSES = ['Requested', 'Approved', 'Rejected'];
const INVOICE_PAYMENT_STATUSES = ['Paid', 'Pending'];
const TICKET_BREAKDOWN_TYPES = ['Hydraulics', 'Electrical', 'Mechanical', 'Engine'];
const TICKET_SEVERITIES = ['High', 'Medium', 'Low'];
const TICKET_STATUSES = ['Requested', 'Under Review', 'Resolved', 'Closed'];
const MACHINE_CATEGORIES = ['Crane', 'Excavator', 'Wheel Loader', 'Dozer'];

const inputCls =
  "w-full bg-bg-deep border border-border-main rounded px-2 py-1.5 text-[11px] text-text-main focus:border-primary focus:outline-none transition-colors placeholder:text-text-dim/50";

// ========================
// SUB-COMPONENTS
// ========================

const DateInput = ({ value, onChange, placeholder = "dd/mm/yyyy" }) => {
  const formattedDate = useMemo(() => {
    if (!value) return "";
    const parts = value.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d}/${m}/${y}`;
    }
    return value;
  }, [value]);

  return (
    <div className="relative flex items-center w-full">
      <input
        type="date"
        value={value}
        onChange={onChange}
        className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
        onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
      />
      <input
        type="text"
        readOnly
        value={formattedDate}
        placeholder={placeholder}
        className={`${inputCls} relative z-0`}
      />
    </div>
  );
};

const Section = ({ icon: Icon, title, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-border-main rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-bg-active hover:bg-bg-active/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={12} className="text-primary" />
          <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">
            {title}
          </span>
        </div>
        {open ? (
          <ChevronUp size={12} className="text-text-dim" />
        ) : (
          <ChevronDown size={12} className="text-text-dim" />
        )}
      </button>
      {open && <div className="px-3 py-3 flex flex-col gap-3">{children}</div>}
    </div>
  );
};

// ========================
// MAIN COMPONENT
// ========================

const AdvancedFilterPanel = ({
  isOpen,
  onToggle,
  onApply,
  activeFilterCounts = {},
  headerRight,
  externalActiveSection,
}) => {
  const [activeSection, setActiveSection] = useState('emi');
  
  useEffect(() => {
    if (externalActiveSection && externalActiveSection !== activeSection) {
      setActiveSection(externalActiveSection);
    }
  }, [externalActiveSection]);

  const [filters, setFilters] = useState(() => ({
    emi: createInitialFilters('emi'),
    fmc_invoices: createInitialFilters('fmc_invoices'),
    fmc_contracts: createInitialFilters('fmc_contracts'),
    tickets: createInitialFilters('tickets'),
  }));

  const localFilters = filters[activeSection];

  const setFilter = (path, value) => {
    setFilters((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let cur = next[activeSection];
      for (let i = 0; i < keys.length - 1; i++) {
        if (!cur[keys[i]]) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleReset = () => {
    const fresh = createInitialFilters(activeSection);
    setFilters((prev) => ({
      ...prev,
      [activeSection]: fresh,
    }));
    onApply && onApply(fresh, activeSection);
  };

  const handleApply = () => {
    onApply && onApply(localFilters, activeSection);
    if (isOpen) onToggle();
  };

  const currentActiveCount = activeFilterCounts[activeSection] || 0;

  // Helper to update an array filter (for statuses, etc.)
  const toggleArrayFilter = (field, value) => {
    setFilters((prev) => {
      const currentArray = prev[activeSection][field] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];
      return {
        ...prev,
        [activeSection]: {
          ...prev[activeSection],
          [field]: newArray,
        },
      };
    });
  };

  // ========================
  // RENDER FILTER COLUMNS
  // ========================
  const renderFilters = () => {
    switch (activeSection) {
      case 'emi':
        return (
          <>
            {/* Column 1 */}
            <div className="flex flex-col gap-4">
              <Section icon={Clock} title="Date Filter">
                <select
                  className={inputCls}
                  value={localFilters.date?.type}
                  onChange={(e) => setFilter('date.type', e.target.value)}
                >
                  {DATE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-text-dim uppercase">From</span>
                    <DateInput
                      value={localFilters.date?.from ?? ''}
                      onChange={(e) => setFilter('date.from', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-text-dim uppercase">To</span>
                    <DateInput
                      value={localFilters.date?.to ?? ''}
                      onChange={(e) => setFilter('date.to', e.target.value)}
                    />
                  </div>
                </div>
              </Section>

              <Section icon={Settings2} title="EMI Status">
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
                  {EMI_STATUSES.map((status) => (
                    <label key={status} className="flex items-center gap-2 text-[11px] cursor-pointer hover:text-primary">
                      <input
                        type="checkbox"
                        className="accent-primary w-3.5 h-3.5"
                        checked={(localFilters.status || []).includes(status)}
                        onChange={() => toggleArrayFilter('status', status)}
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </Section>

              <Section icon={Settings2} title="Approval Status">
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
                  {APPROVAL_STATUSES.map((status) => (
                    <label key={status} className="flex items-center gap-2 text-[11px] cursor-pointer hover:text-primary">
                      <input
                        type="checkbox"
                        className="accent-primary w-3.5 h-3.5"
                        checked={(localFilters.approvalStatus || []).includes(status)}
                        onChange={() => toggleArrayFilter('approvalStatus', status)}
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </Section>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-4">
              <Section icon={Banknote} title="Financial Ranges">
                {[
                  { label: 'Principal Amount', path: 'principal' },
                  { label: 'EMI Amount', path: 'emi' },
                  { label: 'Interest Rate (%)', path: 'interestRate' },
                  { label: 'Tenure (Months)', path: 'tenure' },
                  { label: 'Overdue EMI Count', path: 'overdueEmiCount' },
                ].map(({ label, path }) => (
                  <div key={path} className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-text-dim uppercase">{label}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className={inputCls}
                        value={localFilters.financial?.[path]?.min ?? ''}
                        onChange={(e) => setFilter(`financial.${path}.min`, e.target.value)}
                      />
                      <span className="text-text-dim text-[11px] shrink-0">–</span>
                      <input
                        type="number"
                        placeholder="Max"
                        className={inputCls}
                        value={localFilters.financial?.[path]?.max ?? ''}
                        onChange={(e) => setFilter(`financial.${path}.max`, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </Section>

              <Section icon={CheckCircle2} title="Other Checks">
                <select
                  className={inputCls}
                  value={localFilters.booleanFlags?.agreementGenerated ?? ''}
                  onChange={(e) => setFilter('booleanFlags.agreementGenerated', e.target.value)}
                >
                  <option value="">Agreement Generated: Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
                <select
                  className={inputCls}
                  value={localFilters.booleanFlags?.hasDispatchData ?? ''}
                  onChange={(e) => setFilter('booleanFlags.hasDispatchData', e.target.value)}
                >
                  <option value="">Has Dispatch Data: Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </Section>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col gap-4">
              <Section icon={Users} title="Customer Filters">
                <input
                  type="text"
                  placeholder="Search customer name…"
                  className={inputCls}
                  value={localFilters.customer?.name ?? ''}
                  onChange={(e) => setFilter('customer.name', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Search customer ID…"
                  className={inputCls}
                  value={localFilters.customer?.id ?? ''}
                  onChange={(e) => setFilter('customer.id', e.target.value)}
                />
              </Section>

              <Section icon={Truck} title="Machine Filters">
                <input
                  type="text"
                  placeholder="Search machine name…"
                  className={inputCls}
                  value={localFilters.machine?.name ?? ''}
                  onChange={(e) => setFilter('machine.name', e.target.value)}
                />
                <select
                  className={inputCls}
                  value={localFilters.machine?.category ?? ''}
                  onChange={(e) => setFilter('machine.category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {MACHINE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </Section>
            </div>
          </>
        );

      case 'fmc_invoices':
        return (
          <>
            <div className="flex flex-col gap-4">
              <Section icon={Receipt} title="Invoice Details">
                <input
                  type="text"
                  placeholder="Invoice Number"
                  className={inputCls}
                  value={localFilters.invoiceNumber}
                  onChange={(e) => setFilter('invoiceNumber', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Agreement Number"
                  className={inputCls}
                  value={localFilters.agreementNumber}
                  onChange={(e) => setFilter('agreementNumber', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Customer Name"
                  className={inputCls}
                  value={localFilters.customerName}
                  onChange={(e) => setFilter('customerName', e.target.value)}
                />
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-text-dim uppercase">Billing Month</span>
                  <div className="grid grid-cols-2 gap-2">
                    <DateInput
                      placeholder="From"
                      value={localFilters.billingMonth?.from}
                      onChange={(e) => setFilter('billingMonth.from', e.target.value)}
                    />
                    <DateInput
                      placeholder="To"
                      value={localFilters.billingMonth?.to}
                      onChange={(e) => setFilter('billingMonth.to', e.target.value)}
                    />
                  </div>
                </div>
              </Section>
            </div>

            <div className="flex flex-col gap-4">
              <Section icon={Banknote} title="Financial Ranges">
                {[
                  { label: 'Total Hours', path: 'totalHours' },
                  { label: 'Hourly Rate', path: 'hourlyRate' },
                  { label: 'Invoice Total', path: 'invoiceTotal' },
                ].map(({ label, path }) => (
                  <div key={path} className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-text-dim uppercase">{label}</span>
                    <div className="flex items-center gap-2">
                      <input type="number" placeholder="Min" className={inputCls}
                        value={localFilters[path]?.min ?? ''}
                        onChange={(e) => setFilter(`${path}.min`, e.target.value)} />
                      <span className="text-text-dim text-[11px]">–</span>
                      <input type="number" placeholder="Max" className={inputCls}
                        value={localFilters[path]?.max ?? ''}
                        onChange={(e) => setFilter(`${path}.max`, e.target.value)} />
                    </div>
                  </div>
                ))}
              </Section>
            </div>

            <div className="flex flex-col gap-4">
              <Section icon={Settings2} title="Payment Status">
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
                  {INVOICE_PAYMENT_STATUSES.map((status) => (
                    <label key={status} className="flex items-center gap-2 text-[11px] cursor-pointer">
                      <input type="checkbox" className="accent-primary w-3.5 h-3.5"
                        checked={(localFilters.paymentStatus || []).includes(status)}
                        onChange={() => toggleArrayFilter('paymentStatus', status)}
                      />
                      {status}
                    </label>
                  ))}
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-[9px] font-bold text-text-dim uppercase">Paid Date</span>
                  <div className="grid grid-cols-2 gap-2">
                    <DateInput
                      placeholder="From"
                      value={localFilters.paidDate?.from}
                      onChange={(e) => setFilter('paidDate.from', e.target.value)}
                    />
                    <DateInput
                      placeholder="To"
                      value={localFilters.paidDate?.to}
                      onChange={(e) => setFilter('paidDate.to', e.target.value)}
                    />
                  </div>
                </div>
              </Section>
            </div>
          </>
        );

      case 'fmc_contracts':
        return (
          <>
            <div className="flex flex-col gap-4">
              <Section icon={FileText} title="Contract Filters">
                <input
                  type="text"
                  placeholder="Contract ID"
                  className={inputCls}
                  value={localFilters.contractId}
                  onChange={(e) => setFilter('contractId', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Customer Name"
                  className={inputCls}
                  value={localFilters.customerName}
                  onChange={(e) => setFilter('customerName', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Machine Name"
                  className={inputCls}
                  value={localFilters.machineName}
                  onChange={(e) => setFilter('machineName', e.target.value)}
                />
              </Section>
            </div>

            <div className="flex flex-col gap-4">
              <Section icon={Clock} title="Date Ranges">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-text-dim uppercase">Start Date</span>
                  <div className="grid grid-cols-2 gap-2">
                    <DateInput
                      placeholder="From"
                      value={localFilters.startDate?.from}
                      onChange={(e) => setFilter('startDate.from', e.target.value)}
                    />
                    <DateInput
                      placeholder="To"
                      value={localFilters.startDate?.to}
                      onChange={(e) => setFilter('startDate.to', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-[9px] font-bold text-text-dim uppercase">End Date</span>
                  <div className="grid grid-cols-2 gap-2">
                    <DateInput
                      placeholder="From"
                      value={localFilters.endDate?.from}
                      onChange={(e) => setFilter('endDate.from', e.target.value)}
                    />
                    <DateInput
                      placeholder="To"
                      value={localFilters.endDate?.to}
                      onChange={(e) => setFilter('endDate.to', e.target.value)}
                    />
                  </div>
                </div>
              </Section>
            </div>

            <div className="flex flex-col gap-4">
              <Section icon={Settings2} title="Status">
                <div className="grid grid-cols-2 gap-2">
                  {['Active', 'Expired', 'Pending'].map((status) => (
                    <label key={status} className="flex items-center gap-2 text-[11px] cursor-pointer">
                      <input type="checkbox" className="accent-primary w-3.5 h-3.5"
                        checked={(localFilters.status || []).includes(status)}
                        onChange={() => toggleArrayFilter('status', status)}
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </Section>
            </div>
          </>
        );

      case 'tickets':
        return (
          <>
            <div className="flex flex-col gap-4">
              <Section icon={Wrench} title="Ticket Details">
                <input
                  type="text"
                  placeholder="Ticket Number"
                  className={inputCls}
                  value={localFilters.ticketNumber}
                  onChange={(e) => setFilter('ticketNumber', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Machine Name"
                  className={inputCls}
                  value={localFilters.machineName}
                  onChange={(e) => setFilter('machineName', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Contract ID"
                  className={inputCls}
                  value={localFilters.contractId}
                  onChange={(e) => setFilter('contractId', e.target.value)}
                />
              </Section>

              <Section icon={Users} title="Assignment">
                <input
                  type="text"
                  placeholder="Assigned Supervisor"
                  className={inputCls}
                  value={localFilters.assignedSupervisor}
                  onChange={(e) => setFilter('assignedSupervisor', e.target.value)}
                />
              </Section>
            </div>

            <div className="flex flex-col gap-4">
              <Section icon={Settings2} title="Classification">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-text-dim uppercase">Breakdown Type</span>
                    <div className="grid grid-cols-2 gap-2">
                      {TICKET_BREAKDOWN_TYPES.map((type) => (
                        <label key={type} className="flex items-center gap-2 text-[11px] cursor-pointer">
                          <input type="checkbox" className="accent-primary w-3.5 h-3.5"
                            checked={(localFilters.breakdownType || []).includes(type)}
                            onChange={() => toggleArrayFilter('breakdownType', type)}
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-text-dim uppercase">Severity</span>
                    <div className="grid grid-cols-3 gap-2">
                      {TICKET_SEVERITIES.map((s) => (
                        <label key={s} className="flex items-center gap-2 text-[11px] cursor-pointer">
                          <input type="checkbox" className="accent-primary w-3.5 h-3.5"
                            checked={(localFilters.severity || []).includes(s)}
                            onChange={() => toggleArrayFilter('severity', s)}
                          />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-text-dim uppercase">Status</span>
                    <div className="grid grid-cols-2 gap-2">
                      {TICKET_STATUSES.map((s) => (
                        <label key={s} className="flex items-center gap-2 text-[11px] cursor-pointer">
                          <input type="checkbox" className="accent-primary w-3.5 h-3.5"
                            checked={(localFilters.status || []).includes(s)}
                            onChange={() => toggleArrayFilter('status', s)}
                          />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>
            </div>

            <div className="flex flex-col gap-4">
              <Section icon={Truck} title="Location & Hours">
                <input
                  type="text"
                  placeholder="Location"
                  className={inputCls}
                  value={localFilters.location}
                  onChange={(e) => setFilter('location', e.target.value)}
                />
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-text-dim uppercase">Hour Reading</span>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Min" className={inputCls}
                      value={localFilters.hourReading?.min ?? ''}
                      onChange={(e) => setFilter('hourReading.min', e.target.value)} />
                    <span className="text-text-dim text-[11px]">–</span>
                    <input type="number" placeholder="Max" className={inputCls}
                      value={localFilters.hourReading?.max ?? ''}
                      onChange={(e) => setFilter('hourReading.max', e.target.value)} />
                  </div>
                </div>
              </Section>

              <Section icon={Clock} title="Date Ranges">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-text-dim uppercase">Created Date</span>
                  <div className="grid grid-cols-2 gap-2">
                    <DateInput
                      placeholder="From"
                      value={localFilters.createdDate?.from}
                      onChange={(e) => setFilter('createdDate.from', e.target.value)}
                    />
                    <DateInput
                      placeholder="To"
                      value={localFilters.createdDate?.to}
                      onChange={(e) => setFilter('createdDate.to', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-[9px] font-bold text-text-dim uppercase">Updated Date</span>
                  <div className="grid grid-cols-2 gap-2">
                    <DateInput
                      placeholder="From"
                      value={localFilters.updatedDate?.from}
                      onChange={(e) => setFilter('updatedDate.from', e.target.value)}
                    />
                    <DateInput
                      placeholder="To"
                      value={localFilters.updatedDate?.to}
                      onChange={(e) => setFilter('updatedDate.to', e.target.value)}
                    />
                  </div>
                </div>
              </Section>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-bg-card border border-border-main rounded-xl shadow-sm shrink-0 flex flex-col p-2 mb-4">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border-main pb-3 mb-3">
        <div className="flex items-center justify-between px-5 pt-3">
          <div
            onClick={onToggle}
            className="flex items-center gap-2 cursor-pointer group flex-1"
          >
            <Settings2 size={15} className="text-primary" />
            <span className="text-[12px] font-black text-text-main tracking-wide uppercase group-hover:text-primary transition-colors">
              Advanced Filters
            </span>
            {currentActiveCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-primary text-black rounded-full text-[9px] font-black">
                {currentActiveCount}
              </span>
            )}
            <button className="p-1 rounded-md transition-colors text-text-dim group-hover:text-primary ml-1">
              {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
          {headerRight && <div className="flex items-center gap-3">{headerRight}</div>}
        </div>

        {isOpen && (
          <div className="flex gap-1 px-5">
            {SECTIONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors ${
                  activeSection === key
                    ? 'bg-primary text-black'
                    : 'bg-bg-deep text-text-dim hover:text-text-main'
                }`}
              >
                <Icon size={11} />
                {label}
                {activeFilterCounts[key] > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 bg-black/20 text-white rounded-full text-[8px] font-black">
                    {activeFilterCounts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter body – PROFESSIONAL ALIGNMENT FIX */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
            {renderFilters()}
          </div>

          <div className="px-4 pb-4 flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded border border-border-main bg-bg-deep hover:border-text-dim text-[11px] font-bold text-text-main transition-colors flex-1"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <button
              onClick={handleApply}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded bg-primary hover:bg-primary/90 text-[11px] font-bold text-black transition-colors flex-[2]"
            >
              <CheckCircle2 size={12} /> Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilterPanel;