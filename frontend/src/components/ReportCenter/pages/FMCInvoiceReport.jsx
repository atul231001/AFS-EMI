import React, {
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { formatINR } from "../../../utils";
import { StatCard } from "../../ORMDashboard";
import {
  FileText,
  Search,
  AlertCircle,
  Banknote,
  Clock,
  CheckCircle,
} from "lucide-react";

const FMCInvoiceReport = forwardRef(
  (
    {
      fmcInvoices = [],
      fmcContracts = [],
      customers = [],
      globalFilters,
      contractFilters,
      filterPanel,
    },
    ref,
  ) => {
    const scrollContainerRef = useRef(null);

    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const handleWheel = (e) => {
        if (e.deltaY !== 0 && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
          e.preventDefault();
          container.scrollLeft += e.deltaY;
        }
      };

      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }, []);

    const data = useMemo(() => {
      return fmcInvoices.map((invoice) => {
        const contract =
          fmcContracts.find((c) => c._id === invoice.contractId) || {};
        const customer =
          customers.find(
            (c) =>
              c._id === contract.customerId || c._id === invoice.customerId,
          ) || {};

        const preTaxTotal = (invoice.totalAmount || 0) - (invoice.gst || 0);
        const partsAndLabor =
          (invoice.partsCharge || 0) + (invoice.laborCharge || 0);

        return {
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber || "-",
          contractId: invoice.contractId || "-",
          agreementNumber:
            invoice.agreementNumber || contract.agreementNumber || "-",
          customerName:
            customer.name ||
            contract.customerName ||
            invoice.customerName ||
            "Unknown",
          machine: contract.machineName || contract.model || "-",
          billingMonth: invoice.billingMonth || "-",
          totalHours: invoice.totalHours || 0,
          billedHours: invoice.billedHours || 0,
          hourlyRate: invoice.hourlyRate || 0,
          fixedCharge: invoice.fixedCharge || 0,
          usageCharge: invoice.usageCharge || 0,
          partsLaborCharge: partsAndLabor,
          totalExclGst: preTaxTotal,
          gst: invoice.gst || 0,
          invoiceTotal: invoice.totalAmount || 0,
          paymentStatus: invoice.status || "Pending",
          paidDate: invoice.paidAt ? invoice.paidAt.split("T")[0] : "-",
        };
      });
    }, [fmcInvoices, fmcContracts, customers]);

    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({
      status: "All Statuses",
    });

    const statuses = [
      "All Statuses",
      ...new Set(data.map((e) => e.paymentStatus)),
    ];

    const filteredData = data.filter((e) => {
      // ── local search & status dropdown ──────────────────────────────────────
      const matchesSearch =
        e.customerName.toLowerCase().includes(search.toLowerCase()) ||
        e.invoiceNumber.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        filters.status === "All Statuses" || e.paymentStatus === filters.status;

      // ── sidebar global filters ───────────────────────────────────────────────
      const gf = globalFilters || {};

      // Text searches
      const gfInvNum = (gf.invoiceNumber || "").toLowerCase();
      const gfAgrNum = (gf.agreementNumber || "").toLowerCase();
      const gfCustNm = (gf.customerName || "").toLowerCase();
      const matchesTexts =
        (!gfInvNum || e.invoiceNumber.toLowerCase().includes(gfInvNum)) &&
        (!gfAgrNum || e.agreementNumber.toLowerCase().includes(gfAgrNum)) &&
        (!gfCustNm || e.customerName.toLowerCase().includes(gfCustNm));

      // Payment status (multi-select)
      const gfPaySt = gf.paymentStatus || [];
      const matchesPaySt =
        gfPaySt.length === 0 || gfPaySt.includes(e.paymentStatus);

      // Billing month date range
      const gfBilling = gf.billingMonth || {};
      let matchesBilling = true;
      if (gfBilling.from || gfBilling.to) {
        const rowDate =
          e.billingMonth && e.billingMonth !== "-"
            ? new Date(e.billingMonth)
            : null;
        if (rowDate) {
          if (gfBilling.from && rowDate < new Date(gfBilling.from))
            matchesBilling = false;
          if (gfBilling.to && rowDate > new Date(gfBilling.to))
            matchesBilling = false;
        } else {
          matchesBilling = false;
        }
      }

      // Paid date range
      const gfPaid = gf.paidDate || {};
      let matchesPaid = true;
      if (gfPaid.from || gfPaid.to) {
        const rowDate =
          e.paidDate && e.paidDate !== "-" ? new Date(e.paidDate) : null;
        if (rowDate) {
          if (gfPaid.from && rowDate < new Date(gfPaid.from))
            matchesPaid = false;
          if (gfPaid.to && rowDate > new Date(gfPaid.to)) matchesPaid = false;
        } else {
          matchesPaid = false;
        }
      }

      // Financial ranges
      const inRange = (val, range) => {
        const min =
          range?.min !== "" && range?.min != null ? Number(range.min) : null;
        const max =
          range?.max !== "" && range?.max != null ? Number(range.max) : null;
        if (min !== null && val < min) return false;
        if (max !== null && val > max) return false;
        return true;
      };
      const matchesFinancial =
        inRange(e.totalHours, gf.totalHours) &&
        inRange(e.hourlyRate, gf.hourlyRate) &&
        inRange(e.invoiceTotal, gf.invoiceTotal);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesTexts &&
        matchesPaySt &&
        matchesBilling &&
        matchesPaid &&
        matchesFinancial
      );
    });

    const totalBilled = filteredData.reduce(
      (sum, e) => sum + e.invoiceTotal,
      0,
    );
    const totalPaid = filteredData
      .filter((e) => e.paymentStatus === "Paid")
      .reduce((sum, e) => sum + e.invoiceTotal, 0);
    const pendingInvoicesCount = filteredData.filter(
      (e) => e.paymentStatus !== "Paid",
    ).length;

    useImperativeHandle(ref, () => ({
      exportCSV: () => {
        const headers = [
          "Invoice Number",
          "Contract ID",
          "Agreement Number",
          "Customer Name",
          "Machine",
          "Billing Month",
          "Total Hours",
          "Billed Hours",
          "Hourly Rate",
          "Fixed Charge",
          "Usage Charge",
          "Parts + Labour Charges",
          "Total Amount (excl. GST)",
          "GST",
          "Invoice Total",
          "Payment Status",
          "Paid Date",
        ];
        const dataToExport = filteredData.map((e) => [
          e.invoiceNumber,
          e.contractId,
          e.agreementNumber,
          e.customerName,
          e.machine,
          e.billingMonth,
          e.totalHours,
          e.billedHours,
          e.hourlyRate,
          e.fixedCharge,
          e.usageCharge,
          e.partsLaborCharge,
          e.totalExclGst,
          e.gst,
          e.invoiceTotal,
          e.paymentStatus,
          e.paidDate,
        ]);
        return { headers, data: dataToExport, fileName: "FMC_Invoice_Report" };
      },
      setFilters: (newFilters) =>
        setFilters((prev) => ({ ...prev, ...newFilters })),
      setSearch: (term) => setSearch(term),
    }));

    return (
      <div className="flex flex-col gap-6 min-h-0 h-full flex-1 w-full animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          <StatCard
            icon={FileText}
            label="TOTAL INVOICES"
            value={filteredData.length}
            accent="text-blue-500"
          />
          <StatCard
            icon={Banknote}
            label="TOTAL BILLED"
            value={formatINR(totalBilled)}
            accent="text-orange-500"
          />
          <StatCard
            icon={CheckCircle}
            label="TOTAL PAID"
            value={formatINR(totalPaid)}
            accent="text-green-500"
          />
          <StatCard
            icon={AlertCircle}
            label="PENDING INVOICES"
            value={pendingInvoicesCount}
            accent="text-red-500"
          />
        </div>

        {filterPanel}

        <div className="bg-bg-card border border-border-main rounded-2xl flex flex-col shadow-xl overflow-hidden shrink min-h-0">
          <div className="px-6 py-4 border-b border-border-main bg-bg-active/50 flex flex-col gap-4 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                <FileText size={14} className="text-primary" /> FMC CONTRACT &
                INVOICE REPORT
              </h3>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
                  size={12}
                />
                <input
                  type="text"
                  placeholder="Search customer or invoice..."
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
            className="shrink min-h-0 w-full max-w-full overflow-x-auto overflow-y-auto custom-scrollbar"
          >
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 bg-bg-deep z-10">
                <tr className="border-b border-border-main text-[9px] font-bold text-text-dim uppercase tracking-widest">
                  <th className="px-6 py-4">Invoice Number</th>
                  <th className="px-6 py-4">Contract ID</th>
                  <th className="px-6 py-4">Agreement Number</th>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Machine</th>
                  <th className="px-6 py-4">Billing Month</th>
                  <th className="px-6 py-4 text-center">Total Hours</th>
                  <th className="px-6 py-4 text-center">Billed Hours</th>
                  <th className="px-6 py-4 text-right">Hourly Rate</th>
                  <th className="px-6 py-4 text-right">Fixed Charge</th>
                  <th className="px-6 py-4 text-right">Usage Charge</th>
                  <th className="px-6 py-4 text-right">
                    Parts + Labour Charges
                  </th>
                  <th className="px-6 py-4 text-right">
                    Total Amount (excl. GST)
                  </th>
                  <th className="px-6 py-4 text-right">GST</th>
                  <th className="px-6 py-4 text-right">Invoice Total</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Paid Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/30">
                {filteredData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-bg-active transition-colors group"
                  >
                    <td className="px-6 py-4 text-[11px] font-mono text-text-main">
                      {row.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-text-dim">
                      {row.contractId}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-text-main">
                      {row.agreementNumber}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold text-text-main">
                      {row.customerName}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-text-main">
                      {row.machine}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-text-dim">
                      {row.billingMonth}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-center text-text-main">
                      {row.totalHours}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-center text-text-main">
                      {row.billedHours}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-right text-text-main">
                      {formatINR(row.hourlyRate)}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-right text-text-main">
                      {formatINR(row.fixedCharge)}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-right text-text-main">
                      {formatINR(row.usageCharge)}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-right text-text-main">
                      {formatINR(row.partsLaborCharge)}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-right text-text-dim">
                      {formatINR(row.totalExclGst)}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-right text-text-main">
                      {formatINR(row.gst)}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono font-bold text-right text-text-main">
                      {formatINR(row.invoiceTotal)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${row.paymentStatus === "Paid" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}`}
                      >
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-text-dim">
                      {row.paidDate}
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

export default FMCInvoiceReport;
