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
import FilterSidebar from "./Filters/FilterSidebar";

const ReportCenter = () => {
  const [activeReport, setActiveReport] = useState("All Reports");
  const reportTypes = [
    "All Reports",
    "EMI Loan & Payment Report",
    "FMC Contract & Invoice Report",
    "Service Desk Report",
    "Customer Payment Summary"
  ];

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [globalFilters, setGlobalFilters] = useState({
    date: { type: 'EMI Due Date', from: '', to: '', preset: '' },
    financial: { 
      downPayment: { min: '', max: '' }, 
      emi: { min: '', max: '' }, 
      outstanding: { min: '', max: '' } 
    },
    status: [],
    overdueDays: { min: '', max: '' },
    customer: { name: '', type: '', locations: [], executives: [] },
    machine: { category: '', models: [], status: '' },
    advanced: []
  });

  // Count active (non-default) filter fields for the badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (globalFilters.date.from || globalFilters.date.to) count++;
    if (globalFilters.status.length > 0) count++;
    if (globalFilters.customer.name) count++;
    if (globalFilters.customer.type) count++;
    if (globalFilters.machine.category) count++;
    if (globalFilters.machine.status) count++;
    if (globalFilters.financial.downPayment.min || globalFilters.financial.downPayment.max) count++;
    if (globalFilters.financial.emi.min || globalFilters.financial.emi.max) count++;
    if (globalFilters.financial.outstanding.min || globalFilters.financial.outstanding.max) count++;
    if (globalFilters.overdueDays.min || globalFilters.overdueDays.max) count++;
    return count;
  }, [globalFilters]);

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

  // Drag to scroll logic shared across tables (Optimized with useRef to prevent heavy re-renders)
  const scrollContainerRef = useRef(null);
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });

  const handleMouseDown = (e) => {
    if (!scrollContainerRef.current) return;
    dragState.current.isDragging = true;
    dragState.current.startX = e.pageX - scrollContainerRef.current.offsetLeft;
    dragState.current.scrollLeft = scrollContainerRef.current.scrollLeft;
    
    // Direct DOM manipulation for CSS classes to avoid React re-renders on large tables
    scrollContainerRef.current.classList.add('cursor-grabbing', 'select-none');
    scrollContainerRef.current.classList.remove('cursor-grab');
  };

  const handleMouseLeave = () => {
    dragState.current.isDragging = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.classList.remove('cursor-grabbing', 'select-none');
      scrollContainerRef.current.classList.add('cursor-grab');
    }
  };

  const handleMouseUp = () => {
    dragState.current.isDragging = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.classList.remove('cursor-grabbing', 'select-none');
      scrollContainerRef.current.classList.add('cursor-grab');
    }
  };

  const handleMouseMove = (e) => {
    if (!dragState.current.isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.5;
    scrollContainerRef.current.scrollLeft = dragState.current.scrollLeft - walk;
  };

  const dragHandlers = {
    scrollContainerRef,
    handleMouseDown,
    handleMouseLeave,
    handleMouseUp,
    handleMouseMove
  };

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

  return (
    <div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-hidden pr-2 animate-fade-in">

      {/* Filter Drawer */}
      <FilterSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(o => !o)}
        filters={globalFilters}
        onApply={setGlobalFilters}
        activeFilterCount={activeFilterCount}
        headerRight={
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/15 border border-primary/30 rounded-full text-[9px] font-black text-primary uppercase tracking-wider animate-fade-in">
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-primary text-black rounded-full text-[8px] font-black">{activeFilterCount}</span>
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
        {activeReport === "All Reports" && <AllDataReport ref={allDataReportRef} customers={customers} machines={machines} loans={loans} payments={payments} fmcInvoices={fmcInvoices} fmcContracts={fmcContracts} fmcTickets={fmcTickets} employees={employees} globalFilters={globalFilters} {...dragHandlers} />}
        {activeReport === "EMI Loan & Payment Report" && <EMILoanPaymentReport ref={emiLoanPaymentReportRef} customers={customers} machines={machines} loans={loans} payments={payments} globalFilters={globalFilters} {...dragHandlers} />}
        {activeReport === "FMC Contract & Invoice Report" && <FMCInvoiceReport ref={fmcInvoiceReportRef} fmcInvoices={fmcInvoices} fmcContracts={fmcContracts} customers={customers} globalFilters={globalFilters} {...dragHandlers} />}
        {activeReport === "Service Desk Report" && <ServiceDeskReport ref={serviceDeskReportRef} fmcTickets={fmcTickets} employees={employees} globalFilters={globalFilters} {...dragHandlers} />}
        {activeReport === "Customer Payment Summary" && <CustomerPaymentSummaryReport ref={customerPaymentSummaryReportRef} customers={customers} loans={loans} payments={payments} fmcInvoices={fmcInvoices} globalFilters={globalFilters} {...dragHandlers} />}
      </div>
    </div>
  );

};

export default ReportCenter;
