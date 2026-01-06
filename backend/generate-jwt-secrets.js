#!/usr/bin/env node

/**
 * Generador de Secretos JWT para Producción
 * 
 * Genera secretos criptográficamente seguros para JWT_SECRET y JWT_REFRESH_SECRET
 * Úsalos en Railway u otros entornos de producción
 * 
 * Uso: node generate-jwt-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generador de Secretos JWT\n');
console.log('═'.repeat(70));
console.log('\n⚠️  IMPORTANTE: Estos secretos son para PRODUCCIÓN únicamente');
console.log('⚠️  NO los commits a Git ni los compartas públicamente\n');
console.log('═'.repeat(70));

// Generar JWT_SECRET
const jwtSecret = crypto.randomBytes(64).toString('base64');
console.log('\n📝 JWT_SECRET (para tokens de acceso):');
console.log('-'.repeat(70));
console.log(jwtSecret);
console.log('-'.repeat(70));
console.log(`Longitud: ${jwtSecret.length} caracteres ✅\n`);

// Generar JWT_REFRESH_SECRET
const jwtRefreshSecret = crypto.randomBytes(64).toString('base64');
console.log('📝 JWT_REFRESH_SECRET (para refresh tokens):');
console.log('-'.repeat(70));
console.log(jwtRefreshSecret);
console.log('-'.repeat(70));
console.log(`Longitud: ${jwtRefreshSecret.length} caracteres ✅\n`);

console.log('═'.repeat(70));
console.log('\n✨ Cómo usar estos secretos:\n');
console.log('1. Railway:');
console.log('   - Ve a tu proyecto → Variables');
console.log('   - Agrega: JWT_SECRET = [copia el primer secreto]');
console.log('   - Agrega: JWT_REFRESH_SECRET = [copia el segundo secreto]\n');

console.log('2. Archivo .env local (desarrollo):');
console.log('   - Abre backend/.env');
console.log('   - Reemplaza los valores de JWT_SECRET y JWT_REFRESH_SECRET');
console.log('   - ⚠️  Asegúrate de que .env esté en .gitignore\n');

console.log('3. Verificación:');
console.log('   - Los secretos deben tener al menos 32 caracteres ✅');
console.log('   - Son únicos y criptográficamente seguros ✅');
console.log('   - Nunca uses secretos de ejemplo en producción ✅\n');

console.log('═'.repeat(70));
console.log('\n💡 Tip: Guarda estos secretos en un gestor de contraseñas seguro\n');
