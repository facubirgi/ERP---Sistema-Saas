const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const client = new Client({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5433', 10),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'saas_db',
});

console.log('Intentando conectar con:');
console.log('Host:', client.host);
console.log('Port:', client.port);
console.log('User:', client.user);
console.log('Database:', client.database);

client.connect((err) => {
  if (err) {
    console.error('\n✗ Error de conexión:', err.message);
    process.exit(1);
  }
  console.log('\n✓ Conexión exitosa a PostgreSQL!');
  client.end();
});
