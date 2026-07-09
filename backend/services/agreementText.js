// backend/services/agreementText.js

export const getAgreementPages = (data) => {
  const {
    executionDate,
    customerCompany,
    customerPan,
    customerAddress,
    customerCity,
    customerState,
    customerPin,
    contactPerson,
    tenure,
    overduePenalty,
    formatINR,
    salePrice,
    gst,
    tcs,
    invoiceValue,
    financedAmount,
    finalEmi,
    downPayment
  } = data;

  return [
    // Page 1
    `
      <h1 class="title">HIRE PURCHASE AGREEMENT</h1>
      <div class="text-justify" style="margin-top: 40px;">
        <p>This Hire Purchase Agreement ("Agreement") is made, executed on this ${executionDate}.</p>
        <p style="text-align: center; font-weight: bold; margin: 25px 0; font-size: 14px; letter-spacing: 2px;">BETWEEN</p>
        <p><strong>LIUGONG INDIA PRIVATE LIMITED</strong>, a company originally incorporated under the Companies Act, 1956 and continuing under the Companies Act, 2013, bearing Corporate Identification Number (CIN) <strong>U31908DL2007FTC167005</strong>, and having its registered office at <strong>101, Okhla Industrial Estate, Phase-III, New Delhi – 110020</strong> (hereinafter referred to as the "Owner", which expression shall, unless repugnant to the context or meaning thereof, include its successors-in-interest, legal representatives, permitted assigns, transferees and persons deriving title thereunder);</p>
        <p style="text-align: center; font-weight: bold; margin: 25px 0; font-size: 14px; letter-spacing: 2px;">AND</p>
        <p><strong>${customerCompany}</strong>, a limited liability partnership / entity duly incorporated / registered under the provisions of the applicable laws, bearing identification / registration number <strong>(PAN: ${customerPan})</strong>, and having its registered office at <strong>${customerAddress}, ${customerCity}, ${customerState} – ${customerPin}, India</strong> (hereinafter referred to as the "Hire Purchaser", which expression shall, unless repugnant to the context or meaning thereof, include its successors, legal representatives and permitted assigns).</p>
      </div>
    `,

    // Page 2
    `
      <div class="text-justify">
        <p>Purchaser", which expression shall, unless repugnant to the context or meaning thereof, include its successors, legal representatives and permitted assigns).</p>
        <p>The Owner and the Hire Purchaser are hereinafter collectively as the <strong>"Parties"</strong>.</p>
        <p><strong>WHEREAS:</strong></p>
        <p><strong>A.</strong> The Owner is engaged, inter alia, in the business of manufacturing, marketing, supplying, financing, leasing and providing heavy machinery, construction equipment, mining equipment, earthmoving equipment and allied assets on outright sale, lease and hire-purchase basis;</p>
        <p><strong>B.</strong> The Hire Purchaser has approached the Owner for obtaining certain Machinery and Equipment more particularly described in Schedule I hereto on a hire-purchase basis for use in its lawful business operations;</p>
        <p><strong>C.</strong> The Owner has agreed to provide the said Machinery and Equipment to the Hire Purchaser on the terms and conditions set forth herein, subject to the execution of this Agreement and the furnishing of such guarantees, securities and assurances as may be required by the Owner;</p>
        <p><strong>NOW, THEREFORE</strong>, in consideration of the mutual covenants, representations, warranties, undertakings and obligations contained herein, and intending to create legally binding obligations, the Parties hereby agree as follows:</p>
        <div class="section-title">Nature of Arrangement</div>
        <p>The Parties expressly acknowledge and agree that this Agreement constitutes a genuine hire purchase arrangement and not an outright sale, loan transaction, financing arrangement creating ownership in favour of the Hire Purchaser, or any other form of transfer of property in the Machinery and Equipment. Possession of the Machinery and Equipment is granted to the Hire Purchaser solely for use in accordance with the terms hereof, and ownership, title and proprietary interest shall remain exclusively vested in the Owner until fulfillment of all conditions precedent to transfer of ownership stipulated under this Agreement.</p>
        <div class="section-title">1. DEFINITIONS</div>
        <p>In this Agreement, unless the context otherwise requires:</p>
        <p><strong>"Agreement"</strong> means this Hire Purchase Agreement together with all Schedules, Annexures, Exhibits, Guarantees, Deeds, Undertakings, Acknowledgements, Security Documents, amendments, supplements, addenda, modifications, renewals, extensions and all other documents executed or accepted by the Parties from time to time in connection herewith, whether in physical or electronic form.</p>
        <p><strong>"Machinery and Equipment"</strong> means the machinery more particularly described in Schedule 1 together with all engines, attachments, accessories, implements, tools, software, telematics devices, GPS systems, spare parts, replacements, substitutions, additions, modifications, upgrades, improvements, accessions and all proceeds, insurance claims and rights arising therefrom.</p>
        <p><strong>"Hire Purchase Price" or "Consideration"</strong> means the aggregate amount payable by the Hire Purchaser to the Owner in consideration of the grant of possession, use and the conditional option to acquire ownership of the Machinery and Equipment, comprising the Initial Deposit, Hire Charges/Instalments, taxes, interest and all other amounts specified in Schedule 1.</p>
        <p><strong>"Premises"</strong> means any mine, project site, construction site, industrial unit, warehouse, yard, workshop, storage location, transit point or other place where the Machinery and Equipment are installed, operated, deployed, transported, stored, repaired or otherwise situated, including any site approved by the Owner in writing.</p>
      </div>
    `,

    // Page 3
    `
      <div class="text-justify">
        <p><strong>“Force Majeure”</strong> means any event or circumstance beyond the reasonable control of either Party, including but not limited to acts of God, flood, earthquake, cyclone, fire, epidemic, pandemic, war, invasion, armed conflict, terrorist acts, civil commotion, riot, strike, lockout, labour disturbances, governmental action, change in law, embargo, restriction, failure of public utilities, or any other event which prevents or materially delays the performance of obligations under this Agreement, provided that lack of funds or inability to make payments shall not constitute a Force Majeure event. For avoidance of doubt, Force Majeure shall not excuse or suspend any obligation relating to payment of monies already accrued or due under this Agreement.</p>
        <p><strong>“Third Party Interest”</strong> means any mortgage, charge, pledge, hypothecation, lien, encumbrance, security interest, lease, attachment, assignment, right, title, interest, claim or any other arrangement in favour of any person or entity other than the Owner, affecting or purporting to affect the Equipment or any rights of the Owner therein.</p>
        <p><strong>"Possession"</strong> means actual, physical and operational custody of the Machinery and Equipment delivered to the Hire Purchaser solely as Bailee and user thereof, without transfer of any legal, equitable or beneficial ownership rights.</p>
        <p><strong>“Hire Purchase Period”</strong> means the period specified in Schedule 1 commencing from the Commencement Date and continuing until expiry of the Hire Purchase Period or earlier termination of this Agreement, during which the Hire Purchaser shall remain liable to perform all obligations under this Agreement, including payment of Hire Charges / Instalments including any extension, restructuring, rescheduling or modification thereof agreed by the Parties.</p>
        <p><strong>“Hire Charges / Instalments”</strong> means all amounts payable by the Hire Purchaser to the Owner under this Agreement for the hire purchase of the Machinery and Equipment, including the hire purchase instalments specified in Schedule 1, interest, default charges, taxes and any other monies payable under this Agreement.</p>
        <p><strong>“Commencement Date”</strong> shall mean the date on which this Agreement is executed by both Parties or such other date expressly specified in Schedule 1.</p>
        <p><strong>“Payment Commencement Date”</strong> means the date from which the Hire Purchaser becomes liable to pay the Hire Charges / Instalments under this Agreement, being the date specified in Schedule 1 or the date of dispatch/delivery of the Machinery and Equipment, whichever is earlier.</p>
        <p><strong>“Initial Deposit”</strong> means the amount specified in Schedule 1, deposited by the Hire Purchaser with the Owner as a non-interest-bearing continuing security and collateral assurance for the due, punctual and complete performance of all obligations, liabilities and covenants of the Hire Purchaser under this Agreement. The Initial Deposit shall not constitute part payment towards transfer of ownership unless expressly appropriated by the Owner upon full satisfaction of all obligations under this Agreement.</p>
        <p>The Owner shall have the unrestricted right, without prejudice to any other rights or remedies available under law or this Agreement, to appropriate, adjust or set off the whole or any part of the Initial Deposit towards any outstanding Hire Charges/Instalments, accrued interest, taxes, repossession expenses, transportation costs, storage charges, repair and restoration costs, depreciation attributable to abnormal use or damage, legal expenses, enforcement costs, and any actual loss or damage suffered or incurred by the Owner arising out of any breach, default or non-performance by the Hire Purchaser.</p>
        <p>Any balance remaining after satisfaction of all such liabilities and obligations shall, subject to the terms of this Agreement, be adjusted at the time of closure of the Hire Purchase transaction or refunded to the Hire Purchaser, as may be determined by the Owner.</p>
        <p><strong>"Event of Default"</strong> means the occurrence of any event specified in Clause 15, whether individually or collectively, which entitles the Owner, without prejudice to any other rights available under this Agreement or applicable law, to accelerate the Hire Charges, terminate this Agreement, repossess the Machinery and Equipment, invoke securities, initiate arbitration proceedings, seek interim measures, or pursue any other remedy available in law.</p>
      </div>
    `,

    // Page 4
    `
      <div class="text-justify">
        <p><strong>"Insolvency Event"</strong> means:<br/>
        (a) commencement of any insolvency, liquidation, winding-up, bankruptcy, reorganization, restructuring or similar proceedings against the Hire Purchaser or any Guarantor;<br/>
        (b) admission of any application under the Insolvency and Bankruptcy Code, 2016;<br/>
        (c) appointment of a resolution professional, liquidator, administrator or receiver;<br/>
        (d) suspension of business operations;<br/>
        (e) inability to pay debts as they become due; or<br/>
        (f) any analogous proceeding under applicable law.</p>
        <p><strong>"Security Documents"</strong> means all guarantees, post-dated cheques, NACH mandates, indemnities, undertakings, powers of attorney, acknowledgements, declarations and other documents executed by the Hire Purchaser or any third party in favour of the Owner in connection with this Agreement.</p>
        <p><strong>"Guarantor"</strong> means Mr. ${contactPerson} (PAN: ${customerPan}) or any individual, company, LLP, partnership or other entity executing a guarantee or undertaking securing the obligations of the Hire Purchaser under this Agreement.</p>
        <p><strong>"Insolvency Proceedings"</strong> means proceedings under the Insolvency and Bankruptcy Code, 2016, winding-up proceedings under the Companies Act, 2013, LLP liquidation proceedings or any analogous proceeding.</p>
        <p><strong>"Electronic Communication"</strong> means any communication transmitted by electronic mail, digital platform, secured portal, SMS, WhatsApp, electronic signature platform or other electronic means capable of generating a record.</p>
        <p><strong>"Outstanding Dues"</strong> means all monies, liabilities and obligations owing by the Hire Purchaser to the Owner under or in connection with this Agreement, whether present, future, actual, contingent, accrued or unaccrued, including principal, interest, taxes, damages, indemnities, costs, expenses and legal fees.</p>
        <p><strong>"Receiver"</strong> means any person appointed by a court, arbitral tribunal or the Owner, to the extent permitted by law, for taking possession, custody, management, preservation or protection of the Machinery and Equipment.</p>
        <div class="section-title">2. NATURE OF TRANSACTION AND OWNERSHIP</div>
        <p><strong>2.1 Delivery of Possession</strong><br/>
        Upon execution of this Agreement and fulfilment of the conditions precedent specified herein, the Owner shall deliver possession of the Machinery and Equipment to the Hire Purchaser solely for the purposes of use and operation in accordance with this Agreement.</p>
        <p>The Parties expressly acknowledge and agree that such delivery shall constitute delivery of possession only and shall not operate as a sale, transfer, assignment, conveyance or passing of any legal, equitable or beneficial ownership, title or interest in favour of the Hire Purchaser.</p>
        <p>The Hire Purchaser shall hold and use the Machinery and Equipment exclusively as Bailee of the Owner and subject to the terms and conditions contained herein.</p>
        <p><strong>2.2 Purpose and Nature of Arrangement</strong><br/>
        This Agreement constitutes a hire-purchase arrangement whereby the Owner grants to the Hire Purchaser a limited right to possess, use and operate the Machinery and Equipment during the Hire Purchase Period, subject to the payment of Hire Charges and compliance with the terms hereof.</p>
        <p><strong>2.3 Retention of Title</strong><br/>
        Notwithstanding delivery of possession of the Machinery and Equipment or issuance of any tax invoice, legal, equitable and beneficial ownership, title and interest in the Machinery and Equipment shall at all times remain vested exclusively in the Owner.</p>
      </div>
    `,

    // Page 5
    `
      <div class="text-justify">
        <p>The Parties expressly agree that the intention contemplated under Sections 19 to 24 of the Sale of Goods Act, 1930 is that no property in the Machinery and Equipment shall pass to the Hire Purchaser unless and until:<br/>
        (a) all amounts payable under this Agreement have been irrevocably paid in full;<br/>
        (b) all obligations of the Hire Purchaser have been duly performed; and<br/>
        (c) the Owner has issued a No Dues Certificate.</p>
        <p><strong>2.4 Bailment and Custody</strong><br/>
        The Hire Purchaser acknowledges that possession of the Machinery and Equipment is granted solely on a bailment basis and that the relationship between the Parties in respect thereof shall, to the extent applicable, be that of Bailor and Bailee.</p>
        <p>The Hire Purchaser shall hold the Machinery and Equipment in trust for and on behalf of the Owner and shall not assert any ownership, possessory, equitable or proprietary rights inconsistent with the rights of the Owner.</p>
        <p><strong>2.5 Restriction on Dealings</strong><br/>
        The Hire Purchaser shall not, without the prior written consent of the Owner, sell, assign, transfer, lease, sub-hire, mortgage, pledge, hypothecate, create any lien or encumbrance upon, part with possession of, or otherwise deal with or dispose of the Machinery and Equipment or permit the creation of any third-party interest therein.</p>
        <p>Any act or omission in contravention of this Clause shall constitute an immediate Event of Default.</p>
        <p><strong>2.6 No Liability of Owner towards Third-Party Financing</strong><br/>
        Any loan, credit facility, or financial assistance, if obtained by the Hire Purchaser from any third party in violation of this Agreement, shall be solely at the risk and responsibility of the Hire Purchaser.</p>
        <p>The Owner shall not be liable or responsible in any manner whatsoever to any such third party, lender, bank, NBFC, or financial institution for any claims, losses, damages, or liabilities arising out of or in connection with such financing.</p>
        <p>Any such third party shall be deemed to have extended such facility at its own risk without any reliance on the Owner, and without any confirmation, authorization, or undertaking from the Owner.</p>
        <p>No third party shall be entitled, under any circumstances, to take possession, repossess, seize, attach, or otherwise deal with the Machinery and Equipment for any default, breach, or non-payment by the Hire Purchaser to such third party.</p>
        <p><strong>2.7 Voidness of Unauthorized Representations</strong><br/>
        Any representation, document usage, or undertaking made by the Hire Purchaser in contravention of this Agreement shall be null, void, and unenforceable against the Owner ab initio, and shall not create any rights, title, interest, or liability against the Owner.</p>
        <p><strong>2.8 Nature of Transaction</strong><br/>
        The Parties expressly acknowledge and agree that this Agreement constitutes a hire-purchase transaction and not a contract of sale, deferred payment sale, loan transaction, financial lease or secured lending arrangement.</p>
        <p>The Hire Purchaser acquires only a contractual right to possess and use the Machinery and Equipment during the Hire Purchase Period together with a conditional option to acquire ownership upon complete performance of all obligations hereunder.</p>
        <p>Nothing contained in this Agreement, including delivery of possession, issuance of invoices, payment of taxes, registration of the Machinery and Equipment or payment of any instalment, shall be construed as effecting an immediate transfer of ownership or property in the Machinery and Equipment.</p>
      </div>
    `,

    // Page 6
    `
      <div class="text-justify">
        <p><strong>2.9 Insolvency and Bankruptcy Protection</strong><br/>
        The Parties expressly acknowledge that the Machinery and Equipment constitute the exclusive property of the Owner and shall not form part of the assets, estate, liquidation estate or insolvency estate of the Hire Purchaser.</p>
        <p>The Hire Purchaser shall not claim, and no insolvency professional, liquidator, administrator, creditor or governmental authority shall be entitled to treat, the Machinery and Equipment as assets belonging to the Hire Purchaser merely by reason of possession or use thereof.</p>
        <p>The Hire Purchaser shall promptly notify the Owner upon occurrence of any Insolvency Event and shall extend full cooperation to enable the Owner to recover possession of the Machinery and Equipment, subject to applicable law.</p>
        <p><strong>2.10 Continuing Rights of Owner</strong><br/>
        The rights, title, interests, remedies and powers of the Owner under this Agreement shall remain continuing, absolute and cumulative and shall not be affected, impaired or discharged by any extension of time, restructuring, rescheduling, waiver, indulgence, compromise or forbearance granted to the Hire Purchaser.</p>
        <p>No delay or omission in exercising any right or remedy shall constitute a waiver thereof.</p>
        <div class="section-title">3. TERM</div>
        <p><strong>3.1 Commencement</strong><br/>
        This Agreement shall commence on the Commencement Date specified in Schedule 1 and shall remain in force unless terminated in accordance with the provisions of this Agreement.</p>
        <p>Notwithstanding the foregoing, where the dispatch, delivery of the Machinery and Equipment is delayed due to:<br/>
        (a) delay or default in payment of the Initial Deposit by the Hire Purchaser;<br/>
        (b) non-availability or non-readiness of the project site;<br/>
        (c) non-commencement, suspension or stoppage of mining, construction or project operations;<br/>
        (d) any act, omission or default of the Hire Purchaser; or<br/>
        (e) any event beyond the reasonable control of the Owner,<br/>
        the Owner shall be entitled to revise the Commencement Date and the corresponding instalment schedule by written notice or electronic mail to the Hire Purchaser.</p>
        <p><strong>3.2 Duration of Hire Purchase</strong><br/>
        The hire purchase of the Machinery and Equipment shall continue for the Hire Purchase Period specified in Schedule 1 and shall remain in force until:<br/>
        (a) the Hire Purchase Price and all other amounts payable under this Agreement have been fully paid by the Hire Purchaser; and<br/>
        (b) all obligations of the Hire Purchaser under this Agreement have been duly performed,<br/>
        unless terminated earlier in accordance with the terms of this Agreement.</p>
        <p>Where the Commencement Date is revised pursuant to Clause 3.1, the Hire Purchase Period and instalment schedule shall stand revised accordingly.</p>
        <p><strong>3.3 Commencement of Instalment Liability</strong><br/>
        The Hire Purchaser's obligation to pay the Hire Purchase Instalments shall arise from the date of dispatch, delivery of the Machinery and Equipment, or such revised commencement date as may be notified by the Owner pursuant to Clause 3.1.</p>
        <p>The due dates specified in Schedule 1 shall stand amended accordingly and shall be binding upon the Hire Purchaser.</p>
        <p><strong>3.4 Prepayment</strong><br/>
        The Hire Purchaser may, at any time during the Hire Purchase Period, prepay the outstanding amount under this Agreement by giving the Owner not less than thirty (30) days' prior written notice.</p>
      </div>
    `,

    // Page 7
    `
      <div class="text-justify">
        <p>The prepayment amount shall be equal to the outstanding principal amount together with all accrued instalments, interest, taxes, charges, costs and other amounts payable under this Agreement up to the proposed prepayment date.</p>
        <p><strong>3.5 Continuity of Obligations</strong><br/>
        The obligations of the Hire Purchaser to pay all Hire Charges and other amounts under this Agreement shall be absolute and unconditional and shall not be subject to any deduction, withholding, abatement, set-off, counterclaim or defence arising from any dispute relating to the Machinery and Equipment, the manufacturer, the supplier or any third party.</p>
        <p><strong>3.6 Disclaimer of Warranties and Independent Reliance</strong><br/>
        Except for any express warranty expressly provided in writing by the manufacturer and assigned to the Hire Purchaser, the Owner makes no representation, warranty or undertaking, whether express or implied, regarding the merchantability, performance, fitness for any particular purpose, productivity, profitability, suitability, durability or uninterrupted operation of the Machinery and Equipment.</p>
        <p>The Hire Purchaser acknowledges that it has independently inspected, evaluated and selected the Machinery and Equipment based upon its own judgment, expertise and requirements and has not relied upon any representation, statement or assurance made by the Owner except as expressly recorded in this Agreement.</p>
        <p>No failure, breakdown, interruption, defect, reduced efficiency or inability to use the Machinery and Equipment shall relieve the Hire Purchaser from its obligation to pay the Hire Charges or perform its obligations under this Agreement.</p>
        <div class="section-title">4. HIRE CHARGES, INSTALMENTS AND PAYMENT OBLIGATIONS</div>
        <p><strong>4.1 The total Hire Purchase Price (inclusive of GST) shall be ${formatINR(invoiceValue)} comprising the following:</strong></p>
        
        <table class="financial-table">
          <thead>
            <tr>
              <th>Particulars</th>
              <th style="text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Machinery and Equipment Value (excluding GST)</td>
              <td style="text-align: right; font-weight: 600;">${formatINR(salePrice)}</td>
            </tr>
            <tr>
              <td>Add: GST @ 18%</td>
              <td style="text-align: right; font-weight: 600;">${formatINR(gst)}</td>
            </tr>
            <tr>
              <td>Add TCS</td>
              <td style="text-align: right; font-weight: 600;">${formatINR(tcs)}</td>
            </tr>
            <tr class="total-row">
              <td>Gross Total Value</td>
              <td style="text-align: right; color: #0f172a; font-size: 14px;">${formatINR(invoiceValue)}</td>
            </tr>
            <tr>
              <td>Less: Initial Deposit</td>
              <td style="text-align: right; font-weight: 600;">${formatINR(downPayment || 0)}</td>
            </tr>
            <tr class="total-row" style="background-color: #cbd5e1;">
              <td>Balance Repayable Amount in Instalment</td>
              <td style="text-align: right; color: #f0883e; font-size: 15px;">${formatINR(financedAmount)}</td>
            </tr>
          </tbody>
        </table>

        <p>The Hire Purchase price net payable shall be repaid by the Hire Purchaser in ${tenure} equal monthly instalments, as detailed in Schedule 1.</p>
        <p>The Hire Purchase Price payable by the Hire Purchaser for the possession, use and conditional option to acquire ownership of the Machinery and Equipment shall be the amount specified in Schedule 1 and shall comprise the Initial Deposit, Hire Charges/Instalments, interest, taxes and all other amounts payable under this Agreement.</p>
      </div>
    `,

    // Page 8
    `
      <div class="text-justify">
        <p><strong>4.2 Debt Creation</strong><br/>
        Upon delivery of possession of the Machinery and Equipment, the Hire Purchaser shall become unconditionally and irrevocably liable to pay all Hire Charges/Instalments and other amounts payable under this Agreement.</p>
        <p>Such obligations shall constitute present, continuing and independent debts recoverable by the Owner notwithstanding:<br/>
        (a) termination of this Agreement;<br/>
        (b) repossession of the Machinery and Equipment;<br/>
        (c) commencement of arbitration proceedings;<br/>
        (d) any dispute relating to performance, condition or use of the Machinery and Equipment; or<br/>
        (e) the occurrence of any Insolvency Event.</p>
        <p>Upon occurrence of an Event of Default, the Owner may declare all future instalments immediately due and payable.</p>
        <p><strong>4.3 Mode of Payment</strong><br/>
        All payments shall be made by the Hire Purchaser to the Owner through such mode as may be specified by the Owner, including post-dated cheques, electronic transfer, NACH mandate or any other approved banking channel.</p>
        <p>Time shall be of the essence in relation to all payment obligations of the Hire Purchaser under this Agreement.</p>
        <p><strong>4.4 Interest on Delayed Payments</strong><br/>
        In the event of failure to pay any amount on its due date, the Hire Purchaser shall be liable to pay:<br/>
        • Interest at the rate of ${overduePenalty}% per annum, calculated from the due date till the date of actual payment; and<br/>
        • reasonable administrative and recovery charges actually incurred in connection therewith, subject to a maximum amount of ₹5,000 per instance (or as specified in Schedule 1).</p>
        <p><strong>4.5 Appropriation of Payments</strong><br/>
        The Owner shall have the right to appropriate any payments received from the Hire Purchaser towards such dues and in such order of priority as the Owner may deem fit, including towards:<br/>
        • interest<br/>
        • Hire Charges / Instalments, etc.</p>
        <p><strong>4.6 No Suspension of Payment</strong><br/>
        The obligations of the Hire Purchaser to make payment of all Hire Charges and other amounts under this Agreement shall be absolute, unconditional, independent and shall not be entitled to withhold, suspend or defer payment of Hire Charges / Instalments for any reason whatsoever, shall not be subject to any deduction, withholding, abatement, set-off, counterclaim, including non-use, breakdown, or loss of the Machinery and Equipment, work order cancellation etc. or defence arising out of any dispute whatsoever.</p>
        <p><strong>4.7 Post-Dated Cheques and NACH Mandates</strong><br/>
        The Hire Purchaser shall furnish such post-dated cheques, NACH mandates, standing instructions or other payment instruments as may be required by the Owner.</p>
      </div>
    `,

    // Page 9
    `
      <div class="text-justify">
        <p>The Parties expressly acknowledge that each post-dated cheque represents payment of a specific Hire Charge/Instalment becoming legally due and enforceable on its respective due date and may be presented by the Owner upon such date.</p>
        <p>Dishonour of any cheque or failure of any electronic payment mandate shall constitute an Event of Default and shall entitle the Owner to pursue all remedies available under this Agreement and applicable law, including proceedings under the Negotiable Instruments Act, 1881.</p>
        <p>The Owner's right to institute proceedings under the Negotiable Instruments Act, 1881 shall be in addition to, and not in substitution of, any civil, contractual, arbitral or other remedies available under law.</p>
        <p><strong>4.8.1 Primary Mode of Payment</strong><br/>
        The Parties agree that payments of Instalments shall preferably be made through NACH / Electronic Clearing System (ECS) / bank transfer or any other electronic mode.</p>
        <p><strong>4.8.2 Right to Encash PDC in Case of Non-Payment</strong><br/>
        In the event the Hire Purchaser fails to make payment of any Instalment through NACH, ECS, or any electronic transfer on the due date, the Owner shall have the unconditional right to present and encash the corresponding PDC for recovery of such Instalment.</p>
        <p><strong>4.8.3 Dishonour and Default</strong><br/>
        Dishonour of any PDC for any reason whatsoever, or failure to maintain sufficient funds for electronic debit, shall constitute an Event of Default under this Agreement, without prejudice to the Owner’s rights to:<br/>
        • recover outstanding amounts;<br/>
        • levy interest and damages;<br/>
        • repossess the Machinery and Equipment; and<br/>
        • initiate proceedings under the Negotiable Instruments Act, 1881 and any other applicable law.</p>
        <p><strong>4.9 Acknowledgment of Debt</strong><br/>
        The Hire Purchaser acknowledges that all amounts payable under this Agreement constitute lawful and enforceable debts due to the Owner.</p>
        <p>The Hire Purchaser shall execute balance confirmations, acknowledgements of liability, revival letters, statements of account confirmations and other acknowledgments as may reasonably be requested by the Owner from time to time for the purposes of the Limitation Act, 1963.</p>
        <div class="section-title">5. INITIAL DEPOSIT</div>
        <p><strong>5.1 Payment of Initial Deposit</strong><br/>
        The Hire Purchaser shall, upon execution of this Agreement or as otherwise specified in Schedule 1, deposit with the Owner the Initial Deposit in the amount and manner set out in Schedule 1, as security for the due and punctual performance of all its obligations under this Agreement.</p>
        <p><strong>5.2 Nature of Initial Deposit</strong><br/>
        The Initial Deposit shall be non-interest bearing and shall constitute a continuing security for all monies and obligations payable by the Hire Purchaser to the Owner under this Agreement.</p>
        <p><strong>5.3 Right of Appropriation</strong><br/>
        The Owner shall, without prejudice to its other rights and remedies, have the right at any time to appropriate, adjust or set-off the whole or any part of the Initial Deposit against any amounts due and payable by the Hire Purchaser under this Agreement.</p>
      </div>
    `,

    // Page 10
    `
      <div class="text-justify">
        <div class="section-title">6. DELIVERY AND POSSESSION</div>
        <p><strong>6.1 Delivery of Machinery and Equipment</strong><br/>
        The Machinery and Equipment shall be delivered or caused to be delivered by the Owner or its authorised supplier to the Hire Purchaser at the location mutually agreed between the Parties or as specified in Schedule 1.</p>
        <p>Upon such delivery, the Hire Purchaser shall hold and possess the Machinery and Equipment solely as Bailee of the Owner and shall hold, use and maintain the same in accordance with the terms and conditions of this Agreement. Further, shall not acquire any legal, equitable, beneficial or proprietary interest therein by virtue of possession or use.</p>
        <p>Delivery shall be deemed complete upon physical handover of the Machinery and Equipment to the Hire Purchaser, its authorised representative, transporter, site manager, project engineer or any person acting on its behalf, and such delivery shall constitute conclusive evidence of possession having been transferred to the Hire Purchaser.</p>
        <p>All expenses and risks relating to transportation, unloading, handling, installation and commissioning after delivery shall be borne exclusively by the Hire Purchaser.</p>
        <p><strong>6.2 Commencement of Payment Obligations</strong><br/>
        The Hire Purchaser's obligation to pay Hire Charges / Instalments shall commence from the Payment Commencement Date as specified in Schedule 1 or as per clause 3.1. The Hire Purchaser shall remain liable to pay all Hire Charges / Instalments and other amounts payable under this Agreement irrespective of the actual utilization of the Machinery and Equipment.</p>
        <div class="section-title">7. OWNERSHIP</div>
        <p>Notwithstanding delivery of possession, payment of any instalment, issuance of any invoice, registration, insurance, licensing, taxation or use of the Machinery and Equipment by the Hire Purchaser, the legal, equitable and beneficial ownership, title and interest therein shall at all times remain vested exclusively in the Owner until the conditions specified in Clause 7.5 and 18.1 have been fully satisfied.</p>
        <p><strong>7.1 Retention of Title</strong><br/>
        The Machinery and Equipment shall at all times remain the sole and exclusive property of the Owner, and no right, title or interest therein shall pass to the Hire Purchaser by virtue of this Agreement or otherwise or permit the Machinery and Equipment to be treated, represented or held out as an asset owned by the Hire Purchaser.</p>
        <p><strong>7.2 Bailment</strong><br/>
        The Hire Purchaser acknowledges that it holds the Machinery and Equipment in the capacity of a bailee of the Owner and shall have no proprietary or ownership rights in the Machinery and Equipment.</p>
        <p><strong>7.3 Restrictions on Hire Purchaser</strong><br/>
        The Hire Purchaser shall not, without prior written consent of the Owner:<br/>
        a) claim or represent itself as the owner of the Machinery and Equipment;<br/>
        b) remove, alter, deface, obscure, cover, tamper with or permit the removal of any identification mark, logo, sticker, label or marking affixed by the Owner.</p>
      </div>
    `,

    // Page 11
    `
      <div class="text-justify">
        <p><strong>7.4 Protection of Ownership Rights</strong><br/>
        The Hire Purchaser shall promptly notify the Owner of:<br/>
        (a) any attachment, seizure, confiscation, distress or execution proceedings;<br/>
        (b) any claim asserted by a governmental authority, creditor, insolvency professional or third party;<br/>
        (c) any attempt to create or enforce an encumbrance over the Machinery and Equipment.</p>
        <p>The Hire Purchaser shall fully cooperate with the Owner in protecting, preserving and enforcing the Owner's ownership rights and shall not admit, acknowledge or represent that the Machinery and Equipment belong to the Hire Purchaser.</p>
        <p>The Hire Purchaser shall, whenever reasonably required by the Owner, procure acknowledgements from principal employers, project owners, mine operators, contractors, warehouse operators or any person having custody or control over the Premises recognising the exclusive ownership rights of the Owner in the Machinery and Equipment and the Owner's right to inspect, access and repossess the same.</p>
        <p><strong>7.5 No Dues Certificate and Event of Ownership Transfer</strong><br/>
        Upon payment of all Hire Charges, interest, taxes, and all other amounts due under this Agreement, and upon transfer of ownership of the Equipment to the Hire Purchaser, the Owner shall issue a <strong>No Dues Certificate</strong> in favour of the Hire Purchaser.</p>
        <p style="margin-top: 10px;">It is expressly agreed that the issuance of the No Dues Certificate shall be the conclusive and final evidence of transfer of ownership under this Agreement. The Tax Invoice issued by the Owner in accordance with applicable GST laws shall be treated solely as compliance with statutory tax requirements and shall not, by itself, constitute proof of transfer of ownership or confer any ownership rights upon the Hire Purchaser.</p>
        <p>The parties acknowledge and agree that the transfer of ownership shall be deemed complete only upon fulfillment of all obligations under this Agreement and issuance of the No Dues Certificate by the Owner. This wording makes it clear that the No Dues Certificate is the contractual proof of ownership transfer, while the GST tax invoice is issued only for statutory compliance purposes.</p>
        <div class="section-title">8. HIRE PURCHASER’S OBLIGATIONS</div>
        <p>The Hire Purchaser hereby agrees and undertakes that, during the subsistence of this Agreement, it shall:</p>
        <p><strong>8.1 Costs and Expenses</strong><br/>
        The Hire Purchaser shall bear, incur and promptly pay all costs, charges and expenses relating to the possession, operation, use, maintenance, repair, servicing, storage, transportation, mobilisation, demobilisation, handling, fuel, consumables, spare parts, operators, statutory inspections and upkeep of the Machinery and Equipment.</p>
        <p><strong>8.2 Compliance with Laws</strong><br/>
        The Hire Purchaser shall, at its own cost and responsibility, obtain, renew and maintain all licenses, permits, registrations, approvals, consents and authorizations required for the possession, transportation, operation and use of the Machinery and Equipment and shall comply with all applicable laws, including environmental, labour, mining, safety and transport laws. The Hire Purchaser shall indemnify and keep indemnified the Owner against any loss, liability, penalty, demand, claim or expense arising out of any breach of this Clause.</p>
      </div>
    `,

    // Page 12
    `
      <div class="text-justify">
        <p><strong>8.3 Notification Obligations</strong><br/>
        The Hire Purchaser shall notify the Owner in writing, and in any event within forty-eight (48) hours of becoming aware thereof, of:<br/>
        (a) any loss, theft, damage, destruction, accident, breakdown or material impairment affecting the Machinery and Equipment;<br/>
        (b) any attachment, seizure, confiscation, distress, execution, insolvency proceeding, governmental action or legal process relating to the Machinery and Equipment;<br/>
        (c) any claim, dispute or circumstance that may adversely affect the ownership, possession or proprietary rights of the Owner in the Machinery and Equipment.</p>
        <p><strong>8.4 Telematics & Monitoring</strong><br/>
        The Hire Purchaser shall provide the Owner with continuous and reasonable access, subject to technical availability and circumstances beyond the reasonable control of the Hire Purchaser, to telematics systems, GPS tracking information, operating data, diagnostic information and machine health records relating to the Machinery and Equipment.</p>
        <p>The Owner shall be entitled to monitor the location, operation and condition of the Machinery and Equipment and, upon the occurrence of an Event of Default, may implement geo-fencing, tracking, immobilization or other operational restrictions for the protection and recovery of its asset.</p>
        <p>The Hire Purchaser acknowledges that telematics, operational, diagnostic and location data generated by or relating to the Machinery and Equipment may be accessed, retained and utilized by the Owner for asset protection, monitoring, risk management, enforcement and recovery purposes in accordance with applicable law.</p>
        <p>Provided, however, that any geo-fencing, tracking, immobilization or operational restriction implemented by the Owner shall be exercised in a manner that does not endanger human life, public safety, environmental protection requirements or compliance with any statutory or regulatory obligation applicable to the operation of the Machinery and Equipment.</p>
        <p><strong>8.5 PERMITTED USE OF MACHINERY AND EQUIPMENT</strong><br/>
        The Hire Purchaser shall use and operate the Machinery and Equipment solely for its lawful business purposes and only at the Premises specified in this Agreement or at such other location as may be expressly approved in writing by the Owner.</p>
        <p>The Hire Purchaser shall not use, permit or suffer the Machinery and Equipment to be used for any unlawful, unauthorized, hazardous or improper purpose or in any manner inconsistent with the manufacturer's specifications, operational manuals, recommendations or rated operational capacities.</p>
        <p>The Hire Purchaser shall ensure that the Machinery and Equipment are operated only by adequately trained, skilled, competent, duly authorised and, where required by law, licensed personnel.</p>
        <p>The Hire Purchaser shall not permit any third party to use, possess or operate the Machinery and Equipment without the prior written consent of the Owner.</p>
      </div>
    `,

    // Page 13
    `
      <div class="text-justify">
        <p>Any breach of this Clause shall constitute an Event of Default and shall entitle the Owner to exercise all rights and remedies available under this Agreement and applicable law, including repossession of the Machinery and Equipment.</p>
        <p><strong>8.6 MAINTENANCE AND REPAIRS</strong><br/>
        The Hire Purchaser shall, at its sole cost and expense, keep the Machinery and Equipment in good operating condition, working order and repair, fair wear and tear excepted, and shall maintain the same in accordance with the manufacturer's recommendations and applicable industry standards.</p>
        <p>In the event that the Machinery and Equipment or any part thereof requires major repairs, overhauling, replacement of critical components or any repair of a substantial nature, such repairs shall be carried out only by the Owner, its authorised service centres, authorised dealers or such other service providers as may be approved by the Owner.</p>
        <p>The Hire Purchaser shall bear and promptly pay all costs, charges and expenses incurred in connection with the inspection, diagnostics, maintenance, servicing, transportation, repair, replacement of parts and restoration of the Machinery and Equipment, unless otherwise expressly agreed in writing by the Owner.</p>
        <p>The Hire Purchaser shall not undertake, nor permit any third party to undertake, any major repair, modification, alteration or replacement of major components of the Machinery and Equipment without the prior written consent of the Owner.</p>
        <p>The Hire Purchaser shall notify the Owner in writing within forty-eight (48) hours of becoming aware of any breakdown, accident, defect, damage or malfunction affecting the Machinery and Equipment and shall take all reasonable steps to prevent further damage.</p>
        <p>Any replacement parts, accessories, attachments or components installed in the Machinery and Equipment shall immediately and automatically vest in and become the exclusive property of the Owner and shall be deemed to form part of the Machinery and Equipment. Failure by the Hire Purchaser to comply with this Clause shall constitute an Event of Default under this Agreement.</p>
        <p><strong>8.7 Owner's Right of Inspection</strong><br/>
        The Owner or its authorised representatives shall have the right, upon prior notice, to inspect the Machinery and Equipment, maintenance records and operating condition thereof during normal business hours.</p>
        <p><strong>8.8 Information and Financial Disclosure</strong><br/>
        The Hire Purchaser shall, upon written request by the Owner, furnish copies of its GST returns, audited or management financial statements, bank statements, project status reports and particulars of its existing indebtedness within fifteen (15) days of such request.</p>
        <div class="section-title">9. INSURANCE</div>
        <p><strong>9.1 Comprehensive Insurance:</strong> The Hire Purchaser shall, at its sole cost and expense, keep the Machinery and Equipment comprehensively insured at all times for an amount not less than its replacement value, with a reputed company acceptable to the Owner.</p>
      </div>
    `,

    // Page 14
    `
      <div class="text-justify">
        <p><strong>9.2 Loss Payee:</strong> The insurance policy shall be taken out and maintained in the name of the Owner as owner of the Machinery and Equipment, with the Owner's interest duly endorsed as first loss payee and primary beneficiary.</p>
        <p><strong>9.3 Coverage:</strong> The insurance coverage shall include protection against loss or damage arising from fire, theft, burglary, riot, strike, malicious damage, accident, flood, earthquake, transit, and machinery breakdown.</p>
        <p><strong>9.4 Premium Receipts:</strong> The Hire Purchaser shall pay all insurance premiums and renew the policy before expiry but not later than seven (7) days from the date of the Owner's request. Copy of the policy must be furnished to the Owner.</p>
        <p><strong>9.5 Policy Invalidity:</strong> The Hire Purchaser shall not do or omit to do anything which may invalidate, prejudice or adversely affect the insurance coverage.</p>
        <p><strong>9.6 Payment by Owner:</strong> If the Hire Purchaser fails to obtain, maintain or renew the insurance policy, the Owner may, but shall not be obliged to, procure or renew such insurance coverage and/or pay the premium, which shall carry default interest until actual reimbursement.</p>
        <p><strong>9.7 Notification:</strong> The Hire Purchaser shall notify the Owner and the insurer in writing within forty-eight (48) hours of becoming aware of any loss, theft, damage, accident or occurrence.</p>
        <p><strong>9.8 Application of Proceeds:</strong> Any insurance proceeds received shall be applied in such manner as the Owner, acting reasonably and in its sole discretion, may determine, including towards repair, restoration, replacement or debt adjustment.</p>
        <p><strong>9.9 Default:</strong> Failure by the Hire Purchaser to comply with its obligations under this Clause shall constitute an Event of Default.</p>
        <div class="section-title">10. TAXES AND STATUTORY COMPLIANCE</div>
        <p><strong>10.1 Taxes and Duties:</strong> The Hire Purchase Price and the Instalments specified in Schedule 1 are inclusive of Goods and Services Tax (GST) and the GST rates have been computed on the basis of the GST rate prevailing on the date of execution of this Agreement.</p>
        <p>In the event of any change in the applicable GST rate, introduction of any new tax, levy, cess or duty, the Hire Purchaser shall be liable to pay such additional amount as may be required by the Owner.</p>
        <p>The Hire Purchaser shall be solely responsible for payment of all other taxes, duties, levies, cess, registration charges, road taxes, entry taxes, municipal taxes, permit fees, license fees and other statutory charges.</p>
      </div>
    `,

    // Page 15
    `
      <div class="text-justify">
        <p><strong>10.2 Statutory Compliance</strong><br/>
        The Hire Purchaser shall, at its sole cost and responsibility, obtain, maintain, renew and comply with all licenses, permits, registrations, approvals and authorisations required under applicable law for the possession, transportation, deployment, operation and use of the Machinery and Equipment.</p>
        <p>The Hire Purchaser shall ensure continuous compliance with all conditions attached to such licenses, permits, registrations and approvals and shall furnish copies thereof to the Owner upon request.</p>
        <p>The Hire Purchaser shall indemnify and keep indemnified the Owner against any liability, penalty, demand, claim or expense arising from non-compliance with this Clause.</p>
        <p><strong>10.3 Withholding and Deductions</strong><br/>
        All payments to be made by the Hire Purchaser under this Agreement shall be made without any deduction or withholding except as required by applicable law, in which case the Hire Purchaser shall:<br/>
        (a) promptly deposit such deducted amount with the appropriate authority; and<br/>
        (b) furnish valid proof of such deposit to the Owner within seven (7) days of such deposit.</p>
        <p><strong>10.4 Tax Indemnity for Non-Compliance</strong><br/>
        The Hire Purchaser shall indemnify and keep indemnified the Owner against any loss, demand, assessment, interest, penalty, surcharge, cost or expense suffered or incurred by the Owner arising from:<br/>
        (a) failure of the Hire Purchaser to comply with applicable tax laws;<br/>
        (b) non-payment or delayed payment of taxes, duties or statutory charges;<br/>
        (c) denial of any input tax credit, deduction or exemption attributable to any act, omission or default of the Hire Purchaser; or<br/>
        (d) any misrepresentation made by the Hire Purchaser regarding its tax status.</p>
        <p><strong>10.5 Event of Default</strong><br/>
        Failure by the Hire Purchaser to pay any taxes, duties, fees or statutory charges, or to obtain, maintain or renew any permit, license, registration or approval required for the lawful operation and use of the Machinery and Equipment, shall constitute an Event of Default under this Agreement.</p>
        <div class="section-title">11. DEPLOYMENT AND LOCATION OF MACHINERY AND EQUIPMENT</div>
        <p><strong>11.1 Approved Site:</strong> The Hire Purchaser shall keep, operate, use and deploy the Machinery and Equipment solely at the Premises: <strong>${customerAddress}, ${customerCity}, ${customerState}</strong> and shall not remove, relocate, transfer or permit the Machinery and Equipment to be used at any other location without the prior written consent of the Owner.</p>
      </div>
    `,

    // Page 16
    `
      <div class="text-justify">
        <p><strong>11.2 Relocation:</strong> The Hire Purchaser may request the Owner's prior written approval to relocate the Machinery and Equipment to another project site owned, operated or controlled by the Hire Purchaser within India. Upon such approval, the details of the new site shall be recorded by way of a written addendum, email confirmation, site acknowledgment or such other written record acceptable to the Owner.</p>
        <p><strong>11.3 GPS tracking:</strong> The Hire Purchaser shall, upon request of the Owner and in any event within twenty-four (24) hours of any relocation approved under this Agreement, provide accurate particulars of the location of the Machinery and Equipment including GPS coordinates where reasonably available. The Hire Purchaser shall ensure that the Machinery and Equipment remain identifiable, traceable and readily accessible for inspection, verification, maintenance, repossession and enforcement of the Owner's rights under this Agreement.</p>
        <p><strong>11.4 Relocation Violations:</strong> Any relocation or movement of the Machinery and Equipment in violation of this Clause shall constitute an Event of Default under this Agreement.</p>
        <p><strong>11.5 Protection from Claims by Main Contractor, Principal Employer or Site Owner</strong><br/>
        Where the Hire Purchaser is acting as a contractor, sub-contractor, service provider, operator or project participant at any site owned, controlled or managed by any principal employer, project owner, mine owner, developer, main contractor or any third party, the Hire Purchaser shall ensure that such person or entity acknowledges the ownership rights of the Owner in the Machinery and Equipment.</p>
        <p>The Hire Purchaser shall ensure that no principal employer, project owner, mine owner, main contractor, site owner or other third party asserts or is permitted to assert any right to detain, seize, withhold, attach, lien, retain possession of, or otherwise interfere with the Machinery and Equipment for any dues, claims, disputes, recoveries, damages, penalties, retention monies or obligations of the Hire Purchaser towards principal employer, project owner, mine owner, main contractor, sub-contractor, site owner or any third party.</p>
        <p>In the event any such person or entity attempts to detain, retain or prevent removal of the Machinery and Equipment, the same shall constitute an Event of Default under this Agreement, and the Hire Purchaser shall immediately secure the release of the Machinery and Equipment and shall indemnify and keep indemnified the Owner against all losses, damages, costs, expenses and legal proceedings arising therefrom including all legal fees on a full indemnity basis.</p>
        <p>The Owner shall have the unrestricted right to enter the project site and remove or repossess the Machinery and Equipment upon termination of this Agreement or occurrence of an Event of Default.</p>
        <div class="section-title">12. INDEMNITY</div>
        <p><strong>12.1 Indemnity Obligation</strong><br/>
        The Hire Purchaser shall indemnify, defend and keep indemnified and harmless the Owner, its directors, officers, employees, agents and representatives from and against any and all losses, damages, claims, demands, actions, proceedings, liabilities, costs and expenses (including reasonable legal fees and expenses) arising out of or in connection with the matters specified in Clause 12.2.</p>
      </div>
    `,

    // Page 17
    `
      <div class="text-justify">
        <p><strong>12.2 Scope of Indemnity</strong><br/>
        The indemnity covers:<br/>
        a) the use, operation, possession, storage or transportation of the Machinery and Equipment by the Hire Purchaser;<br/>
        b) any loss of or damage to the Machinery and Equipment;<br/>
        c) any third-party claims, including claims for injury, death or property damage;<br/>
        d) any breach by the Hire Purchaser of the terms and conditions of this Agreement;<br/>
        e) any failure by the Hire Purchaser to comply with applicable laws, regulations, permits or statutory requirements;<br/>
        f) any attachment, detention, seizure or obstruction relating to the Machinery and Equipment caused by the acts or omissions of the Hire Purchaser; and<br/>
        g) any environmental liability, contamination, pollution or statutory violation arising from the operation or deployment of the Machinery and Equipment.</p>
        <p><strong>12.3 Continuity of Indemnity</strong><br/>
        The indemnity obligations of the Hire Purchaser under this Clause shall survive the termination or expiry of this Agreement for any reason whatsoever.</p>
        <div class="section-title">13. INSPECTION</div>
        <p><strong>13.1 Right to Inspect:</strong> The Owner and/or its authorised representatives shall have the right, at all reasonable times and upon reasonable notice, to inspect the Machinery and Equipment and verify its condition, location, usage and maintenance.</p>
        <p><strong>13.2 Access to Premises:</strong> For the purposes of inspection, the Hire Purchaser shall grant or procure access to the Owner to the premises where the Machinery and Equipment is located and shall provide all necessary assistance.</p>
        <p><strong>13.3 Verification of Records:</strong> The Owner shall also have the right to inspect and verify all records, documents and information relating to the use, operation and maintenance of the Machinery and Equipment including telematics data, maintenance logs, insurance records and statutory permits.</p>
        <p><strong>13.4 Non-Interference:</strong> The Hire Purchaser shall not obstruct, delay, hinder or otherwise interfere with the exercise of the Owner's rights under this Clause.</p>
        <div class="section-title">14. PROTECTION OF OWNER'S TITLE AND RESTRICTIONS ON ENCUMBRANCES</div>
        <p><strong>14.1 No Encumbrance or Third-Party Interest:</strong> The Hire Purchaser shall not, without the prior written consent of the Owner, create, permit or suffer to exist any mortgage, charge, hypothecation, pledge, lien, encumbrance, security interest or any other right, title or interest of any third party in or over the Machinery and Equipment.</p>
        <p><strong>14.2 No Transfer, Assignment or Sub-Hire:</strong> The Hire Purchaser shall not sell, assign, transfer, lease, sub-hire, part with possession of or otherwise dispose of the Machinery and Equipment or any part thereof without the prior written consent of the Owner.</p>
      </div>
    `,

    // Page 18
    `
      <div class="text-justify">
        <p><strong>14.3 No Financing Against Machinery and Equipment</strong><br/>
        The Hire Purchaser shall not use or offer the Machinery and Equipment as collateral security for obtaining any loan, credit facility, financial accommodation or any other financing arrangement from any bank, financial institution or third party whether directly or indirectly.</p>
        <p><strong>14.4 Protection of Owner's Rights</strong><br/>
        The Hire Purchaser shall take all necessary steps to protect and preserve the Owner's rights, title and interest in the Machinery and Equipment and shall notify in writing to the Owner within forty-eight (48) hours of becoming aware of:<br/>
        (a) any attachment, seizure, distress, execution, injunction or legal proceedings affecting the Machinery and Equipment;<br/>
        (b) any claim, demand or assertion of rights by any third party in respect of the Machinery and Equipment; or<br/>
        (c) any event that may adversely affect the Owner's rights in the Machinery and Equipment.</p>
        <p><strong>14.5 Declaration to Third Parties</strong><br/>
        The Hire Purchaser shall, whenever required by the Owner, confirm and declare to any governmental authority, lender, creditor or third party that the Machinery and Equipment are subject to this Agreement and that the Hire Purchaser has no right to create any security interest or third party rights therein.</p>
        <p><strong>14.6 Assistance in Protection and Recovery</strong><br/>
        The Hire Purchaser shall provide all reasonable assistance, information, access and cooperation required by the Owner for the protection, preservation, recovery or repossession of the Machinery and Equipment and enforcement of the Owner's rights under this Agreement including execution of such documents and acknowledgements as may reasonably be required by the Owner.</p>
        <p><strong>14.7 Consequence of Breach</strong><br/>
        Any breach of this Clause shall constitute an Event of Default and shall entitle the Owner, without prejudice to any other rights and remedies available under this Agreement or applicable law, to terminate this Agreement, repossess the Machinery and Equipment and recover all outstanding amounts due under this Agreement.</p>
        <div class="section-title">15. EVENT OF DEFAULT</div>
        <p>Each of the following events shall constitute an “Event of Default” under this Agreement:</p>
        <p><strong>15.1 Payment Default:</strong> Failure by the Hire Purchaser to pay any Hire Charges/Instalment, interest, tax, premium reimbursement, indemnified amount or any other sum payable under this Agreement on the due date and such failure continues for seven (7) days thereafter.</p>
        <p><strong>15.2 Breach of Terms:</strong> Failure by the Hire Purchaser to observe, perform or comply with any material term, condition, covenant or obligation contained in this Agreement, which failure, if capable of remedy, remains unremedied for a period of seven (7) days after written notice from the Owner.</p>
      </div>
    `,

    // Page 19
    `
      <div class="text-justify">
        <p><strong>15.3 Insolvency, Bankruptcy and Financial Distress</strong><br/>
        If the Hire Purchaser or any Guarantor:<br/>
        (i) is subjected to any winding-up, liquidation, dissolution, administration, receivership, restructuring, Corporate Insolvency Resolution Process (CIRP) or similar proceedings under any applicable law;<br/>
        (ii) has a Resolution Professional, Liquidator, Receiver, Administrator or similar officer appointed in respect of it or any substantial part of its assets;<br/>
        (iii) files, initiates, admits or becomes subject to any application, petition or proceeding upon admission under the Insolvency and Bankruptcy Code, 2016, or any amendment, replacement or re-enactment thereof, before the National Company Law Tribunal (NCLT), any Adjudicating Authority or any other competent authority;<br/>
        (iv) enters into or proposes any compromise, arrangement, restructuring or settlement with its creditors generally; or<br/>
        (v) takes any corporate action or passes any resolution for its winding-up, liquidation, dissolution or insolvency, then the same shall constitute an Event of Default under this Agreement and, without prejudice to any other rights and remedies available to the Owner under this Agreement or applicable law, the Owner shall be entitled to terminate this Agreement, declare all outstanding Hire Purchase Instalments and other amounts immediately due and payable, invoke any guarantee or security and repossess the Machinery and Equipment, ownership of which shall continue to vest exclusively in the Owner until full payment of the Hire Purchase Price and all other amounts payable under this Agreement.</p>
        <p>Nothing contained herein shall prejudice the Owner's right to assert and recover its ownership interest in the Machinery and Equipment in accordance with applicable insolvency laws.</p>
        <p><strong>15.4 Unauthorized Transfer or Encumbrance</strong><br/>
        If the Hire Purchaser sells, assigns, transfers, sub-hires, leases, parts with possession of, or creates or permits any mortgage, charge, pledge, lien, hypothecation or other encumbrance over the Machinery and Equipment without the prior written consent of the Owner.</p>
        <p><strong>15.5 Misrepresentation</strong><br/>
        If any representation, warranty or statement made by the Hire Purchaser in connection with this Agreement is found to be false, misleading or incorrect in any material respect.</p>
        <p><strong>15.6 Risk to Machinery and Equipment:</strong> If the Machinery and Equipment is attached, seized or detained by any authority; or subject to any legal proceedings or third-party claim, which, in the reasonable opinion of the Owner acting in good faith, may materially prejudice or adversely affect the Owner's ownership, possession or recovery rights.</p>
        <p><strong>15.7 Unauthorized Relocation or Misuse:</strong> If the Hire Purchaser relocates, misuses or uses the Machinery and Equipment in violation of the terms of this Agreement without the prior written approval of the Owner where such approval is required under this Agreement.</p>
        <p><strong>15.8 Material Adverse Change:</strong> The occurrence of any event or circumstance which, in the reasonable opinion of the Owner acting in good faith, materially and adversely affects the business operations, financial condition, assets, repayment capacity or ability of the Hire Purchaser to perform its obligations under this Agreement.</p>
        <p><strong>15.9 Abandonment of Machinery:</strong> If the Machinery and Equipment are abandoned, left unattended for an unreasonable period, or cease to be used in the ordinary course of the Hire Purchaser's business in circumstances which, in the reasonable opinion of the Owner, materially jeopardise the value, safety or recoverability of the Machinery and Equipment.</p>
        <div class="section-title">16. CONSEQUENCES OF DEFAULT</div>
        <p>Upon the occurrence of any Event of Default, the Owner shall, without prejudice to any other rights or remedies available under this Agreement or applicable law, be entitled to exercise any or all of the following rights:</p>
        <p><strong>16.1 Termination</strong><br/>
        Upon the occurrence of an Event of Default, the Owner may terminate this Agreement by written notice to the Hire Purchaser.</p>
        <p>Provided that, in the case of an Event of Default arising solely under Clause 15.1 (Payment Default), the Hire Purchaser shall be entitled to a cure period of seven (7) days from the date of receipt of the notice of default to make payment of the overdue amount. If such default continues beyond the said period, this Agreement shall automatically stand terminated without the necessity of any further notice, demand or communication from the Owner and the Hire Purchaser right to possess, use or operate the Machinery and Equipment shall immediately cease and the owner shall have absolute, unconditional right to repossess the machine, its equipment’s and spare parts of the machines given in possession of Hire Purchase with right to use only under this Agreement with immediate effect.</p>
        <p>Notwithstanding the foregoing, In respect of all other Events of Default, or where the Default is incapable of remedy, including but not limited to insolvency proceedings, liquidation, unauthorised transfer or encumbrance of the Machinery and Equipment, material misrepresentation, unlawful use, abandonment of the Machinery and Equipment or any act materially prejudicing the Owner's rights, the Owner shall be entitled to terminate this Agreement with immediate effect by written notice without granting any cure period and the owner shall have absolute, unconditional right to repossess the machine, its equipment’s and spare parts of the machines given in possession of Hire Purchase with right to use only under this Agreement with immediate effect.</p>
      </div>
    `,

    // Page 21
    `
      <div class="text-justify">
        <p><strong>16.2 Repossession of Machinery and Equipment</strong><br/>
        Upon the occurrence of an Event of Default, the Owner shall be entitled, by written notice to the Hire Purchaser, to take possession and repossess the Machinery and Equipment.</p>
        <p>The Hire Purchaser shall, upon such notice, immediately and in any event within twenty-four (24) hours of receipt of such notice make the Machinery and Equipment available for repossession at a location specified by the Owner and shall provide full cooperation and assistance in this regard.</p>
        <p>In the event of failure by the Hire Purchaser to comply, the Owner and/or its authorised representatives shall be entitled to enter the premises where the Machinery and Equipment is located, in accordance with applicable law, for the purpose of inspection and repossession, and shall not be liable for any direct loss or damage except to the extent caused by their gross negligence or wilful misconduct. The Hire Purchaser or any third party shall not obstruct or interfere with such repossession.</p>
        <p><strong>16.3 Demobilization Rights</strong><br/>
        Upon the occurrence of an Event of Default, the Owner shall be entitled to remotely disable, immobilise, geo-fence, demobilise or otherwise restrict the operation of the Machinery and Equipment through telematics systems or other technological means for the purposes of asset protection and recovery, provided that such measures are implemented in accordance with applicable law and in a manner that does not endanger human life, public safety, environmental protection requirements or compliance with any statutory or regulatory obligation.</p>
        <p>The Hire Purchaser acknowledges and agrees that any exercise by the Owner of its rights under this Clause, including remote disablement, immobilisation, geo-fencing, demobilisation or operational restriction of the Machinery and Equipment, shall be a lawful contractual remedy for the protection and recovery of the Owner's asset. Accordingly, the Owner shall not be liable to the Hire Purchaser or to any principal employer, contractor, sub-contractor, customer or other third party for any loss of profits, loss of business, loss of contract, delay damages, liquidated damages, penalties, claims, consequential losses, indirect losses or any other financial or commercial loss arising from or connected with the exercise of such rights, save and except to the extent directly caused by the gross negligence, wilful misconduct or unlawful act of the Owner. The Hire Purchaser shall not be entitled to claim, and hereby waives any claim and further indemnifies for, compensation, reimbursement or damages against the Owner in respect thereof.</p>
        <p><strong>16.4 Access and Assistance</strong><br/>
        The Hire Purchaser shall provide full cooperation and assistance to the Owner for repossession of the Machinery and Equipment and shall not obstruct or interfere with such action. The Owner shall be entitled to seek lawful assistance from the local police authorities or any other competent governmental authority for the purposes of peaceful inspection, protection and repossession of the Machinery and Equipment upon the occurrence of an Event of Default.</p>
        <p>The Hire Purchaser hereby expressly agrees and undertakes not to obstruct, resist or interfere with such repossession and acknowledges the right of the Owner to approach such authorities for lawful assistance. All costs, charges and expenses incurred in connection with obtaining such assistance and repossession shall be borne by the Hire Purchaser and shall be recoverable as part of dues under this Agreement.</p>
        <p><strong>16.5 Appropriation of Amounts Paid</strong><br/>
        The Owner shall be entitled to appropriate amounts received from the Hire Purchaser towards depreciation, usage charges, outstanding Hire Purchase Instalments, repair costs, repossession expenses, legal costs, enforcement expenses and actual losses or damages suffered by the Owner arising from the Event of Default. Any balance remaining after such adjustment shall be dealt with in accordance with applicable law.</p>
        <p><strong>16.6 Acceleration of Dues</strong><br/>
        Upon the occurrence of any Event of Default, the Owner shall have the right to declare all amounts payable under this Agreement to be immediately due and payable, including:<br/>
        (a) all overdue Hire Purchase Instalments and all other amounts payable under this Agreement;<br/>
        (b) the Termination Amount as specified in Schedule 1; and<br/>
        (c) legal costs, repossession expenses, enforcement costs and all other reasonable expenses incurred by the Owner.</p>
        <p>Provided however, that the net proceeds, if any, realized by the Owner from repossession, sale or re-hire purchase of the Machinery and Equipment shall be appropriated towards the amounts due, and the Hire Purchaser shall remain liable for any shortfall.</p>
        <p><strong>16.7 Recovery of Amounts</strong><br/>
        The Owner shall be entitled to recover all amounts declared due under Clause 16.6, together with all enforcement-related costs and any shortfall after adjustment of disposal proceeds.</p>
      </div>
    `,

    // Page 23
    `
      <div class="text-justify">
        <p><strong>16.8 Right to Dispose of Machinery and Equipment</strong><br/>
        After repossession, the Owner shall be entitled to sell, re-hire purchase or otherwise dispose of the Machinery and Equipment at its sole discretion.</p>
        <p>The net proceeds realized from such sale, re-hire purchase or disposal shall be appropriated towards the amounts due and payable by the Hire Purchaser under this Agreement. The Hire Purchaser shall remain liable for any shortfall between the amounts due and the net proceeds realized. The Owner shall not be obliged to obtain the highest or best possible price for the Machinery and Equipment, provided that any sale, re-hire purchase or other disposition is conducted in a commercially reasonable manner and in good faith.</p>
        <p>Any surplus arising from such disposal shall be dealt with in accordance with applicable law.</p>
        <p><strong>16.9 Cumulative Rights</strong><br/>
        The rights of the Owner under this Clause are cumulative and may be exercised concurrently or independently.</p>
        <div class="section-title">17. LOSS OR DAMAGE</div>
        <p><strong>17.1 Risk of Loss</strong><br/>
        The entire risk of loss, theft, destruction or damage to the Machinery and Equipment, whether arising from accident, casualty, force majeure events, negligence of third parties or any other cause not attributable to the gross negligence or wilful misconduct of the Owner, shall be borne solely by the Hire Purchaser from the Commencement Date until the Machinery and Equipment are lawfully returned and accepted by the Owner in accordance with this Agreement.</p>
        <p><strong>17.2 No Discharge of Obligations</strong><br/>
        Subject to Clause 17.3, the occurrence of any loss, theft, destruction or damage to the Machinery and Equipment shall not relieve or discharge the Hire Purchaser from its obligations under this Agreement, including its obligation to pay all Hire Purchase Instalments and all other amounts payable hereunder.</p>
        <p><strong>17.3 Immediate Payment of Dues</strong><br/>
        Upon the occurrence of any total loss, constructive total loss, theft, destruction or irreparable damage to the Machinery and Equipment, all amounts accelerated pursuant to Clause 16.6, including the Termination Amount specified in Schedule 1, shall immediately become due and payable by the Hire Purchaser.</p>
        <p>Provided, however, that any insurance proceeds received by the Owner in respect thereof shall be appropriated towards such amounts, and the Hire Purchaser shall remain liable for any deficiency or shortfall.</p>
        <p><strong>17.4 Insurance Proceeds</strong><br/>
        Any insurance proceeds received in respect of the Machinery and Equipment shall be payable to and applied by the Owner in accordance with Clause 9, without prejudice to the Hire Purchaser’s liability for any shortfall.</p>
      </div>
    `,

    // Page 24
    `
      <div class="text-justify">
        <p><strong>17.5 Obligation to Notify</strong><br/>
        The Hire Purchaser shall notify the Owner in writing within twenty-four (24) hours of becoming aware of any loss, theft, destruction or damage affecting the Machinery and Equipment and shall take all reasonable steps to safeguard the Machinery and Equipment, preserve evidence and mitigate further loss or damage.</p>
        <p>The Hire Purchaser shall continue to remain liable for payment of all Hire Purchase Instalments and other amounts payable under this Agreement notwithstanding any such loss, theft, destruction or damage, subject always to adjustment of insurance proceeds in accordance with Clause 17.4.</p>
        <p><strong>17.6 Cooperation in Insurance Claims</strong><br/>
        The Hire Purchaser shall provide full cooperation and assistance to the Owner in relation to the investigation, adjustment, prosecution and settlement of any insurance claim concerning the Machinery and Equipment and shall execute all documents and perform all acts reasonably required by the Owner or the insurer for such purpose.</p>
        <div class="section-title">18. OWNERSHIP AND TRANSFER OF TITLE</div>
        <p><strong>18.1 Retention of Ownership:</strong> The ownership, title and interest in the Machinery and Equipment shall remain vested exclusively in the Owner at all times during the Hire Purchase Period. Property in the Machinery and Equipment shall not pass to the Hire Purchaser merely by delivery, possession, payment of instalments or expiry of the Hire Purchase Period.</p>
        <p>Ownership shall pass to the Hire Purchaser only upon:<br/>
        (a) full payment of all Hire Purchase Instalments and all other amounts payable under this Agreement;<br/>
        (b) issuance of a No Dues Certificate by the Owner; and<br/>
        (c) fulfillment of all conditions specified in Clause 18.2.</p>
        <p><strong>18.2 Conditions for Transfer:</strong> The transfer of ownership shall be subject to:<br/>
        a) full payment of all Hire Instalments and other dues;<br/>
        b) no subsisting Event of Default; and<br/>
        c) compliance with all terms and conditions of this Agreement; and<br/>
        d) issuance of a No Dues Certificate by the Owner evidencing satisfaction of all obligations.</p>
        <p><strong>18.3 Rights Prior to Transfer:</strong> Until such time as ownership is transferred:<br/>
        • the Hire Purchaser shall have only the right to use the Machinery and Equipment;<br/>
        • the Hire Purchaser shall not claim ownership;<br/>
        • the Hire Purchaser shall not create any third-party rights over the Machinery and Equipment.</p>
      </div>
    `,

    // Page 25
    `
      <div class="text-justify">
        <p><strong>18.4 Recovery Assistance and Cooperation with Law Enforcement Authorities</strong><br/>
        The Hire Purchaser expressly agrees and acknowledges that the Machinery and Equipment are the absolute property of the Owner (Liugong India Pvt Ltd) until full payment of all dues and transfer of ownership in accordance with this Agreement.</p>
        <p>In the event the Hire Purchaser sells, transfers, hypothecates, pledges, leases, or creates any third-party interest without written consent of the Owner, or wrongfully retains or refuses to return the Machinery and Equipment upon termination or default, any such act may give rise to civil and/or criminal liability under applicable law, and the Owner shall be entitled to pursue all remedies available to it, including proceedings under the Bharatiya Nyaya Sanhita, 2023, or any other applicable statute, where the facts and circumstances so warrant.</p>
        <p>The Owner shall further be entitled to:<br/>
        • lodge a police complaint / FIR with the jurisdictional police authorities;<br/>
        • seek immediate assistance of police authorities for recovery / repossession of the Machinery and Equipment, wherever permissible under law; and<br/>
        • initiate civil proceedings for recovery of damages, losses, and costs.</p>
        <p>The Hire Purchaser agrees that such remedies are independent and without prejudice to the Owner’s contractual right of repossession and termination under this Agreement.</p>
        <p><strong>18.5 IRREVOCABLE SITE ENTRY, LICENSE AND POWER OF ATTORNEY</strong><br/>
        (a) The Hire Purchaser hereby grants to the Owner, its employees, agents, representatives, recovery agencies and authorised representatives, authority to enter, inspect and access any premises or project site, mine, quarry, construction site, yard, workshop, storage facility or other location where the Machinery and Equipment may be situated, lawfully occupied, controlled or made available to the Hire Purchaser, subject to applicable law and the rights of third-party owners or occupiers, upon occurrence of an Event of Default and expiry of any applicable cure period.</p>
        <p>(b) The Hire Purchaser shall obtain and maintain all necessary No Objection Certificates, permissions and acknowledgements from mine owners, principal employers, concessionaires, contractors, project owners and site owners permitting the Owner and its authorised representatives to access such premises for inspection, demobilisation and repossession of the Machinery and Equipment.</p>
      </div>
    `,

    // Page 26
    `
      <div class="text-justify">
        <p>(c) The Hire Purchaser irrevocably authorises and undertakes to execute all necessary instruments authorising the Owner and its authorised representatives as its lawful attorney solely for the purpose of:<br/>
        (i) entering project sites and premises;<br/>
        (ii) obtaining police or administrative assistance;<br/>
        (iii) executing repossession, transportation and recovery documents;<br/>
        (iv) taking possession of, transporting and transferring the Machinery and Equipment;<br/>
        (v) obtaining duplicate registration certificates, permits, approvals or records relating to the Machinery and Equipment; and<br/>
        (vi) pursuing and recovering insurance proceeds relating to the Machinery and Equipment.</p>
        <p>(d) Upon occurrence of an Event of Default, the Owner shall, subject to applicable law, be entitled to repossess, remove, tow, transport, isolate, disable or otherwise recover the Machinery and Equipment.</p>
        <p>(e) The Hire Purchaser shall not obstruct, interfere with or prevent such repossession and shall bear all towing charges, transportation expenses, security expenses, logistics costs, recovery expenses and legal costs incurred by the Owner.</p>
        <p>(f) The Hire Purchaser agrees that it shall not initiate or maintain any frivolous, vexatious or malicious civil or criminal proceedings against the Owner, its employees, agents or authorised representatives in respect of actions lawfully and bona fide taken under this Agreement and in accordance with applicable law, without prejudice to its rights and remedies available under law.</p>
        <div class="section-title">19. ASSIGNMENT</div>
        <p><strong>19.1 Assignment by Owner</strong><br/>
        The Owner shall be entitled to assign, transfer, securities, create a beneficial interest in, or otherwise deal with its rights, title, interests and receivables under this Agreement, in whole or in part, to any bank, financial institution, affiliate, assignee or other third party, without requiring the prior consent of the Hire Purchaser. The Hire Purchaser shall execute and deliver such acknowledgements, confirmations or other documents as may reasonably be required to give effect to such assignment or transfer. Any novation of this Agreement shall be effected in accordance with applicable law.</p>
        <p><strong>19.2 Restriction on Assignment by Hire Purchaser</strong><br/>
        The Hire Purchaser shall not, without the prior written consent of the Owner:<br/>
        a) assign, transfer or novate its rights or obligations under this Agreement;<br/>
        b) sub-lease, transfer, part with possession of, permit use of, or otherwise deal with the Machinery and Equipment, whether directly or indirectly.</p>
      </div>
    `,

    // Page 27
    `
      <div class="text-justify">
        <p><strong>19.3 Binding Effect</strong><br/>
        This Agreement shall be binding upon and inure to the benefit of the Parties hereto and their respective permitted successors and assigns.</p>
        <p><strong>19.4 – Change in Control</strong><br/>
        The Hire Purchaser shall promptly notify the Owner in writing of any proposed material change in its ownership, shareholding pattern, partnership constitution, management or control which may adversely affect its ability to perform its obligations under this Agreement.</p>
        <p>No such material change in control shall be effected without the prior written consent of the Owner, such consent not to be unreasonably withheld where the change does not materially prejudice the Owner's interests.</p>
        <p>Any violation of this Clause shall constitute an Event of Default.</p>
        <div class="section-title">20. FORCE MAJEURE</div>
        <p><strong>20.1 Force Majeure Events:</strong> Neither Party shall be liable for any failure or delay in performing its obligations under this Agreement (other than payment obligations) to the extent such failure is directly caused by an event beyond its reasonable control, including acts of God, flood, earthquake, fire, war, terrorism, riots, strikes, epidemics, or governmental actions.</p>
        <p><strong>20.2 Continuity of Payment Obligations:</strong> Notwithstanding the occurrence of any Force Majeure Event, the Hire Purchaser shall continue to remain liable for payment of all Hire Purchase Instalments, interest, taxes, charges and all other amounts payable under this Agreement.</p>
        <p><strong>20.3 Mitigation:</strong> The affected Party shall promptly notify the other Party in writing upon becoming aware of any Force Majeure Event and shall take all reasonable steps to mitigate its effects, minimise losses and resume performance of its obligations.</p>
        <p><strong>20.4 Preservation of Ownership Rights:</strong> The occurrence of any Force Majeure Event shall not affect, diminish or prejudice the ownership, title or repossession rights of the Owner in respect of the Machinery and Equipment.</p>
        <div class="section-title">21. GOVERNING LAW AND JURISDICTION</div>
        <p><strong>21.1 Governing Law:</strong> This Agreement shall be governed by and construed in accordance with the laws of India.</p>
        <p><strong>21.2 Jurisdiction:</strong> Subject to Clause 22 (Arbitration), the courts at Delhi shall have exclusive jurisdiction in respect of all applications, petitions, interim measures, enforcement proceedings and other matters arising out of or in connection with this Agreement.</p>
        <div class="section-title">22. ARBITRATION</div>
        <p><strong>22.1 Reference to Arbitration:</strong> Any and all disputes, differences, claims or controversies arising out of or in connection with this Agreement shall be referred to and finally resolved by arbitration conducted by a sole arbitrator mutually appointed by the Parties.</p>
        <p><strong>22.2 Seat and Venue:</strong> The seat and venue of arbitration shall be Delhi, India. The language of arbitration shall be English.</p>
        <p><strong>22.3 Interim Relief:</strong> The Owner shall be entitled to seek interim, protective or conservatory orders for repossession, inspection, custody, or receiver appointment.</p>
      </div>
    `,

    // Page 25
    `
      <div class="text-justify">
        <div class="section-title">23. RETURN OF MACHINERY AND EQUIPMENT UPON TERMINATION</div>
        <p><strong>23.1 Return Delivery:</strong> Upon expiry or termination, the Hire Purchaser shall immediately and peacefully deliver possession of the Machinery and Equipment in good working condition to the Owner at its sole cost.</p>
        <p><strong>23.2 Repossession:</strong> If the Hire Purchaser fails to return possession immediately, the Owner shall be entitled, subject to applicable law, to enter upon the Premises and repossess the same peacefully.</p>
        <p><strong>23.3 Cooperation:</strong> The Hire Purchaser shall provide full cooperation, access and assistance to the Owner for repossession and recovery and shall indemnify the Owner against all costs incurred.</p>
        <p><strong>23.4 No Waiver:</strong> The return or repossession shall not constitute a waiver, accord, satisfaction or discharge of any claim, right or remedy of the Owner against the Hire Purchaser.</p>
        <div class="section-title">24. PERSONAL GUARANTEE</div>
        <p>As a material inducement for the Owner to enter into this Agreement, Mr. <strong>${contactPerson}</strong> (PAN: <strong>${customerPan}</strong>) ("Guarantor") execute and deliver a Personal Guarantee in favour of the Owner.</p>
        <p>The Personal Guarantee shall secure the due and punctual payment of all Hire Purchase Instalments and all other amounts payable under this Agreement, together with the due performance and observance of all obligations, covenants and undertakings of the Hire Purchaser.</p>
        <p>The Guarantor shall be jointly and severally liable with the Hire Purchaser for all obligations under this Agreement.</p>
        <p>The Guarantee shall constitute a continuing, absolute and unconditional security and shall remain in force until all obligations secured thereby have been fully discharged, and the Owner shall be entitled, at its sole discretion and without first proceeding against</p>
        <p>the Hire Purchaser or the Machinery and Equipment, to invoke and enforce the Personal Guarantee and recover the outstanding amount from the Guarantor.</p>
        <div class="section-title">25. MISCELLANEOUS</div>
        <p><strong>25.1 Entire Agreement:</strong> This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior discussions, negotiations, understandings and agreements.</p>
        <p><strong>25.2 Amendments:</strong> No amendment, modification or variation of this Agreement shall be valid or binding unless made in writing and duly executed by the Parties.</p>
        <p><strong>25.3 Severability:</strong> If any provision of this Agreement is held to be invalid, illegal or unenforceable, the remaining provisions shall continue in full force and effect.</p>
        <p><strong>25.4 Waiver:</strong> No failure or delay by the Owner in exercising any right, power or remedy under this Agreement shall operate as a waiver thereof.</p>
        <p><strong>25.5 Waiver of Defences by Guarantor:</strong> To the fullest extent permissible under applicable law, the Guarantor expressly and irrevocably waives any rights, protections or defences which may otherwise be available under Sections 133, 134, 135, 139 and 141 of the Indian Contract Act, 1872.</p>
      </div>
    `,

    // Page 27
    `
      <div class="text-justify">
        <p><strong>25.6 Further Assurances:</strong> The Hire Purchaser shall, at its own cost, execute and do all such acts, deeds and things as may be reasonably required by the Owner to give full effect to the provisions of this Agreement.</p>
        <p><strong>25.7 Sale & Hire Purchase Back:</strong> The Owner shall be entitled to sell, transfer, securitise, or refinance its rights and receivables under this Agreement without requiring the prior consent of the Hire Purchaser.</p>
        
        <h2 style="margin-top: 50px; text-transform: uppercase; font-size: 14px; text-align: center;">Execution & Signatures</h2>
        <p style="text-align: center; margin-top: 10px; font-size: 11px;">IN WITNESS WHEREOF, the Parties hereto have signed this Agreement through their authorised representatives.</p>
        
        <div style="margin-top: 40px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px;">
            <span>FOR LIUGONG INDIA PVT. LTD.</span>
            <span>FOR ${customerCompany}</span>
          </div>
          
          <div class="signatures-grid" style="margin-top: 60px;">
            <div class="sig-block">
              <div class="sig-line">Authorised Signatory</div>
              <div style="font-size: 11px; margin-top: 5px; font-weight: bold;">Name - Nischal Mehrotra</div>
            </div>
            <div class="sig-block">
              <div class="sig-line">Partner / (Authorised Signatory)</div>
              <div style="font-size: 11px; margin-top: 5px; font-weight: bold;">Name - ${contactPerson}</div>
            </div>
          </div>
        </div>
      </div>
    `
  ];
};
