# 🚀 Guía de Despliegue - Sistema ERP SaaS

Esta guía te ayudará a desplegar tu aplicación en **Railway** (backend) y **Netlify** (frontend).

---

## 📋 Requisitos Previos

- ✅ Cuenta en [Railway](https://railway.app)
- ✅ Cuenta en [Netlify](https://netlify.com)
- ✅ Cuenta en GitHub/GitLab/Bitbucket (para conectar los repositorios)
- ✅ Base de datos PostgreSQL (Railway ofrece PostgreSQL gratuito)

---

## 🗄️ Paso 1: Desplegar Base de Datos en Railway

### 1.1 Crear Proyecto en Railway

1. Ve a [Railway](https://railway.app) e inicia sesión
2. Click en **"New Project"**
3. Selecciona **"Provision PostgreSQL"**
4. Espera a que se cree la base de datos

### 1.2 Obtener Credenciales de la Base de Datos

1. Click en tu servicio de PostgreSQL
2. Ve a la pestaña **"Variables"**
3. Copia las siguientes variables (las necesitarás después):
   - `PGHOST` → `DATABASE_HOST`
   - `PGPORT` → `DATABASE_PORT`
   - `PGDATABASE` → `DATABASE_NAME`
   - `PGUSER` → `DATABASE_USER`
   - `PGPASSWORD` → `DATABASE_PASSWORD`

---

## 🔧 Paso 2: Desplegar Backend en Railway

### 2.1 Conectar Repositorio

1. En Railway, click en **"New"** → **"GitHub Repo"**
2. Selecciona tu repositorio del proyecto
3. Railway detectará automáticamente que es un proyecto Node.js

### 2.2 Configurar Variables de Entorno

Ve a la pestaña **"Variables"** de tu servicio backend y agrega:

```env
# APLICACIÓN
NODE_ENV=production
APP_PORT=3001
APP_HOST=0.0.0.0
APP_NAME=Multi-Tenant SaaS

# BASE DE DATOS (usar las credenciales de Railway PostgreSQL)
DATABASE_HOST=<tu-pghost>
DATABASE_PORT=<tu-pgport>
DATABASE_NAME=<tu-pgdatabase>
DATABASE_USER=<tu-pguser>
DATABASE_PASSWORD=<tu-pgpassword>
DATABASE_SSL=true
DATABASE_SYNCHRONIZE=false
DATABASE_LOGGING=false
DATABASE_AUTO_LOAD_ENTITIES=true
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# AUTENTICACIÓN (GENERA CLAVES SEGURAS)
# Genera con: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
JWT_SECRET=<genera-una-clave-segura-aqui>
JWT_EXPIRATION=1h
JWT_REFRESH_SECRET=<genera-otra-clave-segura-aqui>
JWT_REFRESH_EXPIRATION=7d
BCRYPT_ROUNDS=10

# CORS (usar la URL de tu frontend en Netlify)
CORS_ORIGIN=https://tu-app.netlify.app
CORS_CREDENTIALS=true

# REGLAS DE NEGOCIO
MARGEN_MINIMO_PORCENTAJE=0
STOCK_BAJO_MULTIPLICADOR=1.0

# PAGINACIÓN
PAGINATION_DEFAULT_PAGE=1
PAGINATION_DEFAULT_LIMIT=20
PAGINATION_MAX_LIMIT=100

# LOGGING
LOG_LEVEL=info
LOG_PRETTY=false

# MULTI-TENANT
TENANT_ISOLATION_MODE=schema
DEFAULT_TENANT=default
MAX_TENANTS_PER_DATABASE=100

# RATE LIMITING
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

### 2.3 Configurar Directorio Raíz

1. Ve a **"Settings"** → **"Build"**
2. En **"Root Directory"**, pon: `backend`
3. En **"Build Command"**, pon: `npm install && npm run build`
4. En **"Start Command"**, pon: `npm run start:prod`

### 2.4 Obtener URL del Backend

1. Ve a la pestaña **"Settings"** → **"Domains"**
2. Railway genera una URL automática como: `https://tu-backend.up.railway.app`
3. **Copia esta URL** (la necesitarás para el frontend)

---

## 🎨 Paso 3: Desplegar Frontend en Netlify

### 3.1 Conectar Repositorio

1. Ve a [Netlify](https://netlify.com) e inicia sesión
2. Click en **"Add new site"** → **"Import an existing project"**
3. Selecciona tu proveedor de Git (GitHub/GitLab)
4. Selecciona tu repositorio

### 3.2 Configurar Build Settings

1. **Base directory**: `frontend`
2. **Build command**: `npm run build`
3. **Publish directory**: `frontend/.next`

### 3.3 Configurar Variables de Entorno

En **"Site configuration"** → **"Environment variables"**, agrega:

```env
NEXT_PUBLIC_API_URL=https://tu-backend.up.railway.app/api
NODE_VERSION=20
```

⚠️ **IMPORTANTE**: Reemplaza `https://tu-backend.up.railway.app` con la URL real de tu backend de Railway.

### 3.4 Instalar Plugin de Next.js

1. Ve a **"Plugins"** en tu sitio de Netlify
2. Busca e instala **"Next.js Runtime"** o **"@netlify/plugin-nextjs"**

### 3.5 Desplegar

1. Click en **"Deploy site"**
2. Netlify construirá y desplegará tu aplicación
3. Tu sitio estará disponible en: `https://tu-app.netlify.app`

---

## 🔄 Paso 4: Actualizar CORS en Backend

Una vez que tengas la URL de Netlify:

1. Ve a Railway → Backend → **"Variables"**
2. Actualiza la variable `CORS_ORIGIN` con tu URL de Netlify:
   ```env
   CORS_ORIGIN=https://tu-app.netlify.app
   ```
3. Railway redesplegará automáticamente el backend

---

## 🗃️ Paso 5: Ejecutar Migraciones de Base de Datos

### Opción A: Usando Railway CLI (Recomendado)

1. Instala Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Inicia sesión:
   ```bash
   railway login
   ```

3. Vincula tu proyecto:
   ```bash
   cd backend
   railway link
   ```

4. Ejecuta las migraciones:
   ```bash
   railway run npm run migration:run
   ```

### Opción B: Conectándote desde tu máquina local

1. Obtén las credenciales de PostgreSQL de Railway
2. Conéctate usando tu cliente PostgreSQL favorito
3. Ejecuta las migraciones manualmente

---

## ✅ Paso 6: Verificar el Despliegue

### Verificar Backend

Accede a: `https://tu-backend.up.railway.app/api/health`

Deberías ver algo como:
```json
{
  "status": "ok",
  "timestamp": "2026-01-05T..."
}
```

### Verificar Frontend

1. Accede a tu URL de Netlify
2. Intenta iniciar sesión
3. Verifica que puedas acceder a todas las funcionalidades

---

## 🛠️ Comandos Útiles

### Generar Claves Seguras para JWT

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Ver Logs del Backend en Railway

```bash
railway logs
```

### Ver Logs del Frontend en Netlify

Ve a **"Deploys"** → Click en tu deploy → **"Deploy log"**

---

## 📱 Configuración de Dominios Personalizados (Opcional)

### Backend (Railway)

1. Ve a **"Settings"** → **"Domains"**
2. Click en **"Custom Domain"**
3. Sigue las instrucciones para configurar tu dominio

### Frontend (Netlify)

1. Ve a **"Domain management"**
2. Click en **"Add custom domain"**
3. Sigue las instrucciones para configurar tu dominio

---

## 🔒 Seguridad y Mejores Prácticas

### ✅ Checklist de Seguridad

- [ ] Generar claves JWT seguras y únicas
- [ ] Configurar `DATABASE_SSL=true` en producción
- [ ] Deshabilitar `DATABASE_SYNCHRONIZE` en producción
- [ ] Configurar CORS correctamente con tu dominio real
- [ ] Usar `DATABASE_LOGGING=false` en producción
- [ ] Configurar límites de rate limiting apropiados
- [ ] Revisar y ajustar `BCRYPT_ROUNDS` según tu hardware (10-12 recomendado)
- [ ] Configurar backups automáticos de la base de datos en Railway

### ⚠️ Variables que NUNCA debes exponer

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `DATABASE_PASSWORD`
- Credenciales de SMTP
- Claves de API de terceros

---

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"

1. Verifica que las credenciales de PostgreSQL sean correctas
2. Asegúrate de que `DATABASE_SSL=true` en producción
3. Verifica que el servicio de PostgreSQL esté activo en Railway

### Error: "CORS policy blocked"

1. Verifica que `CORS_ORIGIN` tenga la URL correcta de Netlify
2. Asegúrate de incluir `https://` en la URL
3. No uses trailing slash (`/`) al final de la URL

### Error: "Module not found" en Frontend

1. Asegúrate de que todas las dependencias estén en `dependencies` (no en `devDependencies`)
2. Limpia la caché de Netlify: **"Site configuration"** → **"Clear cache and deploy site"**

### Error: "JWT expired" constante

1. Verifica que las claves JWT sean las mismas en todos los deploys
2. Asegúrate de que el reloj del servidor esté sincronizado

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en Railway: `railway logs`
2. Revisa los logs en Netlify: Deploy log
3. Verifica las variables de entorno
4. Asegúrate de que ambos servicios estén desplegados correctamente

---

## 🎉 ¡Listo!

Tu aplicación ERP SaaS ya está desplegada en producción.

**URLs finales:**
- Backend: `https://tu-backend.up.railway.app`
- Frontend: `https://tu-app.netlify.app`

---

## 📝 Notas Adicionales

### Costos Aproximados

- **Railway**: Plan Hobby ($5/mes) incluye $5 de crédito
- **Netlify**: Plan gratuito incluye 100GB de ancho de banda

### Escalabilidad

- Railway escala automáticamente según el uso
- Netlify CDN global garantiza baja latencia
- Considera agregar Redis para caché en el futuro

### Mantenimiento

- Railway autodespliega cuando haces push a tu rama principal
- Netlify autodespliega cuando haces push a tu rama principal
- Configura ramas de staging para pruebas antes de producción
