# Diagramas de casos de uso (UML) — 4 roles de usuario

**Proyecto:** Sistema de Información de Evaluación Docente Institucional Adaptable
**Equipo:** Ingenieros Malas Influencias · **Jira:** SCRUM-21

> Diagramas en formato Mermaid (se renderizan nativamente en GitHub). Cada caso de uso está etiquetado con el requerimiento funcional del que proviene — ver `docs/requerimientos.md`.

## Actores del sistema

- **Estudiante** — responde evaluaciones de sus docentes y talleres.
- **Docente** — consulta sus propios resultados e indicadores.
- **Coordinador** — da seguimiento al avance, configura instrumentos y talleres, genera reportes.
- **Administrador** — gestiona usuarios, catálogos y seguridad del sistema.

---

## 1. Estudiante

```mermaid
flowchart LR
    Estudiante((Estudiante))
    subgraph SIS["Sistema de Evaluación Docente"]
        E1([Iniciar sesión · RF01])
        E2([Recuperar contraseña · RF01])
        E3([Ver docentes/grupos a evaluar · RF02])
        E4([Responder cuestionario de evaluación · RF02, RF03])
        E5([Ver evaluaciones pendientes / completadas · RF04])
        E6([Evaluar talleres y laboratorios · RF08])
        E7([Recibir recordatorios por correo · RF05])
    end
    Estudiante --> E1
    Estudiante --> E2
    Estudiante --> E3
    Estudiante --> E4
    Estudiante --> E5
    Estudiante --> E6
    E7 -.notifica.-> Estudiante
```

## 2. Docente

```mermaid
flowchart LR
    Docente((Docente))
    subgraph SIS["Sistema de Evaluación Docente"]
        D1([Iniciar sesión · RF01])
        D2([Recuperar contraseña · RF01])
        D3([Ver perfil de indicadores: promedio, categoría · RF07])
        D4([Ver comparativo histórico de ciclos · RF07])
    end
    Docente --> D1
    Docente --> D2
    Docente --> D3
    Docente --> D4
```

## 3. Coordinador

```mermaid
flowchart LR
    Coordinador((Coordinador))
    subgraph SIS["Sistema de Evaluación Docente"]
        C1([Iniciar sesión · RF01])
        C2([Recuperar contraseña · RF01])
        C3([Ver dashboard de avance: concluidos/parciales/no iniciados · RF06])
        C4([Filtrar por carrera, grupo y ciclo · RF06])
        C5([Ver estadísticas institucionales y gráficos · RF06])
        C6([Configurar instrumento de evaluación: secciones, preguntas, escalas · RF03])
        C7([Configurar talleres/laboratorios por carrera · RF08])
        C8([Generar y descargar reportes en PDF · RF09])
    end
    Coordinador --> C1
    Coordinador --> C2
    Coordinador --> C3
    Coordinador --> C4
    Coordinador --> C5
    Coordinador --> C6
    Coordinador --> C7
    Coordinador --> C8
```

## 4. Administrador

```mermaid
flowchart LR
    Administrador((Administrador))
    subgraph SIS["Sistema de Evaluación Docente"]
        A1([Iniciar sesión · RF01])
        A2([Recuperar contraseña · RF01])
        A3([Administrar usuarios: alta, edición, roles · RF01])
        A4([Configurar periodos académicos y de evaluación])
        A5([Consultar bitácora de auditoría · RNF02])
    end
    Administrador --> A1
    Administrador --> A2
    Administrador --> A3
    Administrador --> A4
    Administrador --> A5
```

---

## Vista general (los 4 roles)

```mermaid
flowchart TB
    Estudiante((Estudiante))
    Docente((Docente))
    Coordinador((Coordinador))
    Administrador((Administrador))

    subgraph SIS["Sistema de Evaluación Docente"]
        Login([Iniciar sesión / Recuperar contraseña · RF01])
        Evaluar([Responder evaluaciones y talleres · RF02, RF03, RF08])
        Seguimiento([Ver avance propio · RF04])
        Indicadores([Ver indicadores e históricos · RF07])
        Dashboard([Dashboard de coordinación y estadísticas · RF06])
        Config([Configurar instrumentos y talleres · RF03, RF08])
        Reportes([Generar reportes PDF · RF09])
        Usuarios([Administrar usuarios y auditoría · RF01, RNF02])
    end

    Estudiante --> Login
    Estudiante --> Evaluar
    Estudiante --> Seguimiento

    Docente --> Login
    Docente --> Indicadores

    Coordinador --> Login
    Coordinador --> Dashboard
    Coordinador --> Config
    Coordinador --> Reportes

    Administrador --> Login
    Administrador --> Usuarios
```
