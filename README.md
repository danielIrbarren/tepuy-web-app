# TEPUY — Portal de Mantenimiento

Portal web para solicitudes de mantenimiento del complejo residencial TEPUY.
Los residentes escanean un QR, verifican su identidad con la cedula y envian solicitudes que se integran con ClickUp y Airtable via Make.com.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5.9
- **Estilos:** Tailwind CSS v4 + shadcn/ui (base-nova)
- **Base de datos:** Supabase (PostgreSQL 17) con RLS habilitado
- **Rate limiting:** Upstash Redis (sliding window)
- **Webhook:** Make.com (Custom Webhook -> ClickUp -> Airtable)
- **Deploy:** Vercel + GitHub Actions CI/CD

## Setup local

```bash
# 1. Clonar el repo
git clone <repo-url> && cd tepuy-web-app

# 2. Instalar dependencias
npm install

# 3. Crear archivo .env.local con las variables requeridas (ver abajo)
cp .env .env.local

# 4. Iniciar en desarrollo
npm run dev
```

## Variables de entorno

| Variable | Requerida | Descripcion |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Si | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Si | Clave de servicio para bypass de RLS |
| `ADMIN_PASSWORD_HASH` | Si | Hash bcrypt de la contraseña del admin, preferiblemente sin comillas ni `\\$` |
| `UPSTASH_REDIS_REST_URL` | Prod | URL de Upstash Redis (fallback en memoria en dev) |
| `UPSTASH_REDIS_REST_TOKEN` | Prod | Token de Upstash Redis |
| `MAKE_WEBHOOK_URL` | Prod | URL del webhook de Make.com |
| `CRON_SECRET` | Prod | Secret para autenticar el cron de Vercel |
| `NEXT_PUBLIC_APP_URL` | No | URL pública del portal para el QR (default: `https://tepuy-web-app.vercel.app`) |

## Estructura del proyecto

```
src/
  app/
    page.tsx              # Portal publico: wizard de 3 pasos
    admin/
      page.tsx            # Panel admin: tabla de residentes + CRUD
      login/page.tsx      # Login del admin
      qr/page.tsx         # Generador de QR para imprimir
    api/
      residentes/lookup/  # GET: busqueda publica por CI (rate limited)
      solicitudes/        # POST: crear solicitud de mantenimiento
      admin/              # Login, logout, CRUD de residentes (autenticado)
      cron/               # Retry automatico de webhooks fallidos
  components/             # Componentes React (UI publica + admin)
  lib/
    logger.ts             # Logging estructurado con correlation ID
    adminAuth.ts          # Middleware de auth para rutas admin
    rate-limit.ts         # Rate limiting con Upstash
    schemas/              # Schemas Zod compartidos (resident, solicitud, admin)
    supabase/server.ts    # Cliente Supabase (service_role)
    webhooks/             # Integracion Make.com + retry logic
  middleware.ts           # Auth check + correlation ID por request
```

## Comandos

```bash
npm run dev       # Servidor de desarrollo (Turbopack)
npm run build     # Build de produccion
npm run lint      # Linter (ESLint + Next.js rules)
```

## Base de datos

El modelo completo esta documentado en [`DATABASE_MODEL.md`](./DATABASE_MODEL.md).

Tablas principales:
- `residents` — Residentes del complejo (CI, datos personales, inmueble, status)
- `maintenance_requests` — Solicitudes de mantenimiento (con webhook lifecycle)
- `admin_sessions` — Sesiones del panel admin (cookie httpOnly, 8h TTL)

Las migraciones SQL estan en `supabase/migrations/`.

## Flujo del sistema

```
Residente escanea QR
  -> Portal publico (/)
  -> Ingresa CI -> GET /api/residentes/lookup
  -> Llena formulario -> POST /api/solicitudes
  -> Solicitud guardada en DB
  -> Webhook fire-and-forget a Make.com
  -> Make.com crea tarea en ClickUp + registro en Airtable
```

## Admin

Acceso en `/admin` protegido por contraseña unica (bcrypt).
Funcionalidades: buscar, crear, editar, activar/desactivar residentes, generar QR.
