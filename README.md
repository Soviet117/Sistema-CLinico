# MediHist - Sistema de Gestión de Historias Clínicas y Dashboard Médico

Este proyecto es la estructura base y maqueta visual interactiva de un **Sistema de Gestión Clínica** desarrollado con **Next.js (App Router)**, **Vanilla CSS** para diseño premium responsivo, **Prisma** como ORM y **PostgreSQL** dentro de contenedores **Docker**.

La aplicación está diseñada para servir como demo visual y funcional robusta para presentaciones académicas o profesionales, simulando flujos clínicos completos mediante datos estructurados locales.

---

## Requisitos Previos

Asegúrate de tener instalados los siguientes componentes en tu sistema:
- **Docker** y **Docker Compose**
- **Node.js** (opcional, si deseas ejecutar comandos locales)

---

## Instrucciones de Inicio Rápido

Para levantar la base de datos PostgreSQL y el servidor de desarrollo de Next.js de manera local mediante Docker:

1. **Configurar el archivo `.env`**
   Copia el archivo de ejemplo o edita el `.env` existente en la raíz con tus credenciales preferidas (el archivo `.env` por defecto ya está configurado con valores listos para usar):
   ```bash
   cp .env.example .env
   ```

2. **Levantar el entorno Docker**
   Ejecuta el siguiente comando en la raíz del proyecto para construir las imágenes e iniciar los contenedores:
   ```bash
   docker-compose up --build
   ```
   *Nota: Si tienes problemas de permisos con sockets en Linux, es posible que necesites ejecutarlo con `sudo docker-compose up --build`.*

3. **Acceder a la aplicación**
   Una vez que el contenedor de Next.js esté activo, abre tu navegador e ingresa a:
   **[http://localhost:3000](http://localhost:3000)**

4. **Ver la Base de Datos (Prisma Studio)**
   Para visualizar las tablas configuradas en PostgreSQL, puedes ejecutar Prisma Studio localmente (requiere `npm install` local):
   ```bash
   npx prisma studio
   ```

---

## Estructura del Proyecto Entregado

La organización de carpetas del proyecto es la siguiente:

```text
Sistema-CLinico/
├── app/                        # Rutas de Next.js (App Router)
│   ├── api/                    # APIs de prueba preexistentes
│   ├── pacientes/              # Módulo de Pacientes
│   │   ├── page.tsx            # Vista: Listado y búsqueda de pacientes
│   │   └── [id]/               # Ficha de Paciente
│   │       └── page.tsx        # Vista: Detalle e historia clínica interactiva
│   ├── nueva-historia/         # Módulo de Formulario
│   │   └── page.tsx            # Vista: Formulario de nueva consulta/ficha médica
│   ├── globals.css             # Estilos de diseño clínico premium (Vanilla CSS)
│   ├── layout.tsx              # Layout Next.js con metadatos y layout estructurado
│   └── page.tsx                # Vista: Dashboard Principal (KPIs y Agenda)
├── components/                 # Componentes React reutilizables
│   ├── Card.tsx                # Tarjetas para métricas y contenedores
│   ├── ClinicalCharts.tsx      # Gráficos SVG interactivos nativos (Líneas y Barras)
│   ├── DashboardLayout.tsx     # Contenedor principal de la interfaz
│   ├── Header.tsx              # Barra superior con buscador y perfil
│   └── Sidebar.tsx             # Menú de navegación lateral responsivo
├── lib/
│   ├── mockData.ts             # Base de datos ficticia estructurada para simulación
│   └── prisma.ts               # Cliente global de Prisma
├── prisma/
│   └── schema.prisma           # Esquema de base de datos clínico preparado
├── Dockerfile                  # Receta de construcción de la imagen de desarrollo
├── docker-compose.yml          # Orquestación de Next.js y PostgreSQL
└── README.md                   # Esta guía
```

---

## Módulos Visuales Incluidos

1. **Dashboard Principal (`/`)**:
   - Tarjetas KPI dinámicas: Pacientes Activos, Citas Programadas, Historias Registradas, Eficiencia.
   - Gráfica de Líneas SVG: Crecimiento mensual de pacientes con tooltips informativos interactivos.
   - Gráfica de Barras SVG: Distribución de pacientes por especialidad médica.
   - Tabla de Agenda Médica de Hoy: Citas listadas por hora con badges de estado y acciones demostrativas.
   
2. **Listado de Pacientes (`/pacientes`)**:
   - Barra de búsqueda interactiva: Filtra al instante por nombre, teléfono, correo o ID.
   - Selectores de filtro avanzados: Permiten depurar la tabla según el género o el estado clínico del paciente (Estable, En Observación, Crítico).
   - Acciones: Acceso directo a la ficha del paciente ("Ver Historia").

3. **Nueva Historia Clínica (`/nueva-historia`)**:
   - Formulario médico profesional dividido en:
     - Ficha demográfica del paciente (permite buscar/cargar un paciente existente o rellenar campos para uno nuevo).
     - Signos vitales (Presión arterial, pulso, temperatura, peso).
     - Detalle de la consulta (motivo, síntomas, diagnóstico clínico y plan de tratamiento).
   - Botón de guardado funcional que emite alertas demostrativas e interactúa con los parámetros de la URL.

4. **Detalle e Historia Clínica (`/pacientes/[id]`)**:
   - Ficha de perfil resumida con detalles de contacto, alergias en color de alerta y antecedentes médicos del paciente seleccionado.
   - Línea de tiempo (Timeline) vertical interactiva que lista las consultas anteriores, ordenadas de más reciente a más antigua.
   - Detalle de recetas, diagnósticos y signos vitales históricos de cada consulta del paciente.

---

## Características de Diseño (Vanilla CSS)

- **Aesthetics Premium**: Uso de una paleta de color curada en base a azules cielo, grises suaves y verdes médicos.
- **Glassmorphism**: Efectos de desenfoque (`backdrop-filter`) y sombras suaves (`box-shadow`) en el Sidebar y Header.
- **Micro-animaciones**: Transiciones de escala en los botones, hover dinámico en las filas de las tablas y barras del gráfico.
- **Responsividad Completa**: Grid CSS y Media Queries para adaptar la interfaz a dispositivos móviles, tablets y monitores de escritorio.
- **Compatibilidad**: Gráficos desarrollados en SVG puro dentro de React para garantizar compatibilidad total con **React 19 / SSR de Next.js**, eliminando problemas de desajuste de hidratación.

---

## Esquema de Base de Datos (`schema.prisma`)

El esquema de la base de datos se encuentra listo para el momento en el que se decida conectar con la lógica real. Contiene los siguientes modelos vinculados:
- **Paciente**: Almacena datos demográficos, alergias y antecedentes.
- **HistoriaClinica**: Registra cada entrada médica vinculada a un paciente.
- **Cita**: Administra el cronograma y estado de atenciones del paciente.
- **User**: Control de usuarios básicos.
