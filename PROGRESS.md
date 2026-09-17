# Progreso del proyecto — DYGSIS (Sistema de Información de Evaluación Docente Adaptable)

> Equipo: Ingenieros Malas Influencias · Jira: proyecto **SCRUM** · Última sincronización con Jira: **17-sep-2026**

---

## ⚠️ INSTRUCCIÓN OBLIGATORIA — LEER ANTES DE TRABAJAR

**Esta regla aplica a cualquier persona del equipo, y a cualquier Claude Code (u otro asistente) que trabaje sobre este repositorio:**

1. Antes de empezar una tarea, revisa este archivo para saber qué está hecho, qué está en curso y qué sigue pendiente.
2. **En cuanto termines una tarea, es obligatorio actualizar este mismo archivo antes de darla por cerrada:**
   - Marca la casilla como completada: `- [ ]` → `- [x]`.
   - Llena las dos secciones obligatorias debajo del ítem: **Qué se hizo** y **Cómo se hizo** (ver el formato en las tareas de SCRUM-24 a SCRUM-27 más abajo — úsalas como plantilla).
   - Agrega quién lo hizo y la fecha.
   - Si generaste código, indica el commit o PR de GitHub. Si tocaste la base de datos, indica qué tablas/migración.
3. No se considera una tarea terminada si Jira está en "Finalizado" pero este archivo no se actualizó. Este archivo es la fuente de contexto legible para el equipo y para cualquier IA que retome el trabajo — Jira dice *qué* está listo, este archivo dice *cómo* se hizo.
4. Si la tarea la retoma o continúa alguien más (o su propia sesión de Claude Code), **actualiza también Jira y GitHub** al terminar, igual que aquí — los tres deben quedar consistentes.

---

## Equipo (roles fijos)

| Integrante | Nombre en Jira | Área |
|---|---|---|
| Integrante 1 | Sánchez Jiménez Juan Antonio | Backend & lógica de negocio |
| Integrante 2 | Nieto Guerra Óscar Emiliano | Frontend & UI |
| Integrante 3 | Ochoa Contreras Amoxhua | Base de datos, reportes e indicadores |
| Integrante 4 | Mondragón Chávez Mauricio | QA, documentación & Scrum Master |

## Épicas (EP0–EP11)

EP0 Gestión de proyecto y documentación · EP1 Autenticación y usuarios · EP2 Evaluación docente · EP3 Seguimiento de avance · EP4 Notificaciones automáticas · EP5 Coordinación académica · EP6 Indicadores docentes e históricos · EP7 Talleres y laboratorios · EP8 Estadísticas y dashboard institucional · EP9 Reportes en PDF · EP10 Seguridad y no funcionales · EP11 QA, despliegue y cierre

---

## SPRINT 0 — Fundamentos y planeación (21 ago – 30 ago)

- [x] **SCRUM-17** — Crear proyecto Scrum en Jira, configurar épicas y backlog inicial (Responsable: Mauricio Mondragón)
  - Completada antes de iniciar este seguimiento con Claude Code — sin detalle de implementación registrado aquí. Si tienes contexto de cómo se hizo, agrégalo.
- [x] **SCRUM-18** — Formalizar documento de requerimientos funcionales y no funcionales (Responsable: Mauricio Mondragón)
  - **Qué se hizo:** Jira ya estaba marcado como Finalizado pero no existía ningún documento en el repo — se detectó el hueco (17-sep) y se formalizó el documento de RF/RNF que faltaba.
  - **Cómo se hizo:** se extrajeron los RF01–RF09 y los no funcionales directamente de las épicas y tareas ya cargadas en `documentacion.pdf`/Jira (no se inventó alcance nuevo, solo se formalizó lo que ya estaba repartido en tareas) en una tabla trazable por épica.
  - Archivo: `docs/requerimientos.md`.
- [x] **SCRUM-19** — Definir stack tecnológico definitivo y crear repositorios (frontend / backend) (Responsable: Todos)
  - Completada antes de iniciar este seguimiento. Nota: en la práctica se decidió **un solo repositorio** (`Ingenieros_Malas_Influencias`, monorepo con carpetas `backend/` y `database/`) en vez de repos separados — ver decisión registrada en SCRUM-25.
