# Silvestre Clinic Manager

Sistema de gestión clínica profesional desarrollado con **Next.js 16 (App Router)**, **Tailwind CSS v4**, **Prisma 6** y **PostgreSQL 15**.

La aplicación está diseñada para servir como demo visual y funcional robusta para presentaciones académicas o profesionales, simulando flujos clínicos completos mediante datos estructurados locales.

---

## Requisitos Previos

- **Docker** y **Docker Compose**
- **Node.js** (opcional, si deseas ejecutar comandos locales)

---

## Instrucciones de Inicio Rápido

### 1. Configurar el archivo `.env`

Copia el archivo de ejemplo o edita el `.env` existente en la raíz con tus credenciales preferidas (el archivo `.env` por defecto ya está configurado con valores listos para usar):

```bash
cp .env.example .env
```

### 2. Levantar el entorno Docker

Ejecuta el siguiente comando en la raíz del proyecto para construir las imágenes e iniciar los contenedores:

```bash
docker compose up --build
```

*Nota: Si tienes problemas de permisos con sockets en Linux, es posible que necesites ejecutarlo con `sudo docker compose up --build`.*

### 3. Ejecutar el Seed (poblado de datos de prueba)

Una vez que los contenedores estén activos, ejecuta el seed para poblar la base de datos con datos de prueba (especialidades, boxes, usuarios, pacientes, citas y facturas):

```bash
docker compose exec nextjs npm run seed
```

> **Importante:** El seed borra todos los datos existentes y los vuelve a crear. Solo ejecútalo si necesitas repoblar la base de datos.

### 4. Acceder a la aplicación

Abre tu navegador e ingresa a:

