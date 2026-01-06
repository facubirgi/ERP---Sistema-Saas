import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => {
    // Railway y otros servicios proveen DATABASE_URL
    // Formato: postgresql://user:password@host:port/database
    const databaseUrl = process.env.DATABASE_URL;

    // Si existe DATABASE_URL, úsala (Railway, Heroku, etc.)
    if (databaseUrl) {
      return {
        type: 'postgres',
        url: databaseUrl,
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
        synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
        logging: process.env.DATABASE_LOGGING === 'true',
        ssl: process.env.DATABASE_SSL === 'true' ? {
          rejectUnauthorized: false
        } : false,
        extra: {
          max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
          min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
        },
      };
    }

    // Fallback: Variables separadas para desarrollo local
    return {
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5433', 10),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'saas_db',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
      synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
      logging: process.env.DATABASE_LOGGING === 'true',
      ssl: process.env.DATABASE_SSL === 'true' ? {
        rejectUnauthorized: false
      } : false,
      extra: {
        max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
        min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
      },
    };
  },
);
