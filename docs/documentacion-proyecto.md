# Documentación completa del proyecto — DYGSIS

**Sistema de Información de Evaluación Docente Institucional Adaptable**
**Equipo:** Ingenieros Malas Influencias · **Docente:** Mondragón Vázquez Georgina Wendy
**Duración:** 9 sprints quincenales · 17 semanas (21-ago-2026 al 18-dic-2026)

> Este documento consolida la documentación formal del proyecto (equipo, stack, backlog, planeación de recursos y presupuesto) en un solo lugar, con el mismo nivel de detalle que `documentacion.pdf` (el plan Scrum original cargado en Jira), más las secciones de recursos que no estaban cubiertas ahí. Para el detalle técnico de cada tema, este documento enlaza al archivo correspondiente en `docs/` en vez de repetirlo — así no hay dos fuentes de verdad desincronizándose.

---

## 1. Resumen ejecutivo

Sistema web que gestiona la evaluación de docentes por parte de estudiantes, mediante **instrumentos de evaluación configurables** (un coordinador arma secciones, preguntas y escalas de respuesta sin tocar la base de datos). Incluye seguimiento de avance, notificaciones automáticas, indicadores históricos por docente, evaluación de talleres/laboratorios, estadísticas institucionales y reportes en PDF.

Roles del sistema: **Administrador, Coordinador, Docente, Estudiante**.

## 2. Equipo del proyecto

| Integrante | Rol fijo | Responsabilidad principal |
|---|---|---|
| Sánchez Jiménez Juan Antonio | Integrante 1 — Backend & lógica de negocio | API REST, autenticación, reglas de negocio, integración con la base de datos |
| Nieto Guerra Óscar Emiliano | Integrante 2 — Frontend & UI | Interfaces para los 4 roles, responsividad |
| Ochoa Contreras Amoxhua | Integrante 3 — Base de datos, reportes e indicadores | Modelo físico en SQL Server, consultas agregadas, estadísticas, reportes |
| Mondragón Chávez Mauricio | Integrante 4 — QA, documentación & Scrum Master | Jira, pruebas funcionales, UML/DER, manuales, presentación |

## 3. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS v4 + shadcn/ui, Vite |
| Backend | Node.js + Express + TypeScript, arquitectura por capas |
| Base de datos | PostgreSQL (Supabase, proyecto propio, plan Free) + TypeORM |
| Autenticación | JWT + bcrypt, sesiones persistentes en tabla |
| Correo | Nodemailer (Gmail SMTP) |
| Reportes | Puppeteer / pdfmake (planeado, Sprint 6) |
| Gráficos | Recharts (planeado, Sprint 5) |
| Gestión | Jira (Atlassian) |
| Despliegue | Render (backend) + Vercel (frontend), auto-deploy desde GitHub |

## 4. Backlog de épicas

| Código | Épica | Requerimiento(s) |
|---|---|---|
| EP0 | Gestión de proyecto y documentación base | Análisis, UML, DER, backlog |
| EP1 | Autenticación y gestión de usuarios | RF01 |
| EP2 | Evaluación docente | RF02, RF03 |
| EP3 | Seguimiento de avance | RF04 |
| EP4 | Notificaciones automáticas | RF05 |
| EP5 | Coordinación académica | RF06 (parcial) |
| EP6 | Indicadores docentes e históricos | RF07 |
| EP7 | Talleres y laboratorios | RF08 |
| EP8 | Estadísticas y dashboard institucional | RF06 |
| EP9 | Reportes en PDF | Reportes requeridos (5) |
| EP10 | Seguridad y no funcionales | Seguridad, rendimiento, disponibilidad |
| EP11 | QA, despliegue y cierre | Estabilización y entrega final |

Detalle completo de requerimientos: [`docs/requerimientos.md`](requerimientos.md). Casos de uso por rol: [`docs/casos_de_uso.md`](casos_de_uso.md).

## 5. Plan de sprints

| Sprint | Fechas | Entrega |
|---|---|---|
| S0 — Fundamentos y planeación | 21 ago – 30 ago | — |
| S1 — Autenticación y base de datos | 31 ago – 13 sep | — |
| S2 — Evaluación docente y seguimiento | 14 sep – 25 sep | **Prototipo 1** (25-sep) |
| S3 — Coordinación académica y notificaciones | 28 sep – 9 oct | — |
| S4 — Indicadores docentes e históricos | 12 oct – 23 oct | — |
| S5 — Talleres/laboratorios y estadísticas | 26 oct – 6 nov | **Prototipo 2** (6-nov) |
| S6 — Reportes en PDF y seguridad | 9 nov – 20 nov | — |
| S7 — Estabilización, QA y despliegue | 23 nov – 4 dic | — |
| S8 — Cierre, documentación y presentación | 7 dic – 18 dic | **Entrega final** (11 y 18-dic) |