- [x] **SCRUM-20** — Diagrama entidad-relación conceptual + borrador de modelo físico en SQL Server (Responsable: Amoxhua Ochoa)
  - **Qué se hizo:** DER conceptual (20 entidades) y borrador de script T-SQL.
  - **Cómo se hizo:** entregado como `SCRUM20_der.zip` en GitHub (`der_conceptual.png/.mmd`, `modelo_datos.md`, `modelo_fisico_sqlserver.sql`). Este borrador fue la base de SCRUM-24, pero los nombres de tabla/constraints cambiaron al implementarse de verdad (ver SCRUM-24) — el zip quedó como referencia histórica, el script real vive en `database/evaluacion_docente_schema.sql`.
- [x] **SCRUM-21** — Diagramas de casos de uso (UML) para los 4 roles de usuario (Responsable: Juan Antonio)
  - **Qué se hizo:** mismo caso que SCRUM-18 — estaba Finalizado en Jira sin evidencia en el repo. Se generaron los 4 diagramas de casos de uso (Estudiante, Docente, Coordinador, Administrador) más una vista general, cada caso de uso trazado al RF/RNF correspondiente.
  - **Cómo se hizo:** diagramas en formato Mermaid dentro de un `.md` (GitHub los renderiza nativamente, no requieren herramienta externa ni imagen adjunta). Los casos de uso por rol se derivaron de las pantallas/APIs ya definidas en el backlog de sprints (ej. "Panel de administración de usuarios" → caso de uso de Administrador).
  - Archivo: `docs/casos_de_uso.md`.
- [x] **SCRUM-22** — Wireframes de pantallas clave (login, dashboard alumno, dashboard coordinación) (Responsable: Nieto Guerra Emiliano)
  - **Qué se hizo:** wireframes de baja fidelidad para las 3 pantallas — login (documentando lo ya construido en SCRUM-29), dashboard de alumno y dashboard de coordinación (ambos aún por construir).
  - **Cómo se hizo:** diagramas de caja en ASCII dentro de un `.md` (sin herramienta externa), cada elemento trazado a su RF/caso de uso en `docs/requerimientos.md`/`docs/casos_de_uso.md`, para que quien construya la pantalla real no pierda ningún requerimiento en el camino. Explícitamente marcados como referencia de contenido, no de diseño final — Nieto Guerra Emiliano define la dirección visual real.
  - Archivo: `docs/wireframes.md`.

- [x] **SCRUM-23** — Definir convención de ramas, commits y ambiente de desarrollo compartido (Responsable: Todos)
  - **Qué se hizo:** se formalizó por escrito la convención que ya se venía siguiendo de facto en todos los commits de este repo (Conventional Commits en español + referencia a SCRUM-XX), más el modelo de ramas (trabajo directo en `main` para cambios chicos, rama `feature/SCRUM-XX-...` + PR para cambios grandes) y la guía de ambiente compartido (Node 24, credenciales vía `.env`, cómo levantar backend+frontend juntos).
  - **Cómo se hizo:** `docs/convenciones-desarrollo.md`. Se aprovechó para agregar `backend/README.md`, que no existía (el frontend ya tenía el suyo desde SCRUM-28).
  - Archivos: `docs/convenciones-desarrollo.md`, `backend/README.md`.

---

## SPRINT 1 — Cimientos técnicos: autenticación y base de datos (31 ago – 13 sep)

- [x] **SCRUM-24** — Crear base de datos en SQL Server e implementar modelo físico completo (Responsable: Amoxhua Ochoa)
  - **Qué se hizo:** las 20 tablas del modelo de datos (estructura académica, usuarios/roles, grupos/inscripción, instrumentos de evaluación adaptables, aplicación de evaluaciones y resultados agregados), creadas y verificadas en el servidor real, con catálogos semilla (`Rol`, `TipoPregunta`) poblados.
  - **Cómo se hizo:** servidor Azure SQL compartido `muwigara01.database.windows.net`, base `Central-Data` (comparte servidor con otros proyectos escolares, ej. Ferretería). Como es una base compartida, todas las tablas se prefijaron `dbo.P_EvaluacionDocente_<Tabla>` y los constraints siguen la convención en minúsculas `pk_/fk_/uq_/ck_/ix_` ya usada por el otro equipo en esa misma base — ver reglas completas en `database/evaluacion_docente_schema.sql` (comentario de cabecera). Ejecutado con `sqlcmd` directo contra el servidor y verificado contando tablas y filas.
  - Commit: `94adb78`. Migración base: `database/evaluacion_docente_schema.sql`.

