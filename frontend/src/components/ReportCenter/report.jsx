import React, { useState, useRef, useEffect, useMemo } from "react";
import { Filter, Clock, ChevronDown, Download, Printer } from "lucide-react";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { state } from "../../state";

import AllDataReport from "./pages/AllDataReport";
import EMILoanPaymentReport from "./pages/EMILoanPaymentReport";
import FMCInvoiceReport from "./pages/FMCInvoiceReport";
import ServiceDeskReport from "./pages/ServiceDeskReport";
import CustomerPaymentSummaryReport from "./pages/CustomerPaymentSummaryReport";
import AdvancedFilterPanel from "./Filters/FilterSidebar";

const ReportCenter = () => {
  const [activeReport, setActiveReport] = useState("All Reports");
  const [allDataSubTab, setAllDataSubTab] = useState("emi");
  const reportTypes = [
    "All Reports",
    "EMI Loan & Payment Report",
    "FMC Contract & Invoice Report",
    "Service Desk Report",
    "Customer Payment Summary"
  ];

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ─── Per-section filter state (matches AdvancedFilterPanel sections) ─────────
  const SECTION_DEFAULTS = {
    emi: {
      date: { type: 'EMI Start Date', from: '', to: '' },
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
    },
    fmc_invoices: {
      invoiceNumber: '',
      agreementNumber: '',
      customerName: '',
      billingMonth: { from: '', to: '' },
      totalHours: { min: '', max: '' },
      hourlyRate: { min: '', max: '' },
      invoiceTotal: { min: '', max: '' },
      paymentStatus: [],
      paidDate: { from: '', to: '' },
    },
    fmc_contracts: {
      contractId: '',
      customerName: '',
      machineName: '',
      startDate: { from: '', to: '' },
      endDate: { from: '', to: '' },
      status: [],
    },
    tickets: {
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
    },
  };

  const [sectionFilters, setSectionFilters] = useState(SECTION_DEFAULTS);

  // Callback from AdvancedFilterPanel – receives (sectionFilters, sectionKey)
  const handleFilterApply = (sectionData, sectionKey) => {
    setSectionFilters((prev) => ({
      ...prev,
      [sectionKey]: sectionData,
    }));
  };

  // ─── Active filter counts per section (for badge display) ────────────────────
  const activeFilterCounts = useMemo(() => {
    const count = (f, section) => {
      let n = 0;
      if (section === 'emi') {
        if (f.date?.from || f.date?.to) n++;
        if (f.status?.length) n++;
        if (f.approvalStatus?.length) n++;
        if (f.customer?.name || f.customer?.id) n++;
        if (f.machine?.name || f.machine?.category) n++;
        if (f.booleanFlags?.agreementGenerated) n++;
        if (f.booleanFlags?.hasDispatchData) n++;
        const fin = f.financial || {};
        ['principal','emi','interestRate','tenure','overdueEmiCount'].forEach((k) => {
          if (fin[k]?.min || fin[k]?.max) n++;
        });
      } else if (section === 'fmc_invoices') {
        if (f.invoiceNumber) n++;
        if (f.agreementNumber) n++;
        if (f.customerName) n++;
        if (f.billingMonth?.from || f.billingMonth?.to) n++;
        if (f.paymentStatus?.length) n++;
        if (f.paidDate?.from || f.paidDate?.to) n++;
        ['totalHours','hourlyRate','invoiceTotal'].forEach((k) => {
          if (f[k]?.min || f[k]?.max) n++;
        });
      } else if (section === 'fmc_contracts') {
        if (f.contractId) n++;
        if (f.customerName) n++;
        if (f.machineName) n++;
        if (f.startDate?.from || f.startDate?.to) n++;
        if (f.endDate?.from || f.endDate?.to) n++;
        if (f.status?.length) n++;
      } else if (section === 'tickets') {
        if (f.ticketNumber) n++;
        if (f.machineName) n++;
        if (f.contractId) n++;
        if (f.breakdownType?.length) n++;
        if (f.severity?.length) n++;
        if (f.status?.length) n++;
        if (f.location) n++;
        if (f.hourReading?.min || f.hourReading?.max) n++;
        if (f.assignedSupervisor) n++;
        if (f.createdDate?.from || f.createdDate?.to) n++;
        if (f.updatedDate?.from || f.updatedDate?.to) n++;
      }
      return n;
    };

    return {
      emi:           count(sectionFilters.emi, 'emi'),
      fmc_invoices:  count(sectionFilters.fmc_invoices, 'fmc_invoices'),
      fmc_contracts: count(sectionFilters.fmc_contracts, 'fmc_contracts'),
      tickets:       count(sectionFilters.tickets, 'tickets'),
    };
  }, [sectionFilters]);

  // Total badge count shown in headerRight
  const totalActiveFilterCount = useMemo(
    () => Object.values(activeFilterCounts).reduce((a, b) => a + b, 0),
    [activeFilterCounts]
  );

  // Subscribe to global state so the component re-renders when data
  // arrives from the API (e.g. after a page reload).
  const [appData, setAppData] = useState(state.data);
  useEffect(() => {
    // Ensure machines data is fetched for the reports
    state.ensureMachinesLight();

    const unsubscribe = state.subscribe((newData) => setAppData({ ...newData }));
    return () => unsubscribe();
  }, []);

  const { 
    customers = [], 
    loans = [], 
    payments = [], 
    machines = [],
    fmcContracts = [],
    fmcTickets = [],
    fmcInvoices = [],
    employees = []
  } = appData || {};



  const allDataReportRef = useRef(null);
  const emiLoanPaymentReportRef = useRef(null);
  const fmcInvoiceReportRef = useRef(null);
  const serviceDeskReportRef = useRef(null);
  const customerPaymentSummaryReportRef = useRef(null);

  const handleExportCSV = async () => {
    let result = null;

    if (activeReport === "All Reports" && allDataReportRef.current) {
      result = allDataReportRef.current.exportCSV();
    } else if (activeReport === "EMI Loan & Payment Report" && emiLoanPaymentReportRef.current) {
      result = emiLoanPaymentReportRef.current.exportCSV();
    } else if (activeReport === "FMC Contract & Invoice Report" && fmcInvoiceReportRef.current) {
      result = fmcInvoiceReportRef.current.exportCSV();
    } else if (activeReport === "Service Desk Report" && serviceDeskReportRef.current) {
      result = serviceDeskReportRef.current.exportCSV();
    } else if (activeReport === "Customer Payment Summary" && customerPaymentSummaryReportRef.current) {
      result = customerPaymentSummaryReportRef.current.exportCSV();
    }

    if (result) {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(result.fileName || 'Report');

      // Grouped Headers
      if (result.groupedHeaders) {
        const groupRow = sheet.addRow(result.groupedHeaders);
        groupRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        groupRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D3748' } };
        groupRow.alignment = { horizontal: 'center' };
        
        if (result.merges) {
          result.merges.forEach(m => {
            if (Array.isArray(m)) {
              sheet.mergeCells(m[0], m[1], m[2], m[3]);
            } else {
              sheet.mergeCells(m.range[0], m.range[1], m.range[2], m.range[3]);
              if (m.color) {
                const cell = sheet.getCell(m.range[0], m.range[1]);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: m.color } };
              }
            }
          });
        }
      }

      // Professional styling for Header
      const headerRow = sheet.addRow(result.headers);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4A5568' }
      };

      // Auto filter (advanced filter option on header)
      const filterRow = result.groupedHeaders ? 2 : 1;
      sheet.autoFilter = {
        from: { row: filterRow, column: 1 },
        to: { row: filterRow, column: result.headers.length }
      };

      // Add Data
      result.data.forEach(rowData => {
        sheet.addRow(rowData);
      });

      // Adjust column widths automatically based on header length
      sheet.columns.forEach(column => {
        let maxLen = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          maxLen = Math.max(maxLen, cell.value ? cell.value.toString().length : 0);
        });
        column.width = maxLen < 15 ? 15 : maxLen + 2;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${result.fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  const handlePresetClick = (preset) => {
    switch (preset) {
      case "Overdue EMIs":
        setActiveReport("EMI Loan & Payment Report");
        setTimeout(() => {
          if (emiLoanPaymentReportRef.current) {
            emiLoanPaymentReportRef.current.setFilters({ status: "All Statuses" }); // Assuming we might add an overdue filter later
            emiLoanPaymentReportRef.current.setSearch("");
          }
        }, 0);
        break;
      case "Pending Invoices":
        setActiveReport("FMC Contract & Invoice Report");
        setTimeout(() => {
          if (fmcInvoiceReportRef.current) {
            fmcInvoiceReportRef.current.setFilters({ status: "Pending" });
            fmcInvoiceReportRef.current.setSearch("");
          }
        }, 0);
        break;
      case "High Severity Tickets":
        setActiveReport("Service Desk Report");
        setTimeout(() => {
          if (serviceDeskReportRef.current) {
            serviceDeskReportRef.current.setFilters({ status: "All Statuses", severity: "High" });
            serviceDeskReportRef.current.setSearch("");
          }
        }, 0);
        break;
      default:
        break;
    }
  };

  const getExternalActiveSection = () => {
    switch (activeReport) {
      case "FMC Contract & Invoice Report":
        return "fmc_invoices";
      case "Service Desk Report":
        return "tickets";
      case "EMI Loan & Payment Report":
      case "Customer Payment Summary":
        return "emi";
      case "All Reports":
        switch (allDataSubTab) {
          case "emi":
          case "payment":
            return "emi";
          case "fmc":
            return "fmc_invoices";
          case "service":
            return "tickets";
          default:
            return "emi";
        }
      default:
        return "emi";
    }
  };

  const filterPanelNode = (
    <AdvancedFilterPanel
      isOpen={isSidebarOpen}
      onToggle={() => setIsSidebarOpen((o) => !o)}
      onApply={handleFilterApply}
      activeFilterCounts={activeFilterCounts}
      externalActiveSection={getExternalActiveSection()}
      headerRight={
        <div className="flex items-center gap-2">
          {totalActiveFilterCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/15 border border-primary/30 rounded-full text-[9px] font-black text-primary uppercase tracking-wider animate-fade-in">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-primary text-black rounded-full text-[8px] font-black">{totalActiveFilterCount}</span>
              Active
            </span>
          )}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded text-[11px] font-bold text-primary hover:bg-primary/20 transition-all flex items-center gap-1.5"
          >
            <Download size={12} /> Export Excel
          </button>
        </div>
      }
    />
  );

  return (
    <div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-hidden pr-2 animate-fade-in">

      {/* Single unified nav bar: Tabs | Presets || Filters | Export */}
      <div className="flex items-center gap-2 shrink-0 overflow-x-auto custom-scrollbar bg-bg-card border border-border-main rounded-xl px-3 py-2 shadow-sm mb-4">
        {/* Report type tabs */}
        <div className="flex bg-bg-active p-0.5 rounded-lg border border-border-main shrink-0">
          {reportTypes.map((type) => (
            <button
              key={type}
              onClick={() => {
                if (activeReport === type) {
                  if (type === "EMI Loan & Payment Report" && emiLoanPaymentReportRef.current) {
                    emiLoanPaymentReportRef.current.setFilters({ status: "All Statuses" });
                    emiLoanPaymentReportRef.current.setSearch("");
                  } else if (type === "FMC Contract & Invoice Report" && fmcInvoiceReportRef.current) {
                    fmcInvoiceReportRef.current.setFilters({ status: "All Statuses" });
                    fmcInvoiceReportRef.current.setSearch("");
                  } else if (type === "Service Desk Report" && serviceDeskReportRef.current) {
                    serviceDeskReportRef.current.setFilters({ status: "All Statuses", severity: "All Severities" });
                    serviceDeskReportRef.current.setSearch("");
                  } else if (type === "Customer Payment Summary" && customerPaymentSummaryReportRef.current) {
                    customerPaymentSummaryReportRef.current.setFilters({ paymentType: "All Types" });
                    customerPaymentSummaryReportRef.current.setSearch("");
                  }
                } else {
                  setActiveReport(type);
                }
              }}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all whitespace-nowrap ${activeReport === type ? "bg-bg-card border border-border-main text-primary shadow-sm" : "text-text-dim hover:text-text-main border border-transparent"}`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-border-main shrink-0 mx-1" />

        {/* Preset chips */}
        <span className="text-[9px] font-black text-text-dim uppercase tracking-widest shrink-0">Presets:</span>
        {["Overdue EMIs", "Pending Invoices", "High Severity Tickets"].map((chip) => (
          <button
            key={chip}
            onClick={() => handlePresetClick(chip)}
            className="px-2.5 py-1 bg-bg-deep border border-border-main rounded-full text-[10px] text-text-main hover:border-primary hover:text-primary transition-colors whitespace-nowrap shrink-0"
          >
            {chip}
          </button>
        ))}

        {/* Spacer pushes actions to far right (if any remain) */}
        <div className="flex-1 min-w-[8px]" />
      </div>

      <div className="flex-1 flex flex-col min-h-0 min-w-0 h-full">
        {activeReport === "All Reports" && <AllDataReport ref={allDataReportRef} onTabChange={setAllDataSubTab} customers={customers} machines={machines} loans={loans} payments={payments} fmcInvoices={fmcInvoices} fmcContracts={fmcContracts} fmcTickets={fmcTickets} employees={employees} globalFilters={sectionFilters.emi} fmcContractFilters={sectionFilters.fmc_contracts} fmcInvoiceFilters={sectionFilters.fmc_invoices} ticketFilters={sectionFilters.tickets} filterPanel={filterPanelNode} />}
        {activeReport === "EMI Loan & Payment Report" && <EMILoanPaymentReport ref={emiLoanPaymentReportRef} customers={customers} machines={machines} loans={loans} payments={payments} globalFilters={sectionFilters.emi} filterPanel={filterPanelNode} />}
        {activeReport === "FMC Contract & Invoice Report" && <FMCInvoiceReport ref={fmcInvoiceReportRef} fmcInvoices={fmcInvoices} fmcContracts={fmcContracts} customers={customers} globalFilters={sectionFilters.fmc_invoices} contractFilters={sectionFilters.fmc_contracts} filterPanel={filterPanelNode} />}
        {activeReport === "Service Desk Report" && <ServiceDeskReport ref={serviceDeskReportRef} fmcTickets={fmcTickets} employees={employees} globalFilters={sectionFilters.tickets} filterPanel={filterPanelNode} />}
        {activeReport === "Customer Payment Summary" && <CustomerPaymentSummaryReport ref={customerPaymentSummaryReportRef} customers={customers} loans={loans} payments={payments} fmcInvoices={fmcInvoices} globalFilters={sectionFilters.emi} filterPanel={filterPanelNode} />}
      </div>
    </div>
  );

};

export default ReportCenter;
