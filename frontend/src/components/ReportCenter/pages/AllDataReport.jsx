import React, { forwardRef, useImperativeHandle, useRef } from "react";
import EMILoanPaymentReport from "./EMILoanPaymentReport";
import FMCInvoiceReport from "./FMCInvoiceReport";
import ServiceDeskReport from "./ServiceDeskReport";
import CustomerPaymentSummaryReport from "./CustomerPaymentSummaryReport";

const AllDataReport = forwardRef((props, ref) => {
  const emiRef = useRef();
  const fmcRef = useRef();
  const serviceRef = useRef();
  const paymentRef = useRef();

  useImperativeHandle(ref, () => ({
    exportCSV: () => {
      const emi = emiRef.current?.exportCSV() || { headers: [], data: [] };
      const fmc = fmcRef.current?.exportCSV() || { headers: [], data: [] };
      const service = serviceRef.current?.exportCSV() || {
        headers: [],
        data: [],
      };
      const payment = paymentRef.current?.exportCSV() || {
        headers: [],
        data: [],
      };

      const sections = [
        { title: "EMI LOAN & PAYMENT REPORT", data: emi, color: "FF3B82F6" },
        {
          title: "FMC CONTRACT & INVOICE REPORT",
          data: fmc,
          color: "FFA855F7",
        },
        { title: "SERVICE DESK REPORT", data: service, color: "FFF97316" },
        { title: "CUSTOMER PAYMENT SUMMARY", data: payment, color: "FF22C55E" },
      ].filter((sec) => sec.data.headers.length > 0);

      const maxRows = Math.max(
        0,
        ...sections.map((sec) => sec.data.data.length),
      );

      const padRow = (row, length) => {
        const padded = [...(row || [])];
        while (padded.length < length) padded.push("");
        return padded;
      };

      const groupRow = [];
      const headerRow = [];
      const merges = [];
      let currentCol = 1;

      sections.forEach((sec, idx) => {
        const len = sec.data.headers.length;
        const paddedGroup = padRow([sec.title], len);
        groupRow.push(...paddedGroup);
        headerRow.push(...sec.data.headers);

        merges.push({
          range: [1, currentCol, 1, currentCol + len - 1],
          color: sec.color,
        });

        if (idx < sections.length - 1) {
          groupRow.push(""); // Spacer column
          headerRow.push(""); // Spacer column
          currentCol += len + 1;
        }
      });

      const combinedData = [];
      for (let i = 0; i < maxRows; i++) {
        const row = [];
        sections.forEach((sec, idx) => {
          const len = sec.data.headers.length;
          const dataRow = sec.data.data[i] || [];
          row.push(...padRow(dataRow, len));

          if (idx < sections.length - 1) {
            row.push(""); // Spacer column
          }
        });
        combinedData.push(row);
      }

      return {
        groupedHeaders: groupRow,
        headers: headerRow,
        data: combinedData,
        merges: merges,
        fileName: "Consolidated_Report",
      };
    },
  }));

  const [activeTab, setActiveTab] = React.useState("emi");

  return (
    <div className="flex flex-col w-full h-full animate-fade-in pb-12 p-2">
      <div className="flex flex-col bg-bg-card rounded-xl shadow-md border border-border-main overflow-hidden">
        {/* Tabs Header */}
        <div className="flex flex-row overflow-x-auto border-b border-border-main bg-bg-main custom-scrollbar">
          <button
            onClick={() => setActiveTab("emi")}
            className={`flex-1 py-4 px-6 text-sm md:text-base font-bold whitespace-nowrap transition-colors flex items-center justify-center border-b-2 ${activeTab === "emi" ? "text-blue-500 border-blue-500 bg-blue-500/10" : "text-text-secondary border-transparent hover:text-text-main hover:bg-bg-card"}`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${activeTab === "emi" ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "bg-transparent"}`}
            ></div>
            EMI Loan & Payment
          </button>

          <button
            onClick={() => setActiveTab("fmc")}
            className={`flex-1 py-4 px-6 text-sm md:text-base font-bold whitespace-nowrap transition-colors flex items-center justify-center border-b-2 ${activeTab === "fmc" ? "text-purple-500 border-purple-500 bg-purple-500/10" : "text-text-secondary border-transparent hover:text-text-main hover:bg-bg-card"}`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${activeTab === "fmc" ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" : "bg-transparent"}`}
            ></div>
            FMC Contract & Invoice
          </button>

          <button
            onClick={() => setActiveTab("service")}
            className={`flex-1 py-4 px-6 text-sm md:text-base font-bold whitespace-nowrap transition-colors flex items-center justify-center border-b-2 ${activeTab === "service" ? "text-orange-500 border-orange-500 bg-orange-500/10" : "text-text-secondary border-transparent hover:text-text-main hover:bg-bg-card"}`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${activeTab === "service" ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" : "bg-transparent"}`}
            ></div>
            Service Desk / Tickets
          </button>

          <button
            onClick={() => setActiveTab("payment")}
            className={`flex-1 py-4 px-6 text-sm md:text-base font-bold whitespace-nowrap transition-colors flex items-center justify-center border-b-2 ${activeTab === "payment" ? "text-green-500 border-green-500 bg-green-500/10" : "text-text-secondary border-transparent hover:text-text-main hover:bg-bg-card"}`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${activeTab === "payment" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-transparent"}`}
            ></div>
            Customer Payment Summary
          </button>
        </div>

        {/* Tab Content - Single Table View */}
        <div className="h-[700px] relative bg-bg-main w-full">
          <div
            className={`w-full h-full ${activeTab === "emi" ? "block" : "hidden"}`}
          >
            <EMILoanPaymentReport ref={emiRef} {...props} />
          </div>
          <div
            className={`w-full h-full ${activeTab === "fmc" ? "block" : "hidden"}`}
          >
            <FMCInvoiceReport ref={fmcRef} {...props} />
          </div>
          <div
            className={`w-full h-full ${activeTab === "service" ? "block" : "hidden"}`}
          >
            <ServiceDeskReport ref={serviceRef} {...props} />
          </div>
          <div
            className={`w-full h-full ${activeTab === "payment" ? "block" : "hidden"}`}
          >
            <CustomerPaymentSummaryReport ref={paymentRef} {...props} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default AllDataReport;
