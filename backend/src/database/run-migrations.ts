import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../../.env') });

console.log('Environment variables loaded:');
console.log('DATABASE_HOST:', process.env.DATABASE_HOST);
console.log('DATABASE_PORT:', process.env.DATABASE_PORT);
console.log('DATABASE_USER:', process.env.DATABASE_USER);
console.log(
  'DATABASE_PASSWORD:',
  process.env.DATABASE_PASSWORD ? '***' : 'undefined',
);
console.log('DATABASE_NAME:', process.env.DATABASE_NAME);

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5433', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'saas_db',
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, './migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
});

async function runMigrations() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('✓ Connected to database');

    console.log('\nRunning migrations...');
    const migrations = await AppDataSource.runMigrations();

    if (migrations.length === 0) {
      console.log('✓ No pending migrations');
    } else {
      console.log(`✓ Executed ${migrations.length} migration(s):`);
      migrations.forEach((migration) => {
        console.log(`  - ${migration.name}`);
      });
    }

    await AppDataSource.destroy();
    console.log('\n✓ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

// Execute migrations with proper error handling
void runMigrations();
