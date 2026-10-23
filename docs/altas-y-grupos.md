# Altas jerárquicas, materias y grupos (SCRUM-79)

Requisito de la revisión con la coordinadora: el sistema parte de **una sola cuenta de Administrador** y todo lo demás se da de alta desde la página, con números de cuenta.

```
Administrador ──crea──▶ Coordinadores (y otros Administradores)
Coordinador   ──crea──▶ Alumnos y Docentes, Materias y Grupos, e inscribe alumnos en los grupos
```

## Quién puede qué

Se valida **en el servidor**, no solo en la pantalla: lo que un rol no puede hacer se rechaza sin importar lo que traiga la petición.

| Acción | Administrador | Coordinador |
|---|---|---|
| Dar de alta o asignar el rol **Coordinador** o **Administrador** | Sí | No (403) |
| Dar de alta o asignar el rol **Alumno** o **Docente** | Sí (respaldo) | Sí |
| Ver cuentas | Todas | Solo las de alumnos y docentes |
| Agregar un rol a una cuenta existente | Cualquiera | Solo si la cuenta es de alumno o docente |
| Materias, grupos e inscripciones | Sí (respaldo) | Sí |

Una cuenta **sin ningún rol** tampoco es del Coordinador. Si un Coordinador busca una cuenta que no puede gestionar, el sistema solo le dice que existe y que no la puede gestionar, sin nombre ni correo.

## Dar de alta una cuenta (número nuevo o existente)

Pantalla **Usuarios** (Administrador) o **Alumnos y docentes** (Coordinador) → **Dar de alta cuenta**:

1. Se escribe el número de cuenta y se pulsa **Buscar**.
2. **Cuenta nueva:** se elige el rol (solo los que tu rol puede asignar), la contraseña temporal y los datos del rol. Para un alumno, el correo es opcional (sin él se asigna `a<matrícula>@my.uvm.edu.mx`) y se pueden marcar los **grupos** en los que se inscribe. Para un docente no se elige grupo: sus grupos aparecen cuando se crea un grupo con él.
3. **Cuenta existente:** se muestran nombre y roles actuales y solo se puede **agregar un rol** de los que faltan. La contraseña de una cuenta existente **nunca** se toca desde aquí (eso es SCRUM-80). Si el rol necesita un perfil que la cuenta no tiene (nombre, carrera o facultad), se pide; si ya lo tiene, no se duplica.
4. Las cuentas nuevas nacen con contraseña temporal y **cambio obligatorio** en el primer acceso (ver `docs/acceso-y-cuentas.md`), y quedan marcadas con quién las creó (`Usuario.CreadoPorUsuarioId`, migración 008).

El alta con grupos es **atómica**: la cuenta, el perfil y las inscripciones se guardan en una sola transacción. Si algún grupo no existe o está lleno, no se crea nada.

El correo se guarda siempre en minúsculas.

## Materias y grupos

- **Materia:** carrera, clave única (letras, números, punto y guiones; se guarda en mayúsculas), nombre y créditos (0 a 100). Se crea desde el formulario de grupo ("La materia no está en la lista: crear nueva").
- **Grupo:** materia + docente + periodo académico + sección (letras y números, hasta 10, en mayúsculas) + **cupo máximo** opcional. La misma materia, docente, periodo y sección no se puede repetir (409). **Cupo 0 o vacío = sin límite.**
- **Inscribir alumno:** en el detalle del grupo, por número de cuenta; también al dar de alta al alumno. Rechaza al alumno ya inscrito (409), el grupo lleno (409), cuentas inexistentes, inactivas o que no son de alumno (400) y grupos inexistentes (404).
- El cupo se comprueba con el grupo **bloqueado** dentro de la transacción, para que dos altas simultáneas no se pasen del límite.
- Los **periodos académicos**, las facultades y las carreras siguen por script (se crean una vez por semestre).

## Pantallas

| Ruta | Quién | Qué hace |
|---|---|---|
| `/coordinador/usuarios` y `/administrador/usuarios` | Coordinador / Administrador | Alta de cuentas y listado con filtro por rol |
| `/coordinador/grupos` | Coordinador y Administrador | Lista por periodo, "Nuevo grupo" y "Nueva materia" |
| `/coordinador/grupos/:id` | Coordinador y Administrador | Inscritos del grupo e inscripción por número de cuenta |

## API

Todas requieren sesión de Coordinador o Administrador y están limitadas a 200 peticiones por usuario cada 15 minutos.

| Método y ruta | Para qué |
|---|---|
| `GET /api/cuentas` | Lista de cuentas que el actor puede gestionar |
| `GET /api/cuentas/buscar?numeroCuenta=` | Primer paso del alta: ¿existe? y qué roles se pueden asignar |
| `POST /api/cuentas` | Alta de cuenta nueva (201) o rol adicional a una existente (200); acepta `grupoIds` para alumnos |
| `GET /api/catalogos` | Programas, facultades, periodos, materias y docentes para las listas desplegables |
| `POST /api/materias` | Crea una materia |
| `GET /api/grupos?periodoAcademicoId=` | Lista de grupos con docente, periodo e inscritos |
| `POST /api/grupos` | Crea un grupo |
| `GET /api/grupos/:id` | Detalle con alumnos inscritos |
| `POST /api/grupos/:id/inscripciones` | Inscribe a un alumno por `numeroCuenta` |

Reemplazan a `/api/admin/usuarios` y `/api/admin/catalogos` (SCRUM-43), que se retiraron: su único cliente era la pantalla anterior. Errores: 400 datos inválidos, 403 sin permiso, 404 no existe, 409 duplicado o grupo lleno.

## Cambios de paso

- El dashboard del alumno ya **filtra los grupos por el ciclo** del periodo de evaluación activo, igual que los avisos de SCRUM-40. Antes listaba también grupos de otros ciclos, y al poder crear grupos esa diferencia se habría notado.
- Validación de ids más estricta: solo enteros (o texto de dígitos) que caben en la base. `true`, `[3]`, `"0x10"` o un número enorme dan 400 en vez de un 500.
- Se aplicaron los ajustes de la revisión de seguridad del bloque A: carrera al agregar un rol (se bloquea la cuenta y se vuelven a comprobar sus roles con datos frescos), cuentas sin roles solo del Administrador, y listado con un mapa en vez de recorridos anidados.

## Fuera de alcance

Quitar inscripciones; editar o desactivar cuentas, grupos y materias; carga masiva de alumnos por CSV (sería lo siguiente para cientos de alumnos); crear periodos académicos desde la página; paginar el listado de cuentas.

## Verificación

- 231 pruebas en backend, entre ellas: matriz de permisos, cuenta nueva y existente, alta con grupos, cupo, duplicados, carreras con roles cambiados a mitad de operación, validación estricta de ids y filtro por ciclo del dashboard.
- Contra Supabase, con cuentas, materia y grupos temporales borrados al final: 29 comprobaciones del bloque A y 33 del B (permisos por rol, trazabilidad de quién creó cada cuenta, contraseña intacta al agregar un rol, cupo, reversión completa del alta cuando el grupo está lleno, 400/403/404/409).
- En el navegador como Coordinador: menú con "Alumnos y docentes" y "Grupos", lista de grupos del periodo, formulario de nuevo grupo con "crear materia", detalle con alumnos, y el alta de alumno ofreciendo los grupos para inscribirlo.
