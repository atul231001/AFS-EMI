import mongoose from 'mongoose';

const MONGODB_URI = "mongodb://project_emi:mFZZI94FVjWn4tdR@ac-pilur9b-shard-00-00.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-01.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-02.egu1mey.mongodb.net:27017/mydatabase?ssl=true&replicaSet=atlas-5ihvjw-shard-0&authSource=admin&retryWrites=true&w=majority";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');
  
  const cust = await mongoose.connection.collection('customers').findOne({ name: 'SILICON TRADERS' });
  console.log('SILICON TRADERS customer document:', cust);
  
  process.exit(0);
}

run().catch(console.error);