**[http://localhost:3000](http://localhost:3000)**

### Credenciales por defecto

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `silvestre@clinica.com` | `admin123` |
| Recepcionista | `recepcion@clinica.com` | `recepcion123` |

---

## Conexión a la Base de Datos

Para conectarte a PostgreSQL directamente desde la línea de comandos:

```bash
docker compose exec postgres psql -U user_db -d db_sistema_clinico
```

Comandos útiles de `psql`:

| Comando | Descripción |
|---|---|
| `\dt` | Listar todas las tablas |
| `\d nombre_tabla` | Ver estructura de una tabla |
| `\dt+` | Listar tablas con detalle (tamaño) |
| `\l` | Listar bases de datos |
| `\du` | Listar usuarios |
| `\q` | Salir de psql |

---

## Estructura del Proyecto

```text
sistema-clinico/
├── app/                            # Rutas Next.js (App Router)
│   ├── layout.tsx                  # Layout raíz (Theme + Toast + Auth + DashboardLayout)
│   ├── page.tsx                    # Dashboard principal (server component)
│   ├── globals.css                 # Estilos globales (Vanilla CSS, glassmorphism)
│   ├── login/
│   │   └── page.tsx               # Página de inicio de sesión
│   ├── pacientes/
│   │   ├── page.tsx               # Listado y búsqueda de pacientes
│   │   └── [id]/
│   │       ├── page.tsx           # Detalle del paciente (server)
│   │       ├── PatientDetailClient.tsx
│   │       ├── PatientTabsClient.tsx
│   │       └── not-found.tsx
│   ├── nueva-historia/
│   │   ├── page.tsx               # Formulario de nueva historia clínica
│   │   └── HistoriaForm.tsx
│   ├── atencion/
│   │   ├── page.tsx               # Atención de pacientes (MIS/Kanban)
│   │   └── KanbanAtencion.tsx
│   ├── agenda/
│   │   └── page.tsx               # Calendario y agenda médica
│   ├── facturacion/
│   │   └── page.tsx               # Módulo de facturación
│   ├── medicos/
│   │   ├── page.tsx               # Gestión de médicos
│   │   └── MedicosManager.tsx
│   ├── ejecutivo/
│   │   ├── page.tsx               # Dashboard ejecutivo (EIS)
│   │   └── reportes/
│   │       └── page.tsx           # Reportes
│   ├── configuracion/
│   │   └── page.tsx               # Configuración (usuarios, roles, permisos)
│   ├── actions/                    # Server Actions (todas las operaciones CRUD)
│   │   ├── auth.ts                # Login + getUserById
│   │   ├── pacientes.ts           # CRUD pacientes + búsqueda
│   │   ├── historia.ts            # Crear historia clínica (+ paciente + factura)
│   │   ├── agenda.ts              # Crear/actualizar/reprogramar citas
│   │   ├── dashboard.ts           # KPIs, ocupación de boxes, gráficos, datos ejecutivos
│   │   ├── facturacion.ts         # Registro de pagos, dashboard de facturación
│   │   ├── reportes.ts            # Reportes (citas, historias, financieros)
│   │   ├── usuarios.ts            # CRUD usuarios, roles, permisos
│   │   ├── infraestructura.ts     # CRUD Médico, Box, Especialidad
│   │   └── notificaciones.ts      # Citas próximas + listado de usuarios
│   └── api/
│       ├── users/route.ts         # API REST para usuarios
│       └── comprobante-pago/[id]/route.ts  # Comprobante de pago (binario)
├── components/                     # Componentes React reutilizables
│   ├── AuthProvider.tsx           # Contexto de autenticación (localStorage)
│   ├── AgendaCalendario.tsx       # Calendario de agenda
│   ├── Card.tsx                   # Tarjetas para métricas
│   ├── ClinicalCharts.tsx         # Gráficos SVG interactivos
│   ├── CobrarForm.tsx             # Formulario de cobro
│   ├── DashboardLayout.tsx        # Contenedor principal de la interfaz
│   ├── EditarPacienteForm.tsx     # Formulario de edición de paciente
│   ├── ErrorBoundary.tsx          # Manejo de errores
│   ├── Header.tsx                 # Barra superior
│   ├── NotificationDropdown.tsx   # Dropdown de notificaciones
│   ├── Sidebar.tsx                # Menú de navegación lateral
│   ├── ThemeProvider.tsx          # Proveedor de tema
│   ├── ToastProvider.tsx          # Proveedor de notificaciones toast
│   └── reportes/
│       ├── FiltrosReporte.tsx     # Filtros de reportes
│       └── TablaPrevisualizacion.tsx  # Tabla de previsualización
├── lib/                            # Utilidades compartidas
│   ├── prisma.ts                  # Cliente Prisma singleton
│   ├── password.ts                # Hash/verificación de contraseñas (scrypt)
│   ├── mockData.ts                # Datos mock estáticos (legacy/fallback)
│   └── validations/               # Esquemas de validación Zod
│       ├── pacientes.ts
│       ├── citas.ts
│       ├── historia.ts
│       └── medicos.ts
├── prisma/
│   ├── schema.prisma              # Esquema completo de la base de datos
│   ├── seed.ts                    # Script de seed (datos de prueba)
│   └── migrations/                # Migraciones de Prisma
├── scripts/
│   └── seed-if-empty.js           # Seed condicional (solo para Render)
├── public/                         # Archivos estáticos
├── docker-compose.yml              # Orquestación Docker (Next.js + PostgreSQL)
├── Dockerfile                      # Multi-stage build (builder + runner)
├── entrypoint.sh                   # Entrada del contenedor (generate + migrate + dev)
├── render.yaml                     # Blueprint de despliegue en Render
└── README.md                       # Esta guía
```

---

## Módulos de la Aplicación

### 1. Dashboard Principal (`/`)
- Tarjetas KPI dinámicas: Pacientes Activos, Citas Programadas, Historias Registradas, Eficiencia
- Gráfica de Líneas SVG: Crecimiento mensual de pacientes con tooltips interactivos
- Gráfica de Barras SVG: Distribución de pacientes por especialidad médica
- Tabla de Agenda Médica de Hoy: Citas listadas por hora con badges de estado

### 2. Login (`/login`)
- Formulario de autenticación con email y contraseña
- Almacenamiento de sesión en localStorage
- Redirección automática al dashboard

### 3. Listado de Pacientes (`/pacientes`)
- Barra de búsqueda interactiva: Filtra por nombre, teléfono, correo o ID
- Selectores de filtro: Género y estado clínico
- Acceso directo a la ficha del paciente

### 4. Detalle de Paciente (`/pacientes/[id]`)
- Ficha de perfil con datos de contacto, alergias y antecedentes
- Línea de tiempo vertical con historial de consultas
- Detalle de recetas, diagnósticos y signos vitales

### 5. Nueva Historia Clínica (`/nueva-historia`)
- Formulario dividido en: ficha demográfica, signos vitales, detalle de consulta
- Búsqueda/carga de paciente existente o creación de nuevo
- Creación automática de paciente, cita y factura

### 6. Atención de Pacientes (`/atencion`)
- Vista Kanban con columnas por estado de cita (Programada, En Curso, Pendiente Pago, Completada)
- Gestión del flujo de atención médica

### 7. Agenda (`/agenda`)
- Calendario visual de citas médicas
- Creación, edición y reprogramación de citas

### 8. Facturación (`/facturacion`)
- Registro de pagos con múltiples métodos (Efectivo, Tarjeta, Transferencia, Yape, Plin)
- Dashboard de estado de facturas
- Generación de comprobantes de pago

### 9. Gestión de Médicos (`/medicos`)
- CRUD de médicos con especialidades
- Asignación de boxes

### 10. Dashboard Ejecutivo (`/ejecutivo`)
- Métricas ejecutivas y KPIs de negocio
- Reportes exportables (`/ejecutivo/reportes`)

### 11. Configuración (`/configuracion`)
- Gestión de usuarios y roles (Admin, Doctor, Recepcionista)
- Asignación de permisos por módulo

---

## Esquema de Base de Datos

El esquema completo se encuentra en `prisma/schema.prisma`. Modelos principales:

| Modelo | Descripción |
|---|---|
| **Especialidad** | Especialidades médicas con precio base |
| **User** | Usuarios del sistema con roles (Admin, Doctor, Recepcionista) |
| **RolePermission** | Permisos de acceso por rol y módulo |
| **Medico** | Datos médicos vinculados a un usuario |
| **MedicoEspecialidad** | Relación N:M médico-especialidad |
| **Box** | Boxes médicos por especialidad |
| **Paciente** | Datos demográficos, alergias y antecedentes |
| **HistoriaClinica** | Entradas médicas vinculadas a paciente, médico y box |
| **Cita** | Citas médicas con estado y programación |
| **Factura** | Facturación vinculada a citas con datos de pago |

---

## Comandos Útiles

```bash
# Levantar el entorno
docker compose up --build

# Ejecutar el seed
docker compose exec nextjs npm run seed

# Conectarse a PostgreSQL
docker compose exec postgres psql -U user_db -d db_sistema_clinico

# Ver logs de Next.js
docker compose logs -f nextjs

# Ver logs de PostgreSQL
docker compose logs -f postgres

# Reiniciar un servicio específico
docker compose restart nextjs

# Detener todo
docker compose down

# Detener y eliminar volúmenes (borra la BD)
docker compose down -v
```

---

## Despliegue en Render

El proyecto incluye un `render.yaml` como blueprint para despliegue en Render.com. El seed se ejecuta automáticamente solo si la tabla `User` está vacía (usando `scripts/seed-if-empty.js`).
