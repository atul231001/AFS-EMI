import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Machine from './models/Machine.js';

dotenv.config({ path: './backend/.env' });

const clean = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected for cleanup...");

    // List collections for debugging
    const dbCollections = await mongoose.connection.db.listCollections().toArray();
    console.log("Found collections:", dbCollections.map(c => c.name));

    // 1. Clear all documents from standard collections
    const collections = ['customers', 'machines', 'loans', 'payments', 'MACHINES'];
    for (const colName of collections) {
      try {
        await mongoose.connection.db.collection(colName).deleteMany({});
        console.log(`✅ Collection '${colName}' cleared.`);
      } catch (e) {
        console.log(`ℹ️ Collection '${colName}' could not be cleared (may not exist).`);
      }
    }

    // 2. Drop the problematic stale index
    const collectionsToCheck = ['machines', 'MACHINES'];
    for (const col of collectionsToCheck) {
      try {
        await mongoose.connection.db.collection(col).dropIndex('MACHINEID_1');
        console.log(`✅ Stale 'MACHINEID_1' index dropped from '${col}'.`);
      } catch (e) {
        // Silently continue if index or collection doesn't exist
      }
      
      try {
         // Also check for machineId index if it's causing issues
         await mongoose.connection.db.collection(col).dropIndex('machineId_1');
         console.log(`✅ Index 'machineId_1' dropped from '${col}' to allow fresh start.`);
      } catch (e) {}
    }

    console.log("\n✨ Database is now fresh and the duplicate error is fixed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup failed:", err.message);
    process.exit(1);
  }
};

clean();