- [x] **SCRUM-25** — Configurar proyecto backend (Express/TS), conexión a SQL Server y arquitectura por capas (Responsable: Juan Antonio)
  - **Qué se hizo:** esqueleto de backend Node.js + Express + TypeScript, conectado a `Central-Data`, con arquitectura por capas.
  - **Cómo se hizo:** carpeta `backend/` dentro del mismo repo (monorepo — no se crearon repos separados pese a SCRUM-19). Capas: `entities → repositories → services → controllers → routes`, usando TypeORM (driver `mssql`) para mapear las tablas `P_EvaluacionDocente_*` de SCRUM-24. Se agregó `GET /api/health` y `GET /api/roles` como prueba de vida, probados end-to-end contra el servidor real. Credenciales solo en `backend/.env` (gitignored), `.env.example` como plantilla sin valores.
  - Commit: `e4b4443`.

- [x] **SCRUM-26** — Endpoint de login por número de cuenta + emisión de JWT (Responsable: Juan Antonio)
  - **Qué se hizo:** `POST /api/auth/login` — recibe matrícula (estudiante) o número de empleado (docente) + password, valida con bcrypt y devuelve un JWT con los roles del usuario. Además (a petición del equipo, decisión tomada después de terminar la primera versión) se agregó **persistencia de sesión en tabla**, no solo JWT stateless.
  - **Cómo se hizo:** nuevas entidades `Facultad`, `ProgramaEducativo`, `Docente`, `Estudiante`, `UsuarioRol` para resolver el número de cuenta hasta el `Usuario`. El JWT lleva un claim `jti` (id de sesión) que se guarda en la tabla `P_EvaluacionDocente_Sesion` (migración `database/migrations/002_sesiones_y_reset_password.sql`) junto con fecha de expiración y estado `Activa` — así se puede invalidar una sesión desde el servidor sin esperar a que el JWT expire solo (se usa en SCRUM-27, al resetear contraseña). Mensajes de error genéricos en credenciales inválidas (no distingue cuenta inexistente de password incorrecta). Probado end-to-end contra el servidor real con datos de prueba temporales (insertados y eliminados en la misma sesión de trabajo).
  - Commits: `7095207` (login), `0d9222e` (sesiones en tabla).

- [x] **SCRUM-27** — Endpoint de recuperación de contraseña vía correo institucional (Responsable: Juan Antonio)
  - **Qué se hizo:** `POST /api/auth/forgot-password { correo }` y `POST /api/auth/reset-password { token, nuevaPassword }`.
  - **Cómo se hizo:** tabla nueva `P_EvaluacionDocente_PasswordResetToken` — se genera un token aleatorio de un solo uso (30 min de vigencia), se guarda solo su **hash SHA-256** (el token crudo nunca se persiste), y se envía por correo vía Nodemailer (Gmail SMTP con contraseña de aplicación, cuenta secundaria — configurado en `backend/.env`, nunca en el repo). `forgot-password` responde siempre el mismo mensaje genérico, exista o no el correo, para no filtrar qué cuentas están registradas. Al hacer `reset-password` exitoso, además de actualizar el hash de la contraseña, **se desactivan todas las sesiones activas del usuario** (tabla `Sesion` de SCRUM-26) — cualquier JWT emitido antes del reset queda sin sesión válida detrás.
  - Probado end-to-end de verdad: el correo se confirmó entregado (respuesta SMTP `250 OK` de Gmail), y se verificó que el password viejo deja de funcionar, el nuevo sí, el token no se puede reusar, y la sesión anterior quedó `Activa=0` en la tabla.
  - Commit: `0d9222e`. Migración: `database/migrations/002_sesiones_y_reset_password.sql`.

