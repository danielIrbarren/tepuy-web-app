# TEPUY Web App — Modelo de Datos

> **Supabase Project:** `Tepuy web app` (`opsywnwefweglnmziwdo`)  
> **Region:** us-west-2 | **PostgreSQL:** 17.6  
> **Fecha de creación:** 2026-03-26  

---

## Migraciones Aplicadas

| Versión | Nombre | Estado |
|---------|--------|--------|
| `20260327024908` | `create_enums_and_residents` | ✅ Aplicada |
| `20260327024922` | `create_maintenance_requests` | ✅ Aplicada |
| `20260327024929` | `create_admin_sessions` | ✅ Aplicada |
| `20260327024936` | `enable_rls_policies` | ✅ Aplicada |

---

## Enums

### `resident_status`
| Valor | Descripción |
|-------|-------------|
| `active` | Residente puede usar el portal público |
| `inactive` | Bloqueado — sin CI válida o removido por admin |

### `work_area_type`
| Valor | Área |
|-------|------|
| `plomeria` | Plomería |
| `electricidad` | Electricidad |
| `pintura` | Pintura |
| `carpinteria` | Carpintería |
| `cerrajeria` | Cerrajería |
| `aire_acondicionado` | Aire acondicionado |
| `albanileria` | Albañilería |
| `impermeabilizacion` | Impermeabilización |
| `vidrieria` | Vidriería |
| `limpieza` | Limpieza |
| `jardineria` | Jardinería |
| `otro` | Otro |

### `webhook_status_type`
| Valor | Descripción |
|-------|-------------|
| `pending` | Webhook no enviado aún |
| `sent` | Webhook enviado exitosamente (2xx) |
| `failed` | Webhook falló — retry hasta 3 intentos |

---

## Tablas

### `residents` — Residentes del complejo TEPUY

| Columna | Tipo | Nullable | Default | Restricciones |
|---------|------|----------|---------|---------------|
| `id` | UUID | NO | `gen_random_uuid()` | **PK** |
| `ci_usuario` | VARCHAR(20) | NO | — | **UNIQUE** |
| `nombre_usuario` | VARCHAR(255) | SÍ | — | — |
| `tlf_usuario` | VARCHAR(50) | SÍ | — | — |
| `status` | `resident_status` | NO | `'active'` | — |
| `descripcion_inmueble` | VARCHAR(255) | SÍ | — | — |
| `nro_apto` | VARCHAR(20) | SÍ | — | — |
| `fase` | VARCHAR(100) | SÍ | — | — |
| `gerencia` | VARCHAR(100) | SÍ | — | — |
| `nombre_propietario` | VARCHAR(255) | SÍ | — | — |
| `ci_propietario` | VARCHAR(20) | SÍ | — | — |
| `email_propietario` | VARCHAR(255) | SÍ | — | — |
| `tlf_propietario` | VARCHAR(50) | SÍ | — | — |
| `fecha_inicio_contrato` | DATE | SÍ | — | — |
| `created_at` | TIMESTAMPTZ | NO | `now()` | — |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Auto-trigger |

**Índices:**
- `residents_ci_usuario_key` — UNIQUE en `ci_usuario`
- `idx_residents_descripcion_inmueble` — BTREE en `descripcion_inmueble`
- `idx_residents_status` — BTREE en `status`

**RLS:** ✅ Habilitado — Solo `service_role` tiene acceso

---

### `maintenance_requests` — Solicitudes de mantenimiento

| Columna | Tipo | Nullable | Default | Restricciones |
|---------|------|----------|---------|---------------|
| `id` | UUID | NO | `gen_random_uuid()` | **PK** |
| `resident_id` | UUID | NO | — | **FK → residents(id)** ON DELETE RESTRICT |
| `ci_usuario` | VARCHAR(20) | NO | — | Desnormalizado |
| `nombre_usuario` | VARCHAR(255) | SÍ | — | Desnormalizado |
| `descripcion_inmueble` | VARCHAR(255) | SÍ | — | Desnormalizado |
| `nro_apto` | VARCHAR(20) | SÍ | — | Desnormalizado |
| `tlf_usuario` | VARCHAR(50) | SÍ | — | Desnormalizado |
| `gerencia` | VARCHAR(100) | SÍ | — | Desnormalizado |
| `work_area` | `work_area_type` | NO | — | — |
| `description` | TEXT | NO | — | CHECK: `length ≤ 1000` |
| `preferred_time` | VARCHAR(255) | SÍ | — | — |
| `access_notes` | TEXT | SÍ | — | CHECK: `length ≤ 300` |
| `webhook_status` | `webhook_status_type` | NO | `'pending'` | — |
| `retry_count` | INTEGER | NO | `0` | — |
| `external_reference` | TEXT | SÍ | — | task_url de ClickUp |
| `correlation_id` | UUID | NO | `gen_random_uuid()` | Logging |
| `created_at` | TIMESTAMPTZ | NO | `now()` | — |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Auto-trigger |

