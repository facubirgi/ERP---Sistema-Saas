/**
 * Este archivo DEBE ser importado PRIMERO antes que cualquier otro módulo
 * para asegurar que las variables de entorno se carguen antes de ser leídas
 */
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

// Función para cargar .env
function loadEnvFile(filePath: string): void {
  try {
    const envContent = readFileSync(filePath, 'utf-8');
    const lines = envContent.split(/\r?\n/); // Soporte para Windows y Unix line endings
    let loadedCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Ignorar líneas vacías y comentarios
      if (!line || line.startsWith('#')) {
        continue;
      }

      // Parsear KEY=VALUE
      const equalsIndex = line.indexOf('=');
      if (equalsIndex > 0) {
        const key = line.substring(0, equalsIndex).trim();
        let value = line.substring(equalsIndex + 1).trim();

        // Remover comillas si existen
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.substring(1, value.length - 1);
        }

        // SIEMPRE establecer la variable (sobrescribir si ya existe)
        process.env[key] = value;
        loadedCount++;
      }
    }

    console.log(
      `✓ Loaded ${loadedCount} environment variables from: ${filePath}`,
    );

    // Debug: Verificar que JWT_SECRET se cargó
    if (loadedCount > 0) {
      console.log(`  JWT_SECRET present: ${!!process.env.JWT_SECRET}`);
      console.log(
        `  JWT_REFRESH_SECRET present: ${!!process.env.JWT_REFRESH_SECRET}`,
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    console.error(`✗ Failed to load .env file from ${filePath}:`, errorMessage);
  }
}

// Buscar el archivo .env en múltiples ubicaciones posibles
const possibleEnvPaths = [
  resolve(process.cwd(), '.env'), // Desde el directorio de trabajo actual
  resolve(__dirname, '..', '.env'), // Desde dist (producción)
  resolve(__dirname, '../..', '.env'), // Desde src (desarrollo)
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
  if (existsSync(envPath)) {
    loadEnvFile(envPath);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn(
    '⚠ Warning: No .env file found in any of the expected locations',
  );
  console.warn('Searched paths:', possibleEnvPaths);
}
