# ⚡ Despliegue Rápido - Checklist

## 📋 Checklist de Despliegue

### 1. Railway - Base de Datos PostgreSQL
- [ ] Crear cuenta en Railway
- [ ] Crear nuevo proyecto
- [ ] Provision PostgreSQL
- [ ] Copiar credenciales (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD)

### 2. Railway - Backend NestJS
- [ ] Conectar repositorio GitHub
- [ ] Configurar Root Directory: `backend`
- [ ] Configurar Build Command: `npm install && npm run build`
- [ ] Configurar Start Command: `npm run start:prod`
- [ ] Agregar variables de entorno (ver abajo)
- [ ] Copiar URL del backend: `https://xxx.up.railway.app`

### 3. Netlify - Frontend Next.js
- [ ] Crear cuenta en Netlify
- [ ] Conectar repositorio GitHub
- [ ] Configurar Base directory: `frontend`
- [ ] Configurar Build command: `npm run build`
- [ ] Configurar Publish directory: `frontend/.next`
- [ ] Instalar plugin: `@netlify/plugin-nextjs`
- [ ] Agregar variable: `NEXT_PUBLIC_API_URL=https://xxx.up.railway.app/api`
- [ ] Desplegar
- [ ] Copiar URL: `https://xxx.netlify.app`

### 4. Actualizar CORS
- [ ] Volver a Railway → Backend → Variables
- [ ] Actualizar `CORS_ORIGIN=https://xxx.netlify.app`

### 5. Migraciones
- [ ] Instalar Railway CLI: `npm install -g @railway/cli`
- [ ] `railway login`
- [ ] `cd backend && railway link`
- [ ] `railway run npm run migration:run`

---

## 🔐 Variables de Entorno Mínimas

### Backend (Railway)

```env
# App
NODE_ENV=production
APP_PORT=3001
APP_HOST=0.0.0.0

# Database (usar credenciales de Railway PostgreSQL)
DATABASE_HOST=<PGHOST>
DATABASE_PORT=<PGPORT>
DATABASE_NAME=<PGDATABASE>
DATABASE_USER=<PGUSER>
DATABASE_PASSWORD=<PGPASSWORD>
DATABASE_SSL=true
DATABASE_SYNCHRONIZE=false

# Auth (generar con: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")
JWT_SECRET=<generar>
JWT_REFRESH_SECRET=<generar>

# CORS (usar URL de Netlify)
CORS_ORIGIN=https://tu-app.netlify.app
CORS_CREDENTIALS=true
```

### Frontend (Netlify)

```env
NEXT_PUBLIC_API_URL=https://tu-backend.up.railway.app/api
NODE_VERSION=20
```

---

## ⚡ Comandos Rápidos

### Generar claves JWT seguras
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Ver logs Railway
```bash
railway logs
```

### Ejecutar migraciones
```bash
cd backend
railway run npm run migration:run
```

---

## 🔗 URLs Importantes

- Railway Dashboard: https://railway.app/dashboard
- Netlify Dashboard: https://app.netlify.com
- Tu Backend: `https://xxx.up.railway.app`
- Tu Frontend: `https://xxx.netlify.app`

---

## ❌ Errores Comunes

### "Cannot connect to database"
→ Verifica `DATABASE_SSL=true` y credenciales

### "CORS blocked"
→ Verifica `CORS_ORIGIN` en Railway (debe ser URL de Netlify)

### "Module not found"
→ Mueve dependencias de `devDependencies` a `dependencies`

---

## 📞 Testing

### Backend Health Check
```bash
curl https://tu-backend.up.railway.app/api/health
```

### Frontend
1. Abrir `https://tu-app.netlify.app`
2. Intentar login
3. Verificar funcionalidades

---

¡Listo para producción! 🚀