Estado actual de cada tarea (checklist con "qué se hizo / cómo se hizo"): [`PROGRESS.md`](../PROGRESS.md) en la raíz del repo.

## 6. Trazabilidad con la rúbrica de evaluación (100 pts)

| Criterio | Pts | Sprint(s) |
|---|---|---|
| Análisis del problema | 10 | S0 |
| Levantamiento de requerimientos | 10 | S0 |
| Modelo de datos | 10 | S0–S1 |
| Casos de uso | 10 | S0 |
| Diseño de base de datos | 10 | S1 |
| Diseño de interfaz | 10 | S0–S2 |
| Desarrollo del sistema | 15 | S1–S7 |
| Reportes e indicadores | 10 | S4, S6 |
| Seguridad y roles | 5 | S1, S6 |
| Presentación y documentación | 10 | S8 |

---

## 7. Planeación y gestión de recursos

> Sección agregada el 18-sep-2026, no estaba en el documento original. Cubre qué recursos necesita el proyecto, cuándo se necesitan, y cuánto costarían si el trabajo se pagara como un desarrollo profesional — **es un ejercicio de planeación con fines de documentación académica, no un pago real**: nadie del equipo cobra por este proyecto escolar. Las tarifas usadas son de mercado para un desarrollador junior/freelance en México (2026) y son un supuesto de partida — ajústenlas si su rúbrica pide otros valores.

### 7.1 Recursos Materiales

Insumos físicos necesarios para ejecutar el proyecto. Todo el equipo ya lo posee (no implica compra nueva) — el costo mostrado es la **depreciación/uso proporcional** durante los 4 meses del proyecto, no el precio de compra completo.

| Recurso | Cantidad | Valor de referencia | Vida útil / uso | Costo atribuido al proyecto |
|---|---|---|---|---|
| Laptop personal (por integrante) | 4 | $15,000 MXN c/u | 36 meses, usada 4 meses en el proyecto | $1,666.67 c/u → **$6,666.68** |
| Conexión a internet (hogar, compartida con otras actividades) | 4 | $150 MXN/mes por persona (prorrateado) | 4 meses | $150 × 4 × 4 = **$2,400.00** |
| Insumos de oficina (impresión de documentación, libretas, etc.) | 1 lote | — | Todo el proyecto | **$500.00** |
| **Total Recursos Materiales** | | | | **$9,566.68 MXN** |

### 7.2 Recursos Tecnológicos

Hardware, software y plataformas de apoyo. La mayoría del stack elegido es **gratuito** (ver `docs/despliegue.md`) — es una decisión de diseño, no una casualidad: se evitó cualquier servicio de pago mientras el proyecto es un prototipo escolar.

| Recurso | Proveedor | Uso | Costo mensual | Costo del proyecto (4 meses) |
|---|---|---|---|---|
| Base de datos PostgreSQL | Supabase (proyecto propio, plan Free) | Almacenamiento de toda la información | $0 | $0 |
| Hosting backend | Render (plan Free) | API en producción | $0 | $0 |
| Hosting frontend | Vercel (plan Free/Hobby) | Frontend en producción | $0 | $0 |
| Control de versiones | GitHub | Repositorio, historial, backup | $0 | $0 |
| Gestión de proyecto | Jira (Atlassian, plan Free) | Backlog, sprints, tablero | $0 | $0 |
| Correo saliente | Gmail SMTP (cuenta existente) | Recuperación de contraseña, notificaciones | $0 | $0 |
| Entorno de desarrollo | Node.js, TypeScript, VS Code, npm (open source) | Desarrollo del sistema | $0 | $0 |
| Dominio propio | — (no contratado; se usa `*.vercel.app` / `*.onrender.com`) | — | $0 | $0 *(opcional a futuro: ~$250 MXN/año)* |
| **Total Recursos Tecnológicos** | | | | **$0.00 MXN** |

### 7.3 Recursos Humanos (base del cálculo financiero)

Dedicación estimada: **8 horas/semana por integrante** (proyecto de tiempo parcial, compatible con la carga de clases), durante las 17 semanas del proyecto = **136 horas por persona**.

