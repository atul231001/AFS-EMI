import React, { useState, useMemo, forwardRef, useImperativeHandle } from "react";
import { formatINR } from "../../../utils";
import { StatCard } from "../../ORMDashboard";
import { Database, Search } from "lucide-react";

const AllDataReport = forwardRef(({ customers = [], machines = [], loans = [], payments = [], globalFilters, scrollContainerRef, isDragging, handleMouseDown, handleMouseLeave, handleMouseUp, handleMouseMove }, ref) => {
  const masterData = useMemo(() => {
    return loans.map(loan => {
      const customer = customers.find(c => c._id === (loan.customerId?._id || loan.customerId)) || {};
      const machine = machines.find(m => m._id === (loan.machineId?._id || loan.machineId)) || {};
      const loanPayments = payments.filter(p => p.loanId === loan._id || p.loanId === loan.loanId);

      const totalPaid = loanPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const outstanding = (loan.principal || loan.machinePrice || 0) - totalPaid;

      let startDateStr = loan.startDate || loan.emiStartDate || new Date().toISOString().split('T')[0];
      if (startDateStr && startDateStr.includes('/')) {
        const parts = startDateStr.split('/');
        if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
           startDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      return {
        id: loan.loanId || loan._id?.toString().slice(-6).toUpperCase() || 'N/A',
        
        // Customer Report Columns
        customerId: `CUST-${customer._id?.toString().slice(-6).toUpperCase() || 'N/A'}`,
        customerDetails: customer.name || 'Unknown',
        industry: customer.companyName || 'General',
        customerStatus: customer.status || 'Active',
        salesExec: customer.salesExec || 'N/A',
        repeatRentals: loanPayments.length > 2 ? 'Yes' : 'No',
        customerOutstanding: outstanding > 0 ? outstanding : 0,
        ltv: totalPaid,

        // Sales Report Columns
        invoiceNo: loan.invoiceNumber || `INV-${loan._id?.toString().slice(-6).toUpperCase() || 'N/A'}`,
        customerMachineSale: `${customer.name || 'Unknown'} - ${machine.name || 'Unknown'}`,
        saleDate: startDateStr.split('T')[0],
        salesExecSale: customer.salesExec || 'N/A',
        financeInfo: loan.provider || 'N/A',
        downPayment: loan.downPayment || 0,
        totalValue: loan.principal || loan.machinePrice || 0,

        // Rental Report Columns
        rentalId: `RNT-${loan._id?.toString().slice(-6).toUpperCase() || 'N/A'}`,
        customerMachineRental: `${customer.name || 'Unknown'} - ${machine.name || 'Unknown'}`,
        locationOperator: `${machine.location || 'N/A'} / ${loan.operator || 'Client Operator'}`,
        durationRental: `${loan.tenure || 12} Months`,
        statusRental: loan.status || 'Active',
        utilization: '80%',
        revenue: totalPaid,

        // Contract Report Columns
        contractId: `CTR-${customer._id?.toString().slice(-6).toUpperCase() || 'N/A'}`,
        projectCustomer: `${customer.companyName || 'Project'} / ${customer.name || 'Unknown'}`,
        locationType: `${customer.city || 'N/A'} / ${loan.type || 'Fixed Price'}`,
        durationContract: `${startDateStr.split('T')[0]} to ${loan.endDate ? loan.endDate.split('T')[0] : 'N/A'}`,
        statusContract: loan.status || 'Active',
        machinesAllocated: 1,
        contractValue: loan.principal || 0,

        // EMI & Payment Report Columns
        emiId: `EMI-${loan._id?.toString().slice(-6).toUpperCase() || 'N/A'}`,
        customerMachineEmi: `${customer.name || 'Unknown'} - ${machine.name || 'Unknown'}`,
        dueDate: loan.nextEmiDate ? loan.nextEmiDate.split('T')[0] : 'N/A',
        paymentDetails: loanPayments.length > 0 ? loanPayments[loanPayments.length - 1].paymentMethod || 'N/A' : 'N/A',
        statusEmi: loan.status || 'Active',
        emiOutstanding: outstanding > 0 ? outstanding : 0,
        overdue: loan.status === 'Overdue' ? 'Yes' : 'No',
        
        // For search/stats
        rawTotalValue: loan.principal || loan.machinePrice || 0,
        rawPaid: totalPaid,
        rawOutstanding: outstanding > 0 ? outstanding : 0,
      };
    });
  }, [loans, customers, machines, payments]);

  const [search, setSearch] = useState("");

  const filteredData = masterData.filter(d => {
    const matchesSearch = d.customerDetails.toLowerCase().includes(search.toLowerCase()) || 
                          d.id.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  useImperativeHandle(ref, () => ({
    exportCSV: () => {
      const groupedHeaders = [
        "Customer Report", "", "", "", "", "", "", "",
        "Sales Report", "", "", "", "", "", "",
        "Rental Report", "", "", "", "", "", "",
        "Contract Report", "", "", "", "", "", "",
        "EMI & Payment Report", "", "", "", "", "", ""
      ];
      const merges = [
        [1, 1, 1, 8],
        [1, 9, 1, 15],
        [1, 16, 1, 22],
        [1, 23, 1, 29],
        [1, 30, 1, 36]
      ];
      const headers = [
        "Customer ID", "Customer Details", "Industry", "Customer Status", "Sales Exec", "Repeat Rentals", "Cust. Outstanding", "LTV (INR)",
        "Invoice #", "Customer & Machine (Sale)", "Sale Date", "Sales Exec (Sale)", "Finance Info", "Down Payment", "Total Value",
        "Rental ID", "Customer & Machine (Rental)", "Location & Operator", "Duration (Rental)", "Status (Rental)", "Utilization", "Revenue",
        "Contract ID", "Project & Customer", "Location & Type", "Duration (Contract)", "Status (Contract)", "Machines Allocated", "Contract Value",
        "EMI ID", "Customer & Machine (EMI)", "Due Date", "Payment Details", "Status (EMI)", "EMI Outstanding", "Overdue"
      ];
      const dataToExport = filteredData.map(d => [
        d.customerId, d.customerDetails, d.industry, d.customerStatus, d.salesExec, d.repeatRentals, d.customerOutstanding, d.ltv,
        d.invoiceNo, d.customerMachineSale, d.saleDate, d.salesExecSale, d.financeInfo, d.downPayment, d.totalValue,
        d.rentalId, d.customerMachineRental, d.locationOperator, d.durationRental, d.statusRental, d.utilization, d.revenue,
        d.contractId, d.projectCustomer, d.locationType, d.durationContract, d.statusContract, d.machinesAllocated, d.contractValue,
        d.emiId, d.customerMachineEmi, d.dueDate, d.paymentDetails, d.statusEmi, d.emiOutstanding, d.overdue
      ]);
      return { groupedHeaders, merges, headers, data: dataToExport, fileName: 'All_Reports_Data' };
    }
  }));

  const totalValue = filteredData.reduce((acc, curr) => acc + curr.rawTotalValue, 0);
  const totalOutstanding = filteredData.reduce((acc, curr) => acc + curr.rawOutstanding, 0);
  const totalPaid = filteredData.reduce((acc, curr) => acc + curr.rawPaid, 0);

  return (
    <div className="flex flex-col gap-6 min-h-0 h-full flex-1 w-full animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <StatCard icon={Database} label="TOTAL RECORDS" value={filteredData.length} accent="text-primary" />
        <StatCard icon={Database} label="TOTAL VALUE" value={formatINR(totalValue)} accent="text-blue-500" />
        <StatCard icon={Database} label="TOTAL PAID" value={formatINR(totalPaid)} accent="text-green-500" />
        <StatCard icon={Database} label="TOTAL OUTSTANDING" value={formatINR(totalOutstanding)} accent="text-red-500" />
      </div>

      <div className="flex-1 bg-bg-card border border-border-main rounded-2xl flex flex-col shadow-xl overflow-hidden min-h-[400px]">
        <div className="px-6 py-4 border-b border-border-main bg-bg-active/50 flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
              <Database size={14} className="text-primary" /> STRICT MASTER DATA REPORT
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={12} />
              <input
                type="text"
                placeholder="Search records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-bg-deep border border-border-main rounded-lg py-1.5 pl-8 pr-4 text-[11px] text-text-main focus:outline-none focus:border-primary transition-colors w-64"
              />
            </div>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className={`flex-1 w-full max-w-full overflow-x-auto overflow-y-auto custom-scrollbar ${isDragging ? "cursor-grabbing select-none" : "cursor-grab"}`}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-10">
              <tr className="bg-bg-active/80 border-b border-border-main text-[9px] font-black text-text-dim uppercase tracking-widest text-center">
                <th colSpan="8" className="px-6 py-2 border-r border-border-main/50 text-indigo-400">Customer Report</th>
                <th colSpan="7" className="px-6 py-2 border-r border-border-main/50 text-green-400">Sales Report</th>
                <th colSpan="7" className="px-6 py-2 border-r border-border-main/50 text-blue-400">Rental Report</th>
                <th colSpan="7" className="px-6 py-2 border-r border-border-main/50 text-yellow-400">Contract Report</th>
                <th colSpan="7" className="px-6 py-2 text-purple-400">EMI & Payment Report</th>
              </tr>
              <tr className="bg-bg-deep border-b border-border-main text-[9px] font-bold text-text-dim uppercase tracking-widest">
                {/* Customer Report */}
                <th className="px-4 py-4 border-l border-border-main/20">Customer ID</th>
                <th className="px-4 py-4">Customer Details</th>
                <th className="px-4 py-4">Industry</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Sales Exec</th>
                <th className="px-4 py-4 text-center">Repeat Rentals</th>
                <th className="px-4 py-4 text-right">Outstanding</th>
                <th className="px-4 py-4 text-right border-r border-border-main/50">LTV (INR)</th>

                {/* Sales Report */}
                <th className="px-4 py-4">Invoice #</th>
                <th className="px-4 py-4">Customer & Machine</th>
                <th className="px-4 py-4">Sale Date</th>
                <th className="px-4 py-4">Sales Exec</th>
                <th className="px-4 py-4">Finance Info</th>
                <th className="px-4 py-4 text-right">Down Payment</th>
                <th className="px-4 py-4 text-right border-r border-border-main/50">Total Value</th>

                {/* Rental Report */}
                <th className="px-4 py-4">Rental ID</th>
                <th className="px-4 py-4">Customer & Machine</th>
                <th className="px-4 py-4">Location & Operator</th>
                <th className="px-4 py-4">Duration</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-center">Utilization</th>
                <th className="px-4 py-4 text-right border-r border-border-main/50">Revenue</th>

                {/* Contract Report */}
                <th className="px-4 py-4">Contract ID</th>
                <th className="px-4 py-4">Project & Customer</th>
                <th className="px-4 py-4">Location & Type</th>
                <th className="px-4 py-4">Duration</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-center">Machines Allocated</th>
                <th className="px-4 py-4 text-right border-r border-border-main/50">Contract Value</th>

                {/* EMI & Payment Report */}
                <th className="px-4 py-4">EMI ID</th>
                <th className="px-4 py-4">Customer & Machine</th>
                <th className="px-4 py-4">Due Date</th>
                <th className="px-4 py-4">Payment Details</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Outstanding</th>
                <th className="px-4 py-4 text-right">Overdue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/30">
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-bg-active transition-colors group cursor-pointer text-[10px]">
                  {/* Customer Report */}
                  <td className="px-4 py-3 font-mono text-text-dim border-l border-border-main/20">{row.customerId}</td>
                  <td className="px-4 py-3 font-black text-text-main">{row.customerDetails}</td>
                  <td className="px-4 py-3 text-text-dim">{row.industry}</td>
                  <td className="px-4 py-3 text-text-dim">{row.customerStatus}</td>
                  <td className="px-4 py-3 text-text-dim">{row.salesExec}</td>
                  <td className="px-4 py-3 text-center">{row.repeatRentals}</td>
                  <td className="px-4 py-3 text-right text-red-400 font-mono">{formatINR(row.customerOutstanding)}</td>
                  <td className="px-4 py-3 text-right font-mono border-r border-border-main/50">{formatINR(row.ltv)}</td>

                  {/* Sales Report */}
                  <td className="px-4 py-3 font-mono text-text-dim">{row.invoiceNo}</td>
                  <td className="px-4 py-3 text-text-main">{row.customerMachineSale}</td>
                  <td className="px-4 py-3 font-mono text-text-dim">{row.saleDate}</td>
                  <td className="px-4 py-3 text-text-dim">{row.salesExecSale}</td>
                  <td className="px-4 py-3 text-text-dim">{row.financeInfo}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatINR(row.downPayment)}</td>
                  <td className="px-4 py-3 text-right font-mono border-r border-border-main/50">{formatINR(row.totalValue)}</td>

                  {/* Rental Report */}
                  <td className="px-4 py-3 font-mono text-text-dim">{row.rentalId}</td>
                  <td className="px-4 py-3 text-text-main">{row.customerMachineRental}</td>
                  <td className="px-4 py-3 text-text-dim">{row.locationOperator}</td>
                  <td className="px-4 py-3 font-mono text-text-dim">{row.durationRental}</td>
                  <td className="px-4 py-3 text-text-dim">{row.statusRental}</td>
                  <td className="px-4 py-3 text-center">{row.utilization}</td>
                  <td className="px-4 py-3 text-right font-mono border-r border-border-main/50">{formatINR(row.revenue)}</td>

                  {/* Contract Report */}
                  <td className="px-4 py-3 font-mono text-text-dim">{row.contractId}</td>
                  <td className="px-4 py-3 text-text-main">{row.projectCustomer}</td>
                  <td className="px-4 py-3 text-text-dim">{row.locationType}</td>
                  <td className="px-4 py-3 font-mono text-text-dim">{row.durationContract}</td>
                  <td className="px-4 py-3 text-text-dim">{row.statusContract}</td>
                  <td className="px-4 py-3 text-center">{row.machinesAllocated}</td>
                  <td className="px-4 py-3 text-right font-mono border-r border-border-main/50">{formatINR(row.contractValue)}</td>

                  {/* EMI & Payment Report */}
                  <td className="px-4 py-3 font-mono text-text-dim">{row.emiId}</td>
                  <td className="px-4 py-3 text-text-main">{row.customerMachineEmi}</td>
                  <td className="px-4 py-3 font-mono text-text-dim">{row.dueDate}</td>
                  <td className="px-4 py-3 text-text-dim">{row.paymentDetails}</td>
                  <td className="px-4 py-3 text-text-dim">{row.statusEmi}</td>
                  <td className="px-4 py-3 text-right text-red-400 font-mono">{formatINR(row.emiOutstanding)}</td>
                  <td className="px-4 py-3 text-right text-yellow-500">{row.overdue}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={36} className="px-6 py-8 text-center text-text-dim text-[11px]">
                    No data records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default AllDataReport;
