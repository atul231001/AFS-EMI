const mongoose = require('mongoose');
const https = require('https');

const uri = "mongodb://project_emi:mFZZI94FVjWn4tdR@ac-pilur9b-shard-00-00.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-01.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-02.egu1mey.mongodb.net:27017/mydatabase?ssl=true&replicaSet=atlas-5ihvjw-shard-0&authSource=admin&retryWrites=true&w=majority";

function fetchInvoiceData(invoiceNumber) {
  return new Promise((resolve, reject) => {
    const data = new TextEncoder().encode('');
    const options = {
      hostname: 'lipl.sods.app',
      port: 443,
      path: '/api/dmobile/getInvoiceDetails?invoice_number=' + encodeURIComponent(invoiceNumber),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', d => {
        body += d;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch(e) {
          reject(e);
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    const loans = await db.collection('loans').find({ 
      invoiceData: { $exists: true },
      "invoiceData.ofm_number": { $exists: false }
    }).toArray();
    
    console.log(`Found ${loans.length} loans with missing ofm_number in invoiceData. Fixing...`);
    
    let updatedCount = 0;
    
    for (const loan of loans) {
      if (!loan.invoiceData.invoiceNumber && !loan.invoiceNumber) continue;
      const invNum = loan.invoiceData.invoiceNumber || loan.invoiceNumber;
      
      try {
        const apiResponse = await fetchInvoiceData(invNum);
        if (apiResponse && apiResponse.status && apiResponse.result && apiResponse.result.length > 0) {
          const apiInvoiceData = apiResponse.result[0];
          if (apiInvoiceData.ofm_number) {
            await db.collection('loans').updateOne(
              { _id: loan._id },
              { $set: { "invoiceData.ofm_number": apiInvoiceData.ofm_number } }
            );
            console.log(`Updated loan ${loan._id} (Invoice: ${invNum}) with ofm_number: ${apiInvoiceData.ofm_number}`);
            updatedCount++;
          } else {
             console.log(`API response for Invoice ${invNum} did not contain ofm_number.`);
          }
        } else {
           console.log(`Could not fetch data for Invoice ${invNum}`);
        }
      } catch (err) {
        console.error(`Error fetching data for ${invNum}:`, err);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} loans.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