| Integrante | Rol | Tarifa/hora (mercado junior, MXN) | Horas estimadas | Costo estimado |
|---|---|---|---|---|
| Juan Antonio Sánchez Jiménez | Backend & lógica de negocio | $180 | 136 | $24,480.00 |
| Óscar Emiliano Nieto Guerra | Frontend & UI | $160 | 136 | $21,760.00 |
| Amoxhua Ochoa Contreras | Base de datos, reportes e indicadores | $180 | 136 | $24,480.00 |
| Mauricio Mondragón Chávez | QA, documentación & Scrum Master | $150 | 136 | $20,400.00 |
| **Total Recursos Humanos** | | | **544 h** | **$91,120.00 MXN** |

*Docente/asesor: sin costo adicional — la asesoría del proyecto es parte de la carga académica de la materia, no un servicio contratado.*

### 7.4 Recursos Financieros (presupuesto consolidado)

Presupuesto disponible/estimado para cubrir los gastos del proyecto, integrando las tres categorías anteriores más un margen de contingencia.

| Concepto | Monto (MXN) |
|---|---|
| Recursos Humanos (§7.3) | $91,120.00 |
| Recursos Materiales (§7.1) | $9,566.68 |
| Recursos Tecnológicos (§7.2) | $0.00 |
| **Subtotal** | **$100,686.68** |
| Contingencia (10% — imprevistos, retrabajo, extensión de sprint) | $10,068.67 |
| **Presupuesto total estimado del proyecto** | **$110,755.35 MXN** |

> De nuevo: esto es un presupuesto **hipotético** para fines de documentación — el equipo no maneja realmente este dinero. Sirve para dimensionar el proyecto como si fuera un desarrollo profesional real, que es justo lo que pide esta sección.

### 7.5 Planeación de Recursos

Qué recursos se necesitan y en qué momento del proyecto, alineado al plan de sprints (§5):

| Sprint | Fechas | Recursos clave que se activan en ese sprint |
|---|---|---|
| S0 | 21 ago – 30 ago | Horas de los 4 integrantes (análisis/planeación), cuentas de Jira y GitHub, laptops personales |
| S1 | 31 ago – 13 sep | Servidor SQL Server (Azure), horas de Integrante 1 y 3, cuenta de correo (Gmail SMTP), generación de `JWT_SECRET` |
| S2 | 14 sep – 25 sep | Horas de los 4 integrantes — sin recursos tecnológicos nuevos |
| S3 | 28 sep – 9 oct | Servicio de correos automáticos (mismo SMTP ya contratado), horas del equipo |
| S4 | 12 oct – 23 oct | Horas del equipo — sin recursos nuevos |
| S5 | 26 oct – 6 nov | Librería de gráficos (Recharts, open source), horas del equipo |
| S6 | 9 nov – 20 nov | Librería de generación de PDF (Puppeteer/pdfmake, open source), horas del equipo |
| S7 | 23 nov – 4 dic | Infraestructura de despliegue ya contratada (Render + Vercel, ver §7.2), horas extra de QA (Integrante 4) |
| S8 | 7 dic – 18 dic | Horas de documentación y ensayo de presentación, posible impresión de la documentación final |

**Regla de planeación aplicada:** ningún recurso tecnológico se contrata por adelantado — cada uno se activa en el sprint donde realmente se usa por primera vez (ej. Recharts no se instala hasta S5), evitando gasto/complejidad innecesaria mientras el proyecto sigue siendo un prototipo académico.

---

## 8. Documentación relacionada

| Documento | Contenido |
|---|---|
| [`docs/requerimientos.md`](requerimientos.md) | Requerimientos funcionales (RF01–RF09) y no funcionales (RNF01–RNF08) |
| [`docs/casos_de_uso.md`](casos_de_uso.md) | Diagramas de casos de uso UML por rol |
| [`docs/wireframes.md`](wireframes.md) | Wireframes de pantallas clave |
| [`docs/seguridad-checklist.md`](seguridad-checklist.md) | Checklist de seguridad del módulo de autenticación |
| [`docs/pruebas-autenticacion.md`](pruebas-autenticacion.md) | Qué cubre la suite de pruebas automatizadas |
| [`docs/convenciones-desarrollo.md`](convenciones-desarrollo.md) | Convención de ramas, commits y ambiente compartido |
| [`docs/despliegue.md`](despliegue.md) | Guía de despliegue en Render + Vercel |
| [`docs/demo-sprint1.md`](demo-sprint1.md) | Guion de demo interna del Sprint 1 |
| [`PROGRESS.md`](../PROGRESS.md) | Checklist de progreso de todas las tareas del backlog |
| `documentacion.pdf` (raíz del repo) | Documento original del plan Scrum cargado a Jira |