- [x] **SCRUM-28** — Configurar proyecto frontend (React + Tailwind + shadcn/ui) y rutas por rol (Responsable: Nieto Guerra Emiliano)
  - **Qué se hizo:** proyecto frontend creado (Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui base) con rutas protegidas por rol (Estudiante/Docente/Coordinador/Administrador). Se hizo como **estructura básica para entregar al encargado** — no es diseño final, es el andamiaje para que Nieto Guerra Emiliano continúe.
  - **Cómo se hizo:** carpeta `frontend/` en el mismo monorepo. `react-router-dom` para rutas, `ProtectedRoute` (exige sesión + rol) y `RoleRedirect` (manda "/" al dashboard del rol del usuario). Componentes base de shadcn/ui creados a mano (Button, Input, Label, Card — sin CLI interactivo, siguiendo el patrón oficial). Proxy de Vite (`/api` → `localhost:3000`) para hablar con el backend en dev sin configurar CORS. Ver `frontend/README.md` para instrucciones completas y decisiones pendientes de revisar (ahí se documentó, por ejemplo, que el JWT se guarda en `localStorage` por simplicidad y no en cookie httpOnly).
  - Verificado en navegador real (no solo compilación): `npm run build` limpio, login/logout, redirección por rol, y bloqueo al intentar entrar a una ruta de otro rol.
  - Commit: `961c230`.

- [x] **SCRUM-29** — Pantallas de login y recuperación de contraseña (Responsable: Nieto Guerra Emiliano)
  - **Qué se hizo:** pantallas de Login, "Olvidé mi contraseña" y "Restablecer contraseña", conectadas de verdad a los endpoints de SCRUM-26/27 (no son mockups).
  - **Cómo se hizo:** `src/pages/auth/{LoginPage,ForgotPasswordPage,ResetPasswordPage}.tsx`, con `AuthContext` para manejar la sesión. Probado end-to-end en navegador contra el backend y la base de datos reales: login válido redirige al dashboard correcto, logout limpia la sesión, y el flujo de recuperación manda la petición real al backend (con un usuario de prueba insertado y eliminado en la misma sesión de trabajo).
  - Commit: `961c230`.
- [x] **SCRUM-30** — Pruebas de autenticación + checklist de seguridad (cifrado de contraseñas) (Responsable: Mauricio Mondragón)
  - **Qué se hizo:** 16 pruebas automatizadas del módulo de autenticación (login, recuperación de contraseña, JWT, hashing de tokens) + checklist de seguridad de 15 puntos.
  - **Cómo se hizo:** se agregó Vitest al backend (`npm test`, `npm run test:coverage`). Las pruebas mockean la capa de repositorios (`vi.mock`) — no tocan la base de datos real, corren rápido y deterministas. `bcrypt` y JWT se prueban con su comportamiento real (no mockeados), incluyendo casos negativos (token manipulado, secreto distinto, contraseña incorrecta). Cobertura: 95.6% en `AuthService.ts`, 100% en `jwt.ts`. El checklist de seguridad (`docs/seguridad-checklist.md`) evalúa 15 controles contra el código real; 12 cumplen, 3 quedan correctamente diferidos a SCRUM-62/EP10 (Sprint 6).
  - Archivos: `backend/src/services/AuthService.test.ts`, `backend/src/utils/{jwt,resetToken}.test.ts`, `docs/pruebas-autenticacion.md`, `docs/seguridad-checklist.md`.

- [x] **SCRUM-31** — Actualizar tablero Jira con historias completadas y preparar demo interna (Responsable: Mauricio Mondragón)
  - **Qué se hizo:** tablero Jira ya estaba sincronizado tarea por tarea durante todo el sprint (cada SCRUM-24 a SCRUM-30 se transicionó a Finalizado con comentario al cerrarse). Se preparó además un guion de demo interna de ~10 minutos cubriendo base de datos, backend, frontend y seguridad.
  - **Cómo se hizo:** `docs/demo-sprint1.md` con pasos concretos (comandos para levantar backend/frontend, qué mostrar y en qué orden, checklist de seguridad al final).
  - Archivo: `docs/demo-sprint1.md`.

---

## SPRINT 2 — Evaluación docente y seguimiento (14 sep – 25 sep) · Entrega: Prototipo 1, 25-sep

