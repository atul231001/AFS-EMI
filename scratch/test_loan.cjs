const mongoose = require('mongoose');

const uri = "mongodb://project_emi:mFZZI94FVjWn4tdR@ac-pilur9b-shard-00-00.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-01.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-02.egu1mey.mongodb.net:27017/mydatabase?ssl=true&replicaSet=atlas-5ihvjw-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    const loan = await db.collection('loans').findOne({ "invoiceData.invoiceNumber": "LIPLMP2627-1593" });
    if (loan) {
      console.log(JSON.stringify(loan.invoiceData, null, 2));
    } else {
      console.log("Loan not found");
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
