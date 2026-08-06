const mongoose = require('mongoose');

const uri = "mongodb://project_emi:mFZZI94FVjWn4tdR@ac-pilur9b-shard-00-00.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-01.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-02.egu1mey.mongodb.net:27017/mydatabase?ssl=true&replicaSet=atlas-5ihvjw-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    const loans = await db.collection('loans').find({ 
      invoiceData: { $exists: true },
      "invoiceData.ofm_number": { $exists: false }
    }).toArray();
    
    console.log(`Found ${loans.length} loans with missing ofm_number in invoiceData`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
