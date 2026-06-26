import React, { useState, useRef, useEffect, useMemo } from "react";
import { Filter, Clock, ChevronDown, Download, Printer } from "lucide-react";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { state } from "../../state";

import MachineReport from "./pages/MachineReport";
import CustomerReport from "./pages/CustomerReport";
import SalesReport from "./pages/SalesReport";
import RentalReport from "./pages/RentalReport";
import ContractReport from "./pages/ContractReport";
import EMIPaymentReport from "./pages/EMIPaymentReport";
import AllDataReport from "./pages/AllDataReport";
import FilterSidebar from "./Filters/FilterSidebar";

const ReportCenter = () => {
  const [activeReport, setActiveReport] = useState("All Reports");
  const reportTypes = [
    "All Reports",
    "Machine Reports",
    "Customer Reports",
    "Sales Reports",
    "Rental Reports",
    "Contract Reports",
    "EMI & Payment Reports",
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

  const { customers = [], loans = [], payments = [], machines = [] } = appData || {};

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

  const machineReportRef = useRef(null);
  const customerReportRef = useRef(null);
  const salesReportRef = useRef(null);
  const rentalReportRef = useRef(null);
  const contractReportRef = useRef(null);
  const emiPaymentReportRef = useRef(null);
  const allDataReportRef = useRef(null);

  const handleExportCSV = async () => {
    let result = null;

    if (activeReport === "All Reports" && allDataReportRef.current) {
      result = allDataReportRef.current.exportCSV();
    } else if (activeReport === "Machine Reports" && machineReportRef.current) {
      result = machineReportRef.current.exportCSV();
    } else if (activeReport === "Customer Reports" && customerReportRef.current) {
      result = customerReportRef.current.exportCSV();
    } else if (activeReport === "Sales Reports" && salesReportRef.current) {
      result = salesReportRef.current.exportCSV();
    } else if (activeReport === "Rental Reports" && rentalReportRef.current) {
      result = rentalReportRef.current.exportCSV();
    } else if (activeReport === "Contract Reports" && contractReportRef.current) {
      result = contractReportRef.current.exportCSV();
    } else if (activeReport === "EMI & Payment Reports" && emiPaymentReportRef.current) {
      result = emiPaymentReportRef.current.exportCSV();
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
            sheet.mergeCells(m[0], m[1], m[2], m[3]);
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
      case "Active Rentals":
        setActiveReport("Rental Reports");
        setTimeout(() => {
          if (rentalReportRef.current) {
            rentalReportRef.current.setFilters({
              type: "All Types",
              customer: "All Customers",
              machine: "All Machines",
              status: "Active",
              location: "All Locations",
              operator: "All Operators",
              startDate: "All Dates",
              endDate: "All Dates"
            });
            rentalReportRef.current.setSearch("");
          }
        }, 0);
        break;
      case "Overdue EMIs":
        setActiveReport("EMI & Payment Reports");
        setTimeout(() => {
          if (emiPaymentReportRef.current) {
            emiPaymentReportRef.current.setFilters({
              customer: "All Customers",
              machine: "All Machines",
              status: "Overdue",
              dueDate: "All Dates",
              paymentMethod: "All Methods",
              provider: "All Providers",
            });
            emiPaymentReportRef.current.setSearch("");
          }
        }, 0);
        break;
      case "Expiring Contracts":
        setActiveReport("Contract Reports");
        setTimeout(() => {
          if (contractReportRef.current) {
            contractReportRef.current.setFilters({
              type: "All Types",
              customer: "All Customers",
              projectName: "All Projects",
              status: "Active",
              location: "All Locations",
              startDate: "All Dates",
              endDate: "All Dates"
            });
            contractReportRef.current.setSearch("");
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
                  if (type === "Rental Reports" && rentalReportRef.current && rentalReportRef.current.setFilters) {
                    rentalReportRef.current.setFilters({ type: "All Types", customer: "All Customers", machine: "All Machines", status: "All Statuses", location: "All Locations", operator: "All Operators", startDate: "All Dates", endDate: "All Dates" });
                    rentalReportRef.current.setSearch("");
                  } else if (type === "EMI & Payment Reports" && emiPaymentReportRef.current && emiPaymentReportRef.current.setFilters) {
                    emiPaymentReportRef.current.setFilters({ customer: "All Customers", machine: "All Machines", status: "All Statuses", dueDate: "All Dates", paymentMethod: "All Methods", provider: "All Providers" });
                    emiPaymentReportRef.current.setSearch("");
                  } else if (type === "Contract Reports" && contractReportRef.current && contractReportRef.current.setFilters) {
                    contractReportRef.current.setFilters({ type: "All Types", customer: "All Customers", projectName: "All Projects", status: "All Statuses", location: "All Locations", startDate: "All Dates", endDate: "All Dates" });
                    contractReportRef.current.setSearch("");
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
        {["Active Rentals", "Overdue EMIs", "Expiring Contracts"].map((chip) => (
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
        {activeReport === "All Reports" && <AllDataReport ref={allDataReportRef} customers={customers} machines={machines} loans={loans} payments={payments} globalFilters={globalFilters} {...dragHandlers} />}
        {activeReport === "Machine Reports" && <MachineReport ref={machineReportRef} machines={machines} loans={loans} globalFilters={globalFilters} {...dragHandlers} />}
        {activeReport === "Customer Reports" && <CustomerReport ref={customerReportRef} customers={customers} loans={loans} payments={payments} globalFilters={globalFilters} {...dragHandlers} />}
        {activeReport === "Sales Reports" && <SalesReport ref={salesReportRef} customers={customers} loans={loans} globalFilters={globalFilters} {...dragHandlers} />}
        {activeReport === "Rental Reports" && <RentalReport ref={rentalReportRef} customers={customers} loans={loans} globalFilters={globalFilters} {...dragHandlers} />}
        {activeReport === "Contract Reports" && <ContractReport ref={contractReportRef} customers={customers} loans={loans} globalFilters={globalFilters} {...dragHandlers} />}
        {activeReport === "EMI & Payment Reports" && <EMIPaymentReport ref={emiPaymentReportRef} customers={customers} loans={loans} payments={payments} globalFilters={globalFilters} {...dragHandlers} />}
      </div>
    </div>
  );

};

export default ReportCenter;
