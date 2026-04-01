<h1 align="center">
  🥩 MeatMetrics
</h1>

<p align="center">
  <strong>Motor de Ingesta, Normalización y Reporte de Incidencias de Planta</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0--stable-red?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/stack-React%20%2B%20TypeScript%20%2B%20Vite-blue?style=flat-square" alt="Stack" />
  <img src="https://img.shields.io/badge/backend-Supabase-green?style=flat-square" alt="Supabase" />
  <img src="https://img.shields.io/badge/estado-V1.0%20Functional-brightgreen?style=flat-square" alt="Estado" />
</p>

---

## ¿Qué es MeatMetrics?

**MeatMetrics** es un dashboard operacional diseñado para plantas de procesado cárnico. Su objetivo es **eliminar el caos de los Excels manuales** y centralizar en un solo lugar toda la información de incidencias, averías y rendimiento de producción, permitiendo a gerencia tomar decisiones basadas en datos reales.

---

## 🎯 Funcionalidades Principales (V1.0)

### 📥 Motor de Absorción (`absorptionEngine` + `normalizer`)
El corazón de la aplicación. Acepta archivos Excel `.xlsx` y `.csv` en bruto (tal como los genera el sistema de planta, sin necesidad de preprocesado manual) y los convierte en registros limpios y estructurados.

- **Detección automática de formato**: Distingue entre tres tipos de archivos:
  - **TIPO A** — Informe semanal de averías (encabezados en fila 9-12, fecha base en cabecera).
  - **TIPO B** — Control de producción diario (fecha inferida del nombre del archivo, minutos extraídos de texto libre por Regex).
  - **TIPO C** — Modelo profesional en formato tabla Markdown embebida.
- **Resiliente a datos sucios**: Si una fila no tiene minutos especificados o está incompleta, el sistema la registra con `0 min` y emite un warning en consola, **sin romper el proceso**.
- **Drag & Drop masivo**: Gracias a `react-dropzone`, el usuario puede arrastrar una carpeta completa con 50 archivos y el sistema los procesa en paralelo.

### 📊 Vista "Espejo" y ReportGenerator
Tras la ingesta, los datos se presentan en una tabla editable que **replica exactamente el formato oficial** requerido por dirección:

| Columna | Detalle |
|---|---|
| Fecha / Turno | Extraídos automáticamente del archivo |
| Tipo de Incidencia | Desplegable: Mecánica / Eléctrica / Pausa / Otros |
| Inicio / Fin Paro | Campos de tiempo editables manualmente |
| Rendimiento (%) | Calculado automáticamente. **Rojo** si < 80% |
| Estatus | Desplegable: ✅ Resuelto / ⚠️ Pendiente / 🔴 Crítico |

### 📤 Exportación a Excel Profesional
Un clic genera un `.xlsx` con:
- Título, cabeceras corporativas y anchos de columna optimizados.
- Marcador visual `⚠️` en filas con rendimiento crítico (< 80%).
- Fila de totales automática (minutos perdidos + rendimiento medio).

### 📈 Dashboard Ejecutivo *(datos reales en V2.0)*
Actualmente muestra KPIs de muestra. En la siguiente versión estará conectado a **Supabase** con datos reales.

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Estilos | Tailwind CSS v4 |
| Iconos | Lucide React |
| Drag & Drop | react-dropzone |
| Lectura Excel | SheetJS (xlsx) |
| Exportación Excel | SheetJS (xlsx) |
| Routing | React Router DOM v7 |
| Backend (V2) | Supabase (PostgreSQL + Auth + RLS) |

---

## 🚀 Instalación Local

```bash
# 1. Clona el repositorio
git clone https://github.com/TU_USUARIO/MeatMetricsApp.git
cd MeatMetricsApp

# 2. Instala dependencias
npm install

# 3. Configura las variables de entorno
cp .env.example .env.local
# → Edita .env.local con tus credenciales de Supabase

# 4. Arranca el servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:3000`.

---

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── Dashboard/          # KPICard, ChartsArea, Dashboard
│   ├── Import/             # DropzoneArea, UploadHistory, RecordsTable, Import
│   ├── Layout/             # Layout principal con sidebar
│   ├── Registry/           # Registro maestro de incidencias
│   └── Report/             # ReportGenerator (Vista Espejo + Export)
├── lib/
│   ├── absorptionEngine.ts # Lee archivos con SheetJS → JSON crudo
│   ├── normalizer.ts       # Normaliza JSON → MeatMetricsLog[]
│   ├── excelExporter.ts    # Genera el .xlsx oficial para descarga
│   ├── types.ts            # Interfaces TypeScript compartidas
│   └── utils.ts            # Utilidades (cn, etc.)
└── main.tsx
```

---

## 🔮 Roadmap

- [x] Motor de Absorción (TIPO A, B, C)
- [x] Vista Espejo + Exportación Excel
- [x] Drag & Drop masivo con react-dropzone
- [ ] **V2.0**: Integración Supabase + Persistencia en nube
- [ ] **V2.0**: Autenticación y roles (Admin / Management / User)
- [ ] **V2.0**: Dashboard conectado a datos reales con Recharts
- [ ] **V2.0**: Notificaciones de incidencias críticas

---

## 🔒 Seguridad

- Las variables de entorno (`.env.local`) están en `.gitignore` y **nunca se suben al repositorio**.
- Los archivos de muestra de la empresa (`archivos_de_muestra/`) están excluidos del control de versiones.
- En V2.0, Supabase Row Level Security (RLS) garantizará que cada rol solo accede a sus propios datos.

---

## 📄 Licencia

Proyecto privado — © 2026 TBF Apps. Todos los derechos reservados.
