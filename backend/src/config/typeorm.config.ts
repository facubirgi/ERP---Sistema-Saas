import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../../.env') });

// Configuración base
const baseConfig: any = {
  type: 'postgres',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
  logging: process.env.DATABASE_LOGGING === 'true',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Si existe DATABASE_URL (Railway, producción), usarla
if (process.env.DATABASE_URL) {
  baseConfig.url = process.env.DATABASE_URL;
} else {
  // Si no, usar variables individuales (desarrollo local)
  baseConfig.host = process.env.DATABASE_HOST || 'localhost';
  baseConfig.port = parseInt(process.env.DATABASE_PORT || '5433', 10);
  baseConfig.username = process.env.DATABASE_USER || 'postgres';
  baseConfig.password = process.env.DATABASE_PASSWORD || 'postgres';
  baseConfig.database = process.env.DATABASE_NAME || 'saas_db';
}

export default new DataSource(baseConfig);
