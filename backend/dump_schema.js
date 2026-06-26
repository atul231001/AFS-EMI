import mongoose from 'mongoose';
import fs from 'fs';

const uri = "mongodb://project_emi:mFZZI94FVjWn4tdR@ac-pilur9b-shard-00-00.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-01.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-02.egu1mey.mongodb.net:27017/mydatabase?ssl=true&replicaSet=atlas-5ihvjw-shard-0&authSource=admin&retryWrites=true&w=majority";

async function dumpSchema() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const schemaSample = {};

    for (const col of collections) {
      const name = col.name;
      const docs = await db.collection(name).find().limit(2).toArray();
      schemaSample[name] = docs;
    }

    fs.writeFileSync('mongodb_sample.json', JSON.stringify(schemaSample, null, 2));
    console.log("Successfully dumped schema to mongodb_sample.json");

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

dumpSchema();
