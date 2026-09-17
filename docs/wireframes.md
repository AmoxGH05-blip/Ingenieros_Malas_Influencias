# Wireframes — pantallas clave

**Proyecto:** Sistema de Información de Evaluación Docente Institucional Adaptable
**Equipo:** Ingenieros Malas Influencias · **Jira:** SCRUM-22

> Wireframes de **baja fidelidad** (estructura y contenido, no diseño visual final) — el objetivo es acordar qué va en cada pantalla antes de construirla. Nieto Guerra Emiliano (Integrante 2, Frontend) es quien define la dirección visual real. Cada elemento está trazado a su caso de uso (`docs/casos_de_uso.md`) y requerimiento (`docs/requerimientos.md`).

## 1. Login

Ya implementado en `frontend/src/pages/auth/LoginPage.tsx` (SCRUM-29) — este wireframe documenta lo que ya existe, para que quede registrado.

```
┌───────────────────────────────────────┐
│         Iniciar sesión                │
│  Sistema de Evaluación Docente         │
│                                         │
│  Número de cuenta                      │
│  ┌───────────────────────────────┐    │
│  │                                 │    │
│  └───────────────────────────────┘    │
│                                         │
│  Contraseña                            │
│  ┌───────────────────────────────┐    │
│  │ ••••••••••                     │    │
│  └───────────────────────────────┘    │
│                                         │
│  ┌───────────────────────────────┐    │
│  │           Entrar                │    │
│  └───────────────────────────────┘    │
│                                         │
│        ¿Olvidaste tu contraseña?       │
└───────────────────────────────────────┘
```

- Campos: número de cuenta (matrícula/número de empleado), contraseña. (E1/D1/C1/A1)
- Enlace a recuperación de contraseña. (E2/D2/C2/A2)
- Mensaje de error genérico si las credenciales fallan (sin distinguir cuenta inexistente de password incorrecta — ver `docs/seguridad-checklist.md`).

## 2. Dashboard Alumno (Estudiante)

**Pendiente de construir** — corresponde a SCRUM-35/36 (Sprint 2). Reemplaza el placeholder actual en `frontend/src/pages/dashboards/EstudianteDashboardPage.tsx`.

```
┌─────────────────────────────────────────────────────────┐
│ DYGSIS          correo@alumno · Estudiante   [Cerrar sesión] │
├─────────────────────────────────────────────────────────┤
│  Mi progreso                                              │
│  ┌───────────────────────────────────────────────────┐   │
│  │  3 de 5 evaluaciones completadas   [██████░░░░]    │   │  ← RF04 (E5)
│  └───────────────────────────────────────────────────┘   │
│                                                             │
│  Docentes por evaluar                                     │
│  ┌───────────────────────────────────────────────────┐   │
│  │ Docente          Materia         Grupo   Estado     │   │
│  │ García López A.  Base de Datos   3A       [Evaluar] │   │  ← RF02/RF03 (E3/E4)
│  │ Ramírez Soto B.  Redes           3A       ✓ Hecho   │   │
│  │ ...                                                  │   │
│  └───────────────────────────────────────────────────┘   │
│                                                             │
│  Talleres / laboratorios por evaluar (si aplica a tu carrera) │  ← RF08 (E6)
│  ┌───────────────────────────────────────────────────┐   │
│  │ Taller de Redes                         [Evaluar]  │   │
│  └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

- Barra/contador de progreso arriba (lo primero que ve el alumno).
- Tabla de docentes a evaluar, con botón que abre el cuestionario (SCRUM-35).
- Sección de talleres/laboratorios solo visible si la carrera del alumno los tiene configurados (SCRUM-53/54).

## 3. Dashboard Coordinación

**Pendiente de construir** — corresponde a SCRUM-42/57/63 (Sprints 3, 5 y 6). Reemplaza el placeholder actual en `frontend/src/pages/dashboards/CoordinadorDashboardPage.tsx`.

```
┌─────────────────────────────────────────────────────────┐
│ DYGSIS         correo@coord · Coordinador    [Cerrar sesión] │
├─────────────────────────────────────────────────────────┤
│  Filtros:  [Carrera ▾]  [Grupo ▾]  [Ciclo ▾]              │  ← RF06 (C4)
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │ Concluidos │  │  Parciales │  │No iniciados│          │  ← RF06 (C3)
│  │    128     │  │     34     │  │     12     │          │
│  └────────────┘  └────────────┘  └────────────┘          │
│                                                             │
│  Participación por grupo                                  │
│  ┌───────────────────────────────────────────────────┐   │
│  │  [ gráfico de barras / líneas — SCRUM-57 ]         │   │  ← RF06 (C5)
│  └───────────────────────────────────────────────────┘   │
│                                                             │
│  [ Configurar instrumento de evaluación ]  ← RF03 (C6)     │
│  [ Configurar talleres/laboratorios ]      ← RF08 (C7)     │
│  [ Generar reportes PDF ]                  ← RF09 (C8)     │
└─────────────────────────────────────────────────────────┘
```

- Filtros arriba, controlan todo lo demás en la pantalla.
- 3 tarjetas resumen (concluidos/parciales/no iniciados) como primer vistazo.
- Gráfico de participación (placeholder — la librería de gráficos se define en SCRUM-57, doc original menciona Recharts).
- Accesos directos a las 3 acciones de configuración/reportes que solo puede hacer coordinación.

## Siguiente paso

Cuando Nieto Guerra Emiliano tome estas pantallas, puede ajustar libremente la disposición visual — lo que no debería cambiar es **qué información/acciones vive en cada pantalla**, para que siga alineado con `docs/requerimientos.md` y no se pierda ningún RF en el camino.