- [ ] **SCRUM-32** — Tablas y relaciones del cuestionario (15 preguntas, escala 0/2.5/5/7.5/10) y respuestas (Responsable: Amoxhua Ochoa)
- [ ] **SCRUM-33** — API: listar docentes por alumno, registrar respuestas, bloquear evaluación duplicada (Responsable: Juan Antonio)
- [ ] **SCRUM-34** — API de seguimiento de avance por alumno (completadas / pendientes) (Responsable: Juan Antonio)
- [ ] **SCRUM-35** — Pantalla de cuestionario de evaluación docente (Responsable: Nieto Guerra Emiliano)
- [ ] **SCRUM-36** — Pantalla "Mis evaluaciones" (progreso, pendientes/completadas) (Responsable: Nieto Guerra Emiliano)
- [ ] **SCRUM-37** — Pruebas funcionales del flujo alumno y preparación del Prototipo 1 (Responsable: Mauricio Mondragón)
- [ ] **SCRUM-38** — Actualizar casos de uso y documentación para la entrega del Prototipo 1 (Responsable: Mauricio Mondragón)

---

## SPRINT 3 — Coordinación académica y notificaciones (28 sep – 9 oct)

- [ ] **SCRUM-39** — API de coordinación: concluidos / parciales / no iniciados + filtros (carrera, grupo, ciclo) (Responsable: Juan Antonio)
- [ ] **SCRUM-40** — Servicio de correos automáticos (7 / 3 / 1 días antes del cierre) (Responsable: Juan Antonio)
- [ ] **SCRUM-41** — Vistas/consultas agregadas de participación por grupo, carrera y ciclo (Responsable: Amoxhua Ochoa)
- [ ] **SCRUM-42** — Dashboard de coordinación en tiempo real (Responsable: Nieto Guerra Emiliano)
- [ ] **SCRUM-43** — Panel de administración de usuarios (alta/edición, roles) (Responsable: Nieto Guerra Emiliano)
- [ ] **SCRUM-44** — Pruebas de integración de coordinación y validación de envío de correos (Responsable: Mauricio Mondragón)
- [ ] **SCRUM-45** — Retro de sprint y actualización de backlog (Responsable: Mauricio Mondragón)

---

## SPRINT 4 — Indicadores docentes e históricos (12 oct – 23 oct)

- [ ] **SCRUM-46** — Vistas de cálculo: promedio, ranking y clasificación docente con materias asignadas (Responsable: Amoxhua Ochoa)
- [ ] **SCRUM-47** — API de indicadores docentes (promedio, ranking, histórico por ciclo) (Responsable: Juan Antonio)
- [ ] **SCRUM-48** — API de históricos (consulta de ciclos anteriores) (Responsable: Juan Antonio)
- [ ] **SCRUM-49** — Pantalla de perfil docente (promedio, categoría, histórico de ciclos) (Responsable: Nieto Guerra Emiliano)
- [ ] **SCRUM-50** — Pantalla comparativo histórico (ciclo actual vs. anterior vs. últimos 3 ciclos) (Responsable: Nieto Guerra Emiliano)
- [ ] **SCRUM-51** — Validar reglas de clasificación contra la tabla oficial (casos límite 6.9/7.0, 8.9/9.0) (Responsable: Mauricio Mondragón)
- [ ] **SCRUM-52** — Documentación técnica del módulo de indicadores (Responsable: Mauricio Mondragón)

---

## SPRINT 5 — Talleres/laboratorios y estadísticas institucionales (26 oct – 6 nov) · Entrega: Prototipo 2, 6-nov

- [ ] **SCRUM-53** — Tablas de talleres/laboratorios configurables por carrera + criterios de evaluación (Responsable: Amoxhua Ochoa)
- [ ] **SCRUM-54** — API de evaluación de talleres/laboratorios, activación configurable por carrera (Responsable: Juan Antonio)
- [ ] **SCRUM-55** — API de agregación para gráficos institucionales (promedio, participación, ranking) (Responsable: Juan Antonio)
- [ ] **SCRUM-56** — Formulario de evaluación de talleres y laboratorios (Responsable: Nieto Guerra Emiliano)
- [ ] **SCRUM-57** — Dashboard de gráficos institucionales + concentrado por carrera (Responsable: Nieto Guerra Emiliano)
- [ ] **SCRUM-58** — Pruebas de carga básicas (respuesta <3s) e integración de módulos entregados (Responsable: Mauricio Mondragón)
- [ ] **SCRUM-59** — Preparar y documentar el Prototipo 2 funcional parcial (Responsable: Mauricio Mondragón)

---

## SPRINT 6 — Reportes en PDF y seguridad (9 nov – 20 nov)