**Índices:**
- `idx_maintenance_requests_resident_id` — BTREE en `resident_id`
- `idx_maintenance_requests_webhook_status` — BTREE en `webhook_status`
- `idx_maintenance_requests_created_at` — BTREE DESC en `created_at`

**FK:** `resident_id` → `residents(id)` con `ON DELETE RESTRICT` (no se puede borrar un residente con solicitudes)

**RLS:** ✅ Habilitado — Solo `service_role` tiene acceso

---

### `admin_sessions` — Sesiones del panel de administración

| Columna | Tipo | Nullable | Default | Restricciones |
|---------|------|----------|---------|---------------|
| `id` | UUID | NO | `gen_random_uuid()` | **PK** |
| `session_token` | VARCHAR(255) | NO | — | **UNIQUE** |
| `expires_at` | TIMESTAMPTZ | NO | — | 8h desde creación |
| `created_at` | TIMESTAMPTZ | NO | `now()` | — |

**Índices:**
- `admin_sessions_session_token_key` — UNIQUE en `session_token`
- `idx_admin_sessions_expires_at` — BTREE en `expires_at`

**RLS:** ✅ Habilitado — Solo `service_role` tiene acceso

---

## Diagrama de Relaciones

```
┌──────────────────────┐         ┌──────────────────────────┐
│      residents       │         │   maintenance_requests    │
├──────────────────────┤         ├──────────────────────────┤
│ id (PK)              │◄───┐    │ id (PK)                  │
│ ci_usuario (UQ)      │    │    │ resident_id (FK) ────────┤
│ nombre_usuario       │    └────│ ci_usuario (denorm)      │
│ tlf_usuario          │         │ nombre_usuario (denorm)  │
│ status               │         │ descripcion_inmueble     │
│ descripcion_inmueble │         │ nro_apto (denorm)        │
│ nro_apto             │         │ tlf_usuario (denorm)     │
│ fase                 │         │ gerencia (denorm)        │
│ gerencia             │         │ work_area                │
│ nombre_propietario   │         │ description              │
│ ci_propietario       │         │ preferred_time           │
│ email_propietario    │         │ access_notes             │
│ tlf_propietario      │         │ webhook_status           │
│ fecha_inicio_contrato│         │ retry_count              │
│ created_at           │         │ external_reference       │
│ updated_at           │         │ correlation_id           │
└──────────────────────┘         │ created_at               │
                                 │ updated_at               │
┌──────────────────────┐         └──────────────────────────┘
│   admin_sessions     │
├──────────────────────┤
│ id (PK)              │
│ session_token (UQ)   │
│ expires_at           │
│ created_at           │
└──────────────────────┘
```

---

## Seguridad

| Tabla | RLS | Policy | Acceso anon_key |
|-------|-----|--------|-----------------|
| `residents` | ✅ | Solo `service_role` | ❌ Bloqueado |
| `maintenance_requests` | ✅ | Solo `service_role` | ❌ Bloqueado |
| `admin_sessions` | ✅ | Solo `service_role` | ❌ Bloqueado |

Toda interacción con la BD pasa por **Route Handlers de Next.js** que usan `SUPABASE_SERVICE_ROLE_KEY`.

---

## Triggers

| Trigger | Tabla | Evento | Función |
|---------|-------|--------|---------|
| `trg_residents_updated_at` | `residents` | BEFORE UPDATE | `update_updated_at_column()` |
| `trg_maintenance_requests_updated_at` | `maintenance_requests` | BEFORE UPDATE | `update_updated_at_column()` |

---

## Prisma Schema

El archivo `prisma/schema.prisma` está sincronizado 1:1 con las tablas de Supabase usando `@@map()` para mapear nombres camelCase ↔ snake_case.

**Configuración necesaria en `.env`:**
```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
```

---

## Decisiones Arquitectónicas

1. **Desnormalización en `maintenance_requests`**: 6 campos copiados de `residents` para construir el webhook payload sin JOIN y preservar integridad histórica si el residente cambia de datos.

2. **`ON DELETE RESTRICT` en FK**: No se puede borrar un residente que tenga solicitudes — protege integridad referencial. El flujo correcto es desactivar (`status = inactive`).

3. **`admin_sessions` server-side**: Cookie httpOnly con token — permite invalidación inmediata en logout y expiración a 8 horas.

4. **RLS service_role only**: La `anon_key` no puede leer ninguna tabla. Toda lectura/escritura pasa por el backend con `service_role_key`.

5. **Trigger `updated_at`**: Automático en Postgres — no depende de que la app lo setee correctamente.
