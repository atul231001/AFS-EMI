import React, {
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { formatINR } from "../../../utils";
import { StatCard } from "../../ORMDashboard";
import { FileText, Search, AlertCircle, Banknote, Wallet } from "lucide-react";

const EMILoanPaymentReport = forwardRef(
  (
    {
      customers = [],
      machines = [],
      loans = [],
      payments = [],
      globalFilters,
      scrollContainerRef,
      isDragging,
      handleMouseDown,
      handleMouseLeave,
      handleMouseUp,
      handleMouseMove,
    },
    ref,
  ) => {
    const data = useMemo(() => {
      return loans.map((loan) => {
        const c =
          customers.find(
            (cust) => cust._id === (loan.customerId?._id || loan.customerId),
          ) || {};
        const m =
          machines.find(
            (mac) =>
              mac.model === loan.machineName || mac._id === loan.machineId,
          ) || {};

        const loanPayments = payments.filter(
          (p) =>
            (p.loanId?._id || p.loanId) === loan._id &&
            (p.status === "Paid" || p.status === "Completed"),
        );
        const totalPaid = loanPayments.reduce(
          (sum, p) => sum + (p.amount || 0),
          0,
        );

        const schedule = loan.schedule || [];
        const pendingSchedule = schedule.filter(
          (s) => s.status === "Pending" || s.status === "Overdue",
        );
        const overdueSchedule = schedule.filter(
          (s) =>
            s.status === "Overdue" ||
            (s.status === "Pending" && new Date(s.dueDate) < new Date()),
        );

        const nextEmi =
          pendingSchedule.length > 0
            ? pendingSchedule.sort(
                (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
              )[0].dueDate
            : "-";
        const outstandingPrincipal =
          pendingSchedule.length > 0
            ? pendingSchedule[pendingSchedule.length - 1].balance
            : loan.principal - totalPaid > 0
              ? loan.principal - totalPaid
              : 0;

        return {
          id: loan._id,
          customerName: c.name || "Unknown",
          customerId: c.customId || c._id,
          machineName: loan.machineName || m.model || "-",
          machineCategory: m.category || "-",
          machinePrice: loan.machinePrice || loan.totalValue || 0,
          discountPercentage: loan.discountPercentage || 0,
          principal: loan.principal || 0,
          downPayment: loan.downPayment || 0,
          emi: loan.emi || 0,
          tenure: loan.tenure || 0,
          interestRate: loan.interestRate || 0,
          emiStartDate: loan.emiStartDate
            ? loan.emiStartDate.split("T")[0]
            : "-",
          status: loan.status || "Pending",
          approvalStatus: loan.approvalStatus || loan.status || "Requested",
          agreementGenerated: loan.agreementGenerated ? "Yes" : "No",
          agreementUrl: loan.agreementUrl || "-",
          totalPaidAmount: totalPaid,
          outstandingPrincipal: outstandingPrincipal,
          nextEmiDueDate: nextEmi
            ? nextEmi !== "-"
              ? nextEmi.split("T")[0]
              : "-"
            : "-",
          overdueEmiCount: overdueSchedule.length,
          invoiceDispatchRef: `${loan.invoiceNumber || "-"} / ${loan.serialNumber || "-"}`,
        };
      });
    }, [loans, customers, machines, payments]);

    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({
      status: "All Statuses",
    });

    const statuses = ["All Statuses", ...new Set(data.map((e) => e.status))];

    const filteredData = data.filter((e) => {
      const matchesSearch =
        e.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (e.id && e.id.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus =
        filters.status === "All Statuses" || e.status === filters.status;
      return matchesSearch && matchesStatus;
    });

    const totalOutstanding = filteredData.reduce(
      (sum, e) => sum + Number(e.outstandingPrincipal || 0),
      0,
    );
    const totalPaid = filteredData.reduce(
      (sum, e) => sum + e.totalPaidAmount,
      0,
    );
    const totalOverdueLoans = filteredData.filter(
      (e) => e.overdueEmiCount > 0,
    ).length;

    useImperativeHandle(ref, () => ({
      exportCSV: () => {
        const headers = [
          "Loan ID",
          "Customer Name",
          "Customer ID",
          "Machine Name",
          "Machine Category",
          "Machine Price",
          "Discount %",
          "Principal Amount",
          "Down Payment",
          "EMI Amount",
          "Tenure (months)",
          "Interest Rate (%)",
          "EMI Start Date",
          "Status",
          "Approval Status",
          "Agreement Generated",
          "Total Paid Amount",
          "Outstanding Principal",
          "Next EMI Due Date",
          "Overdue EMI Count",
          "Invoice / Dispatch Ref",
        ];
        const dataToExport = filteredData.map((e) => [
          e.id,
          e.customerName,
          e.customerId,
          e.machineName,
          e.machineCategory,
          e.machinePrice,
          e.discountPercentage,
          e.principal,
          e.downPayment,
          e.emi,
          e.tenure,
          e.interestRate,
          e.emiStartDate,
          e.status,
          e.approvalStatus,
          e.agreementGenerated,
          e.totalPaidAmount,
          e.outstandingPrincipal,
          e.nextEmiDueDate,
          e.overdueEmiCount,
          e.invoiceDispatchRef,
        ]);
        return {
          headers,
          data: dataToExport,
          fileName: "EMI_Loan_Payment_Report",
        };
      },
      setFilters: (newFilters) =>
        setFilters((prev) => ({ ...prev, ...newFilters })),
      setSearch: (term) => setSearch(term),
    }));

    return (
      <div className="flex flex-col gap-6 min-h-0 h-full flex-1 w-full animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          <StatCard
            icon={Banknote}
            label="TOTAL LOANS"
            value={filteredData.length}
            accent="text-blue-500"
          />
          <StatCard
            icon={Wallet}
            label="TOTAL OUTSTANDING"
            value={formatINR(totalOutstanding)}
            accent="text-orange-500"
          />
          <StatCard
            icon={FileText}
            label="TOTAL COLLECTED"
            value={formatINR(totalPaid)}
            accent="text-green-500"
          />
          <StatCard
            icon={AlertCircle}
            label="LOANS W/ OVERDUE"
            value={totalOverdueLoans}
            accent="text-red-500"
          />
        </div>

        <div className="flex-1 bg-bg-card border border-border-main rounded-2xl flex flex-col shadow-xl overflow-hidden min-h-[400px]">
          <div className="px-6 py-4 border-b border-border-main bg-bg-active/50 flex flex-col gap-4 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                <FileText size={14} className="text-primary" /> EMI LOAN &
                PAYMENT REPORT
              </h3>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
                  size={12}
                />
                <input
                  type="text"
                  placeholder="Search customer or loan ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-bg-deep border border-border-main rounded-lg py-1.5 pl-8 pr-4 text-[11px] text-text-main focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pb-2 pt-1">
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="bg-bg-deep border border-border-main text-text-main text-[10px] rounded px-2 py-1 focus:outline-none focus:border-primary shrink-0"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
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
                  <th className="px-6 py-4">Loan ID</th>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Customer ID</th>
                  <th className="px-6 py-4">Machine Name</th>
                  <th className="px-6 py-4">Machine Category</th>
                  <th className="px-6 py-4 text-right">Machine Price</th>
                  <th className="px-6 py-4 text-center">Discount %</th>
                  <th className="px-6 py-4 text-right">Principal Amount</th>
                  <th className="px-6 py-4 text-right">Down Payment</th>
                  <th className="px-6 py-4 text-right">EMI Amount</th>
                  <th className="px-6 py-4 text-center">Tenure (months)</th>
                  <th className="px-6 py-4 text-center">Interest Rate (%)</th>
                  <th className="px-6 py-4">EMI Start Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Approval Status</th>
                  <th className="px-6 py-4 text-center">Agreement Generated</th>
                  <th className="px-6 py-4">Agreement URL</th>
                  <th className="px-6 py-4 text-right">Total Paid Amount</th>
                  <th className="px-6 py-4 text-right">
                    Outstanding Principal
                  </th>
                  <th className="px-6 py-4">Next EMI Due Date</th>
                  <th className="px-6 py-4 text-center">Overdue EMI Count</th>
                  <th className="px-6 py-4">Invoice / Dispatch Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/30">
                {filteredData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-bg-active transition-colors group"
                  >
                    <td className="px-6 py-4 text-[11px] font-mono text-text-dim">
                      {row.id?.slice(-6).toUpperCase() || "UNK"}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold text-text-main">
                      {row.customerName}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-text-dim">
                      {row.customerId}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-text-main">
                      {row.machineName}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-text-dim">
                      {row.machineCategory}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-right text-text-main">
                      {formatINR(row.machinePrice)}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-center text-text-main">
                      {row.discountPercentage}%
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono font-bold text-text-main text-right">
                      {formatINR(row.principal)}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-right text-text-dim">
                      {formatINR(row.downPayment)}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono font-bold text-text-main text-right">
                      {formatINR(row.emi)}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-center text-text-main">
                      {row.tenure}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-center text-text-main">
                      {row.interestRate}%
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-text-dim">
                      {row.emiStartDate}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${row.status === "Closed" || row.status === "Completed" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-text-main">
                      {row.approvalStatus}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-center text-text-main">
                      {row.agreementGenerated}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-blue-400 underline cursor-pointer">
                      {row.agreementUrl !== "-" ? "View" : "-"}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono font-bold text-green-400 text-right">
                      {formatINR(row.totalPaidAmount)}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono font-bold text-orange-400 text-right">
                      {formatINR(row.outstandingPrincipal)}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-text-dim">
                      {row.nextEmiDueDate}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono font-bold text-center text-red-400">
                      {row.overdueEmiCount > 0 ? row.overdueEmiCount : "-"}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-text-dim">
                      {row.invoiceDispatchRef}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  },
);

export default EMILoanPaymentReport;