- [ ] **SCRUM-60** — Consultas consolidadas para los 5 reportes requeridos (Responsable: Amoxhua Ochoa)
- [ ] **SCRUM-61** — Generación de reportes en PDF por tipo y filtros (Responsable: Juan Antonio)
- [ ] **SCRUM-62** — Bitácora de auditoría + middleware de control de acceso por roles (Responsable: Juan Antonio)
- [ ] **SCRUM-63** — Pantallas de generación/descarga de reportes PDF (Responsable: Nieto Guerra Emiliano)
- [ ] **SCRUM-64** — Ajustes de responsividad (compatibilidad tablet / móvil) (Responsable: Nieto Guerra Emiliano)
- [ ] **SCRUM-65** — Pruebas de seguridad (accesos cruzados entre roles) y validación de reportes (Responsable: Mauricio Mondragón)
- [ ] **SCRUM-66** — Actualizar documentación de requerimientos no funcionales (Responsable: Mauricio Mondragón)

---

## SPRINT 7 — Estabilización, QA y despliegue (23 nov – 4 dic)

- [ ] **SCRUM-67** — Corrección de bugs detectados en sprints anteriores (bug bash) (Responsable: Todos)
- [ ] **SCRUM-68** — Optimización de queries y endpoints (cumplir <3s de respuesta) (Responsable: Juan Antonio)
- [ ] **SCRUM-69** — Pruebas de usabilidad y ajustes de navegación (Responsable: Nieto Guerra Emiliano)
- [ ] **SCRUM-70** — Pruebas de escalabilidad (soporte multi-campus / carrera configurable) (Responsable: Amoxhua Ochoa)
- [ ] **SCRUM-71** — Plan y pruebas de despliegue en ambiente de demo/producción (Responsable: Mauricio Mondragón)
- [ ] **SCRUM-72** — Checklist final contra la rúbrica de evaluación del proyecto (Responsable: Mauricio Mondragón)

---

## SPRINT 8 — Cierre, documentación y presentación ejecutiva (7 dic – 18 dic) · Entrega final: 11 y 18-dic

- [ ] **SCRUM-73** — Consolidar documentación final (UML, DER, modelo físico, manual de usuario) (Responsable: Mauricio Mondragón)
- [ ] **SCRUM-74** — Pulido final de UI/UX y capturas para documentación (Responsable: Nieto Guerra Emiliano)
- [ ] **SCRUM-75** — Congelamiento de código y últimos ajustes técnicos (Responsable: Juan Antonio)
- [ ] **SCRUM-76** — Preparar presentación ejecutiva (slides + demo en vivo) (Responsable: Todos)
- [ ] **SCRUM-77** — Ensayo de presentación final (Responsable: Todos)

---

## Tareas sueltas / de prueba (no forman parte del plan de sprints)

- [ ] **SCRUM-1** — "Tarea 1" (sin responsable, parece de prueba — confirmar si se elimina de Jira)
- [ ] **SCRUM-2** — "Tarea 2" (sin responsable, parece de prueba — confirmar si se elimina de Jira)
- [ ] **SCRUM-4** — "Subtarea 2.1" (sin responsable, parece de prueba — confirmar si se elimina de Jira)

---

## Reglas técnicas vigentes (resumen — detalle completo en `database/evaluacion_docente_schema.sql`)

- Una sola base de datos compartida (`Central-Data`, Azure SQL) entre varios proyectos escolares — todas las tablas de este proyecto van prefijadas `P_EvaluacionDocente_`.
- Constraints en minúsculas: `pk_`, `fk_`, `uq_`, `ck_`, `ix_` + nombre completo de la tabla.
- Sin `ON DELETE CASCADE` — borrado lógico con columnas `Activo`/`Completada`.
- Backend: monorepo, `backend/` con Express + TypeScript + TypeORM, capas `entities → repositories → services → controllers → routes`.
- Todo cambio de esquema va como migración numerada en `database/migrations/`.
- Credenciales (BD, JWT, SMTP) **solo** en `backend/.env`, nunca en el repo — `.env.example` como plantilla.
- Antes de dar una tarea de backend por terminada: probarla end-to-end contra el servidor real (con datos de prueba insertados y eliminados en la misma sesión) y dejar la base compartida limpia.
