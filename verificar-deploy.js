#!/usr/bin/env node

/**
 * Script de Verificación Pre-Despliegue
 * Ejecutar antes de desplegar a Railway y Netlify
 *
 * Uso: node verificar-deploy.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración para despliegue...\n');

let errores = 0;
let advertencias = 0;

// ===================================
// VERIFICAR ARCHIVOS NECESARIOS
// ===================================
console.log('📁 Verificando archivos de configuración...');

const archivosNecesarios = [
  { path: 'backend/package.json', tipo: 'backend' },
  { path: 'backend/railway.json', tipo: 'backend' },
  { path: 'backend/Procfile', tipo: 'backend' },
  { path: 'backend/.env.example', tipo: 'backend' },
  { path: 'frontend/package.json', tipo: 'frontend' },
  { path: 'frontend/netlify.toml', tipo: 'frontend' },
  { path: 'frontend/.env.example', tipo: 'frontend' },
];

archivosNecesarios.forEach(archivo => {
  const rutaCompleta = path.join(__dirname, archivo.path);
  if (fs.existsSync(rutaCompleta)) {
    console.log(`  ✅ ${archivo.path}`);
  } else {
    console.log(`  ❌ ${archivo.path} - NO ENCONTRADO`);
    errores++;
  }
});

console.log('');

// ===================================
// VERIFICAR PACKAGE.JSON BACKEND
// ===================================
console.log('📦 Verificando package.json del backend...');

try {
  const backendPkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'backend/package.json'), 'utf8')
  );

  // Verificar scripts necesarios
  const scriptsNecesarios = ['build', 'start:prod', 'migration:run'];
  scriptsNecesarios.forEach(script => {
    if (backendPkg.scripts && backendPkg.scripts[script]) {
      console.log(`  ✅ Script "${script}" encontrado`);
    } else {
      console.log(`  ❌ Script "${script}" NO ENCONTRADO`);
      errores++;
    }
  });

  // Verificar dependencias críticas
  const depsCriticas = ['@nestjs/core', '@nestjs/typeorm', 'typeorm', 'pg'];
  depsCriticas.forEach(dep => {
    if (backendPkg.dependencies && backendPkg.dependencies[dep]) {
      console.log(`  ✅ Dependencia "${dep}" encontrada`);
    } else {
      console.log(`  ❌ Dependencia "${dep}" NO ENCONTRADA`);
      errores++;
    }
  });
} catch (error) {
  console.log(`  ❌ Error leyendo backend/package.json: ${error.message}`);
  errores++;
}

console.log('');

// ===================================
// VERIFICAR PACKAGE.JSON FRONTEND
// ===================================
console.log('🎨 Verificando package.json del frontend...');

try {
  const frontendPkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'frontend/package.json'), 'utf8')
  );

  // Verificar scripts necesarios
  const scriptsNecesarios = ['build', 'start'];
  scriptsNecesarios.forEach(script => {
    if (frontendPkg.scripts && frontendPkg.scripts[script]) {
      console.log(`  ✅ Script "${script}" encontrado`);
    } else {
      console.log(`  ❌ Script "${script}" NO ENCONTRADO`);
      errores++;
    }
  });

  // Verificar dependencias críticas
  const depsCriticas = ['next', 'react', 'react-dom'];
  depsCriticas.forEach(dep => {
    if (frontendPkg.dependencies && frontendPkg.dependencies[dep]) {
      console.log(`  ✅ Dependencia "${dep}" encontrada`);
    } else {
      console.log(`  ❌ Dependencia "${dep}" NO ENCONTRADA`);
      errores++;
    }
  });
} catch (error) {
  console.log(`  ❌ Error leyendo frontend/package.json: ${error.message}`);
  errores++;
}

console.log('');

// ===================================
// VERIFICAR .ENV.EXAMPLE
// ===================================
console.log('🔐 Verificando variables de entorno...');

try {
  const backendEnv = fs.readFileSync(
    path.join(__dirname, 'backend/.env.example'),
    'utf8'
  );

  const variablesCriticas = [
    'NODE_ENV',
    'APP_PORT',
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_NAME',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'JWT_SECRET',
    'CORS_ORIGIN',
  ];

  variablesCriticas.forEach(variable => {
    if (backendEnv.includes(variable)) {
      console.log(`  ✅ Variable "${variable}" documentada`);
    } else {
      console.log(`  ⚠️  Variable "${variable}" NO documentada`);
      advertencias++;
    }
  });
} catch (error) {
  console.log(`  ❌ Error leyendo backend/.env.example: ${error.message}`);
  errores++;
}

console.log('');

// ===================================
// VERIFICAR GIT
// ===================================
console.log('🔗 Verificando repositorio Git...');

if (fs.existsSync(path.join(__dirname, '.git'))) {
  console.log('  ✅ Repositorio Git inicializado');

  // Verificar .gitignore
  if (fs.existsSync(path.join(__dirname, '.gitignore'))) {
    const gitignore = fs.readFileSync(
      path.join(__dirname, '.gitignore'),
      'utf8'
    );

    const patronesImportantes = ['.env', 'node_modules', '.next', 'dist'];
    patronesImportantes.forEach(patron => {
      if (gitignore.includes(patron)) {
        console.log(`  ✅ .gitignore incluye "${patron}"`);
      } else {
        console.log(`  ⚠️  .gitignore NO incluye "${patron}"`);
        advertencias++;
      }
    });
  } else {
    console.log('  ⚠️  .gitignore NO ENCONTRADO');
    advertencias++;
  }
} else {
  console.log('  ❌ Repositorio Git NO inicializado');
  errores++;
}

console.log('');

// ===================================
// VERIFICAR ARCHIVOS SENSIBLES
// ===================================
console.log('⚠️  Verificando archivos sensibles...');

const archivosSensibles = [
  'backend/.env',
  'frontend/.env.local',
  '.env'
];

let encontradoEnv = false;
archivosSensibles.forEach(archivo => {
  const rutaCompleta = path.join(__dirname, archivo);
  if (fs.existsSync(rutaCompleta)) {
    console.log(`  ⚠️  ${archivo} encontrado - NO DEBE estar en Git`);
    encontradoEnv = true;
  }
});

if (!encontradoEnv) {
  console.log('  ✅ No se encontraron archivos .env en el repositorio');
}

console.log('');

// ===================================
// RESUMEN
// ===================================
console.log('═══════════════════════════════════════');
console.log('📊 RESUMEN DE VERIFICACIÓN');
console.log('═══════════════════════════════════════');
console.log(`❌ Errores críticos: ${errores}`);
console.log(`⚠️  Advertencias: ${advertencias}`);
console.log('');

if (errores === 0 && advertencias === 0) {
  console.log('🎉 ¡Todo listo para desplegar!');
  console.log('');
  console.log('Próximos pasos:');
  console.log('1. Lee GUIA_DESPLIEGUE.md para instrucciones completas');
  console.log('2. Lee DESPLIEGUE_RAPIDO.md para un checklist rápido');
  console.log('3. Asegúrate de tener cuentas en Railway y Netlify');
  console.log('4. Sigue los pasos de la guía');
  process.exit(0);
} else if (errores === 0) {
  console.log('⚠️  Hay algunas advertencias, pero puedes continuar.');
  console.log('Revisa las advertencias antes de desplegar.');
  console.log('');
  console.log('Próximos pasos:');
  console.log('1. Lee GUIA_DESPLIEGUE.md para instrucciones completas');
  console.log('2. Lee DESPLIEGUE_RAPIDO.md para un checklist rápido');
  process.exit(0);
} else {
  console.log('❌ Hay errores críticos que deben ser corregidos.');
  console.log('Por favor, revisa los errores antes de intentar desplegar.');
  process.exit(1);
}
