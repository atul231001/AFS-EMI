import mongoose from 'mongoose';

const dbs = ['emi_db', 'clg', 'emi_test_db', 'emi_system', 'emi_platform'];

async function inspect(dbName) {
  const conn = await mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbName}`).asPromise();
  const cols = await conn.db.listCollections().toArray();
  console.log(`\n=== Database: ${dbName} ===`);
  for (const col of cols) {
    const count = await conn.db.collection(col.name).countDocuments();
    console.log(` - ${col.name}: ${count} documents`);
  }
  await conn.close();
}

async function run() {
  for (const db of dbs) {
    await inspect(db);
  }
  process.exit(0);
}

run().catch(console.error);
