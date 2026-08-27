import mysql from 'mysql2/promise';

const MYSQL_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'Atul@2310',
  database: 'mydatabase_migrated'
};

async function viewData() {
  try {
    console.log('Connecting to MySQL...');
    const connection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('Connected successfully to mydatabase_migrated!\n');

    // Fetch and display a sample of Users
    console.log('--- USERS (Top 3) ---');
    const [users] = await connection.query('SELECT _id, name, email, role FROM users LIMIT 3');
    console.table(users);
    console.log('\n');

    // Fetch and display a sample of Customers
    console.log('--- CUSTOMERS (Top 3) ---');
    const [customers] = await connection.query('SELECT _id, name, mobile, email FROM customers LIMIT 3');
    console.table(customers);
    console.log('\n');

    // Fetch and display a sample of Loans
    console.log('--- LOANS (Top 3) ---');
    const [loans] = await connection.query('SELECT _id, principal, status, approvalStatus FROM loans LIMIT 3');
    console.table(loans);
    console.log('\n');

    // Fetch counts for other tables to prove data is there
    const tables = ['machines', 'payments', 'categories'];
    console.log('--- DATA COUNTS ---');
    for (const table of tables) {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`${table}: ${rows[0].count} records`);
    }

    await connection.end();
  } catch (error) {
    console.error('Error connecting to or querying MySQL:', error.message);
  }
}

viewData();
