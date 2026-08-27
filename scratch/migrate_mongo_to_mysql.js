import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import mysql from 'mysql2/promise';

const MONGO_URI = 'mongodb://project_emi:mFZZI94FVjWn4tdR@ac-pilur9b-shard-00-00.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-01.egu1mey.mongodb.net:27017,ac-pilur9b-shard-00-02.egu1mey.mongodb.net:27017/mydatabase?ssl=true&replicaSet=atlas-5ihvjw-shard-0&authSource=admin&retryWrites=true&w=majority';
const MYSQL_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'Atul@2310'
};
const MYSQL_DB = 'mydatabase_migrated';

function mapMongooseTypeToMySQL(pathObj) {
  const instance = pathObj.instance;
  if (instance === 'String') return 'TEXT';
  if (instance === 'Number') return 'DOUBLE';
  if (instance === 'Boolean') return 'BOOLEAN';
  if (instance === 'Date') return 'DATETIME';
  if (instance === 'ObjectID' || instance === 'ObjectId') return 'VARCHAR(24)';
  if (instance === 'Array') return 'JSON';
  if (instance === 'Mixed') return 'JSON';
  if (pathObj.schema) return 'JSON';
  return 'JSON';
}

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  console.log('Connecting to MySQL...');
  const connection = await mysql.createConnection(MYSQL_CONFIG);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DB}\``);
  await connection.query(`USE \`${MYSQL_DB}\``);
  console.log('Connected to MySQL and using database:', MYSQL_DB);

  const modelsDir = path.join(process.cwd(), 'backend', 'models');
  const files = await fs.readdir(modelsDir);
  const modelFiles = files.filter(f => f.endsWith('.js'));

  for (const file of modelFiles) {
    console.log(`\nProcessing model from ${file}...`);
    const fileUrl = 'file:///' + path.join(modelsDir, file).replace(/\\/g, '/');
    let module;
    try {
        module = await import(fileUrl);
    } catch(err) {
        console.error(`Failed to load ${file}:`, err.message);
        continue;
    }
    
    const exported = module.default || module;
    const modelsToProcess = [];
    
    if (exported.schema) {
        modelsToProcess.push(exported);
    } else {
        for (const key of Object.keys(exported)) {
            if (exported[key] && exported[key].schema) {
                modelsToProcess.push(exported[key]);
            }
        }
    }

    if (modelsToProcess.length === 0) {
      console.log(`No valid Mongoose model found in ${file}.`);
      continue;
    }

    for (const Model of modelsToProcess) {
      const tableName = Model.collection.collectionName;
      console.log(`Table name will be: ${tableName}`);

      const schema = Model.schema;
      let createTableSql = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n`;
      createTableSql += `  \`_id\` VARCHAR(24) PRIMARY KEY,\n`;

      const paths = schema.paths;
      const columns = ['_id']; 
      
      for (const [pathName, pathObj] of Object.entries(paths)) {
        if (pathName === '_id' || pathName === '__v') continue;
        
        const parts = pathName.split('.');
        if(parts.length > 1) {
            const topLevel = parts[0];
            if(!columns.includes(topLevel)) {
                createTableSql += `  \`${topLevel}\` JSON,\n`;
                columns.push(topLevel);
            }
            continue;
        }
        
        const sqlType = mapMongooseTypeToMySQL(pathObj);
        createTableSql += `  \`${pathName}\` ${sqlType},\n`;
        columns.push(pathName);
      }
      
      createTableSql = createTableSql.replace(/,\n$/, '\n');
      createTableSql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
      
      console.log(`Executing CREATE TABLE...`);
      await connection.query(createTableSql);

      const indexes = schema.indexes();
      for (const [indexFields, options] of indexes) {
         for(const [field, direction] of Object.entries(indexFields)) {
             if(field === '_id' || field.includes('.')) continue;
             const indexName = `idx_${tableName}_${field}`;
             const indexQuery = `CREATE INDEX \`${indexName}\` ON \`${tableName}\` (\`${field}\`(255));`;
             try {
                 await connection.query(indexQuery);
                 console.log(`Created index ${indexName}`);
             } catch(err) {
                 if(err.code !== 'ER_DUP_KEYNAME' && err.code !== 'ER_BLOB_KEY_WITHOUT_LENGTH') {
                     const indexQueryNoLen = `CREATE INDEX \`${indexName}\` ON \`${tableName}\` (\`${field}\`);`;
                     try {
                         await connection.query(indexQueryNoLen);
                         console.log(`Created index ${indexName}`);
                     } catch(innerErr) {
                         if(innerErr.code !== 'ER_DUP_KEYNAME') console.error(`Could not create index for ${field}: ${innerErr.message}`);
                     }
                 }
             }
         }
      }

      console.log(`Fetching data from MongoDB for ${tableName}...`);
      const docs = await Model.find({}).lean();
      console.log(`Found ${docs.length} documents. Inserting into MySQL...`);
      
      if (docs.length === 0) continue;

      for (const doc of docs) {
         const row = {};
         row['_id'] = doc._id.toString();
         for(const col of columns) {
             if (col === '_id') continue;
             let val = doc[col];
             
             if(val === undefined || val === null) {
                 row[col] = null;
                 continue;
             }

             if (typeof val === 'object' && !(val instanceof Date)) {
                 if (val.toString && /^[0-9a-fA-F]{24}$/.test(val.toString())) {
                     row[col] = val.toString();
                 } else {
                     row[col] = JSON.stringify(val);
                 }
             } else if (val instanceof Date) {
                 row[col] = val;
             } else {
                 row[col] = val;
             }
         }

         const colsQuery = Object.keys(row).map(c => '\`' + c + '\`').join(', ');
         const placeholders = Object.keys(row).map(() => '?').join(', ');
         const values = Object.values(row);

         const insertQuery = `INSERT IGNORE INTO \`${tableName}\` (${colsQuery}) VALUES (${placeholders})`;
         try {
             await connection.execute(insertQuery, values);
         } catch(err) {
             console.error(`Failed to insert document _id ${row._id}:`, err.message);
         }
      }
      console.log(`Finished migrating ${tableName}.`);
    }
  }

  console.log('\nMigration complete.');
  process.exit(0);
}

run().catch(console.error);
