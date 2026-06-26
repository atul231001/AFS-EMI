import React, { useState, useMemo, forwardRef, useImperativeHandle } from "react";
import { StatCard } from "../../ORMDashboard";
import { FileText, Search, AlertCircle, Clock, Wrench, CheckCircle } from "lucide-react";

const ServiceDeskReport = forwardRef(({ fmcTickets = [], employees = [], globalFilters, scrollContainerRef, isDragging, handleMouseDown, handleMouseLeave, handleMouseUp, handleMouseMove }, ref) => {
  const data = useMemo(() => {
    return fmcTickets.map(ticket => {
      const history = ticket.approvalHistory || [];
      const lastHistory = history.length > 0 ? history[history.length - 1] : {};
      
      const supervisor = employees.find(e => e._id === ticket.supervisorId) || {};
      const approverName = lastHistory.approverId ? (employees.find(e => e._id === lastHistory.approverId)?.name || lastHistory.approverId) : '-';

      return {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber || '-',
        machineName: ticket.machineName || '-',
        contractId: ticket.contractId || '-',
        breakdownType: ticket.breakdownType || 'General',
        severity: ticket.severity || 'Medium',
        description: ticket.description || '-',
        location: ticket.location || '-',
        hourReading: ticket.hourReading || 0,
        currentStatus: ticket.status || 'Open',
        currentStep: ticket.currentStepIndex || 0,
        assignedSupervisor: supervisor.name || '-',
        latestApprover: approverName,
        lastAction: lastHistory.action || '-',
        lastNotes: lastHistory.notes || '-',
        createdAt: ticket.createdAt ? ticket.createdAt.split('T')[0] : '-',
        updatedAt: ticket.updatedAt ? ticket.updatedAt.split('T')[0] : '-',
      };
    });
  }, [fmcTickets, employees]);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "All Statuses",
    severity: "All Severities"
  });

  const statuses = ["All Statuses", ...new Set(data.map((e) => e.currentStatus))];
  const severities = ["All Severities", ...new Set(data.map((e) => e.severity))];

  const filteredData = data.filter((e) => {
    const matchesSearch = e.ticketNumber.toLowerCase().includes(search.toLowerCase()) || e.machineName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filters.status === "All Statuses" || e.currentStatus === filters.status;
    const matchesSeverity = filters.severity === "All Severities" || e.severity === filters.severity;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const totalTickets = filteredData.length;
  const highSeverityCount = filteredData.filter(e => e.severity === 'High').length;
  const openCount = filteredData.filter(e => e.currentStatus !== 'Closed' && e.currentStatus !== 'Resolved').length;

  useImperativeHandle(ref, () => ({
    exportCSV: () => {
      const headers = [
        "Ticket Number", "Machine Name", "Contract ID", "Breakdown Type", "Severity",
        "Description", "Location", "Hour Reading", "Current Status", "Current Step",
        "Assigned Supervisor", "Latest Approver", "Last Action", "Last Notes",
        "Created At", "Updated At"
      ];
      const dataToExport = filteredData.map(e => [
        e.ticketNumber, e.machineName, e.contractId, e.breakdownType, e.severity,
        e.description, e.location, e.hourReading, e.currentStatus, e.currentStep,
        e.assignedSupervisor, e.latestApprover, e.lastAction, e.lastNotes,
        e.createdAt, e.updatedAt
      ]);
      return { headers, data: dataToExport, fileName: 'Service_Desk_Report' };
    },
    setFilters: (newFilters) => setFilters(prev => ({ ...prev, ...newFilters })),
    setSearch: (term) => setSearch(term)
  }));

  return (
    <div className="flex flex-col gap-6 min-h-0 h-full flex-1 w-full animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <StatCard icon={Wrench} label="TOTAL TICKETS" value={totalTickets} accent="text-blue-500" />
        <StatCard icon={AlertCircle} label="HIGH SEVERITY" value={highSeverityCount} accent="text-red-500" />
        <StatCard icon={Clock} label="OPEN/PENDING" value={openCount} accent="text-orange-500" />
        <StatCard icon={CheckCircle} label="RESOLVED" value={totalTickets - openCount} accent="text-green-500" />
      </div>

      <div className="flex-1 bg-bg-card border border-border-main rounded-2xl flex flex-col shadow-xl overflow-hidden min-h-[400px]">
        <div className="px-6 py-4 border-b border-border-main bg-bg-active/50 flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
              <Wrench size={14} className="text-primary" /> SERVICE DESK REPORT
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={12} />
              <input
                type="text"
                placeholder="Search ticket or machine..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-bg-deep border border-border-main rounded-lg py-1.5 pl-8 pr-4 text-[11px] text-text-main focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pb-2 pt-1">
             <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="bg-bg-deep border border-border-main text-text-main text-[10px] rounded px-2 py-1 focus:outline-none focus:border-primary shrink-0">
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
             <select value={filters.severity} onChange={(e) => setFilters({...filters, severity: e.target.value})} className="bg-bg-deep border border-border-main text-text-main text-[10px] rounded px-2 py-1 focus:outline-none focus:border-primary shrink-0">
              {severities.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
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
            <thead className="sticky top-0 bg-bg-deep z-10">
              <tr className="border-b border-border-main text-[9px] font-bold text-text-dim uppercase tracking-widest">
                <th className="px-6 py-4">Ticket Number</th>
                <th className="px-6 py-4">Machine Name</th>
                <th className="px-6 py-4">Contract ID</th>
                <th className="px-6 py-4">Breakdown Type</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-center">Hour Reading</th>
                <th className="px-6 py-4">Current Status</th>
                <th className="px-6 py-4 text-center">Current Step</th>
                <th className="px-6 py-4">Assigned Supervisor</th>
                <th className="px-6 py-4">Latest Approver</th>
                <th className="px-6 py-4">Last Action</th>
                <th className="px-6 py-4">Last Notes</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4">Updated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/30">
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-bg-active transition-colors group">
                  <td className="px-6 py-4 text-[11px] font-mono font-bold text-text-main">{row.ticketNumber}</td>
                  <td className="px-6 py-4 text-[11px] text-text-main">{row.machineName}</td>
                  <td className="px-6 py-4 text-[11px] font-mono text-text-dim">{row.contractId}</td>
                  <td className="px-6 py-4 text-[11px] text-text-dim">{row.breakdownType}</td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${row.severity === "High" ? "bg-red-500/10 text-red-500 border-red-500/20" : row.severity === "Medium" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"}`}>
                      {row.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] text-text-main max-w-xs truncate" title={row.description}>{row.description}</td>
                  <td className="px-6 py-4 text-[11px] text-text-dim">{row.location}</td>
                  <td className="px-6 py-4 text-[11px] font-mono text-center text-text-main">{row.hourReading}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${row.currentStatus === "Closed" || row.currentStatus === "Resolved" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}`}>
                      {row.currentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-mono text-center text-text-main">{row.currentStep}</td>
                  <td className="px-6 py-4 text-[11px] text-text-main">{row.assignedSupervisor}</td>
                  <td className="px-6 py-4 text-[11px] text-text-main">{row.latestApprover}</td>
                  <td className="px-6 py-4 text-[11px] text-text-main">{row.lastAction}</td>
                  <td className="px-6 py-4 text-[11px] text-text-dim max-w-[150px] truncate" title={row.lastNotes}>{row.lastNotes}</td>
                  <td className="px-6 py-4 text-[11px] font-mono text-text-dim">{row.createdAt}</td>
                  <td className="px-6 py-4 text-[11px] font-mono text-text-dim">{row.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default ServiceDeskReport;
