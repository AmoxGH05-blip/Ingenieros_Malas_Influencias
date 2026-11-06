# Guion de la presentación y guía de la demostración

**Equipo:** Juan Antonio (backend), Emiliano (frontend), Amoxhua (base de datos e indicadores), Mauricio (QA, documentación y Scrum Master).
**Duración sugerida:** presentación 10–12 min + demostración 8–10 min. Los cuatro hablan en ambas partes.

---

## 0. Lo primero: el PDF está desactualizado

El PDF es del **5 de noviembre**. Desde entonces se cerraron cosas que ahí aparecen como pendientes. **O se regenera el PDF, o cada quien dice la cifra correcta en voz alta.** Este guion ya usa las cifras correctas; esta tabla dice dónde el PDF contradice lo que van a decir.

| Diapositiva | El PDF dice | Lo correcto al 6 de nov (verifiquen en `PROGRESS.md` antes de presentar) |
|---|---|---|
| 3 | Docente: **Pendiente** | **Implementado**: el docente ve sus indicadores y su comparativo histórico. |
| 4 | 29 de 64 tareas (45 %); Sprint 3: 5 de 7; Sprint 4: 0 de 7; tareas nuevas 2 de 3 | **41 de 64 (64 %)**. Sprint 3: **7 de 7**. Sprint 4: **7 de 7**. Tareas nuevas 78 a 80: **3 de 3**. Sprint 5: **2 de 7** (estadísticas con gráficos listas). Además se cerró SCRUM-81 (seguridad de la base de datos). |
| 5 | 10 listos, 5 parciales, 5 pendientes | **13 listos, 4 parciales, 3 pendientes.** Pasaron a listos RF06 (gráficos), RF07 (indicadores) y RF11 (cambio de contraseña). Quedan pendientes RF08 (talleres, en desarrollo), RF09 (reportes PDF) y RNF04 (respuesta menor a 3 s). |
| 11 | Contraseña olvidada: "solicitud con aprobación (pendiente)" | **Implementada**, con código de verificación. |
| 12 | 236 pruebas | **293 pruebas** en lo que está publicado (323 con talleres, que aún no se publica). |
| 14 | Sprint 4 "vencido, 0 de 7"; Sprint 5 "cierra mañana" | Sprint 4 **terminado (7 de 7)**. Sprint 5 **venció hoy, con 2 de 7**: faltan talleres, pruebas de carga y la documentación del Prototipo 2. |
| 15 | Sprint 4 sin cerrar | Ese riesgo ya se resolvió. Siguen vigentes: dependencia de una persona por área, servidor gratuito que se duerme, cuentas de demostración públicas y una sola base compartida. |

**Qué no deben prometer:** talleres y laboratorios (RF08) está construido y probado en el equipo de desarrollo, pero **todavía no está publicado**. Si no se publica antes de presentar, dígase "en desarrollo".

---

## 1. Quién habla en cada diapositiva

| Diap. | Tema | Habla | Tiempo |
|---|---|---|---|
| 1–2 | Portada y problema | **Mauricio** | 1:15 |
| 3 | Cuatro roles | **Emiliano** | 0:45 |
| 4–5 | Avance y requerimientos | **Mauricio** | 1:30 |
| 6 | Arquitectura | **Juan Antonio** | 1:00 |
| 7 | Modelo de datos | **Amoxhua** | 1:00 |
| 8 | Acceso por número de cuenta | **Juan Antonio** | 1:00 |
| 9 | Flujo del alumno | **Emiliano** | 1:00 |
| 10 | Lo que funciona para coordinación | **Emiliano** | 0:45 |
| 11 | Decisiones que cambiaron el rumbo | **Amoxhua** | 1:15 |
| 12 | Calidad | **Juan Antonio** | 1:00 |
| 13 | Transición a la demostración | **Mauricio** | 0:20 |
| 14 | Lo que falta | **Mauricio** | 0:45 |
| 15 | Riesgos | **Amoxhua** | 0:45 |
| 16 | Lo que aprendimos | **los cuatro, una frase cada uno** | 0:40 |

Si el tiempo aprieta, se recortan la 7 y la 10 a una frase.

---

## 2. Guion, diapositiva por diapositiva

Las partes entre **[corchetes]** son indicaciones, no se leen.

### Diapositiva 1 — Portada · Mauricio
> Buenos días. Somos el equipo Ingenieros Malas Influencias y les presentamos el avance de DYGSIS, el Sistema de Evaluación Docente, Institucional y Adaptable. Yo soy Mauricio y me encargo de QA, documentación y de coordinar el equipo. Con nosotros están Juan Antonio, que hizo el backend; Emiliano, el frontend; y Amoxhua, la base de datos y los indicadores. Los cuatro vamos a participar, y al final les enseñamos el sistema funcionando.

### Diapositiva 2 — El problema · Mauricio
> Partimos de un problema muy concreto: hoy evaluar a un docente es algo disperso y rígido. Las evaluaciones están repartidas entre papel, formularios y hojas de cálculo. El alumno no sabe cuáles ya respondió ni cuáles le faltan. Coordinación no tiene un histórico por docente y por ciclo para decidir. Y si quieren cambiar una pregunta del cuestionario, alguien tiene que tocar código.
> Nuestra propuesta es un solo sistema web, con cuatro roles, cuestionarios que se configuran como datos, seguimiento de avance, avisos de pendientes, indicadores históricos, estadísticas y reportes.

### Diapositiva 3 — Cuatro roles · Emiliano
> El sistema tiene cuatro roles y una jerarquía de altas. Hay una cuenta única de Administrador que da de alta a coordinadores y a otros administradores. El Coordinador da de alta a alumnos y docentes, crea materias y grupos, inscribe alumnos y ve el avance. El Estudiante responde sus evaluaciones y ve su propio avance. Y el Docente consulta sus indicadores y su comparativo histórico, en solo lectura.
> **[Dato actualizado: el PDF marca al Docente como pendiente; ya está implementado. Decirlo.]**
> Todos entran con su número de cuenta, no con correo, y el modelo funciona para varias carreras y facultades sin cambiar la base de datos.

### Diapositiva 4 — Avance · Mauricio
> Les resumo dónde estamos. Llevamos **41 de las 64 tareas del plan terminadas, el 64 %**. Los sprints 0 al 2 están completos, y los sprints 3 y 4 también, siete de siete cada uno. El Sprint 4 era el de indicadores y históricos, y lo cerramos. En el Sprint 5 llevamos dos de siete: las estadísticas con gráficos están listas; faltan talleres, pruebas de carga y la documentación del Prototipo 2.
> **[Dato actualizado: el PDF dice 29 de 64 y Sprint 4 en 0 de 7.]**
> Además de las tareas del plan, cerramos tareas nuevas que salieron de las revisiones, por ejemplo la seguridad de la base de datos.

### Diapositiva 5 — Requerimientos · Mauricio
> En requerimientos, **13 están implementados, 4 parciales y 3 pendientes**. Ya funcionan el acceso por número de cuenta, la evaluación sin duplicados, el avance del alumno, los avisos, las altas jerárquicas, y desde el último informe también las estadísticas con gráficos, los indicadores por docente y el cambio de contraseña con aprobación. Quedan pendientes talleres y laboratorios, los reportes en PDF y el tiempo de respuesta menor a tres segundos.
> **[Dato actualizado: el PDF dice 10 / 5 / 5.]**

### Diapositiva 6 — Arquitectura · Juan Antonio
> Del lado técnico, el sistema está hecho por capas. El frontend es React con Vite y Tailwind. La API es Express con TypeScript: los controladores reciben la petición, los servicios tienen la lógica de negocio, y los repositorios hablan con la base de datos mediante TypeORM. La base es PostgreSQL en Supabase.
> Todo está desplegado sin costo: el frontend en Vercel, que se actualiza solo en cada push a GitHub; la API en Render, que en el plan gratuito se duerme tras quince minutos sin tráfico y tarda cerca de un minuto en despertar; y la base en Supabase, con un flujo diario de GitHub Actions que la mantiene despierta.

### Diapositiva 7 — Modelo de datos · Amoxhua
> Yo me encargué del modelo de datos. Son más de veinte tablas; aquí mostramos ocho. Lo importante es la idea: el cuestionario es **un dato**, no código. Un instrumento tiene secciones, preguntas y opciones de respuesta, así que crear un cuestionario nuevo es insertar filas. Una evaluación es la respuesta de un alumno a un grupo en un periodo, y es única por alumno, grupo y periodo. No hay borrado en cascada y todas las restricciones tienen nombre propio, lo que facilita los mensajes de error y el mantenimiento.

### Diapositiva 8 — Acceso · Juan Antonio
> El acceso es por número de cuenta, con varios controles. La cuenta nueva trae una contraseña temporal y está obligada a cambiarla en su primer ingreso; mientras no lo haga, el servidor responde 403. Las contraseñas se guardan con bcrypt, nunca en texto plano. La sesión es un token firmado con vigencia de ocho horas. Hay un límite de intentos: cinco por cuenta y treinta por IP cada quince minutos. Y el error es genérico: no se distingue entre cuenta inexistente y contraseña incorrecta, para no dar pistas a un atacante.

### Diapositiva 9 — Flujo del alumno · Emiliano
> Así se ve el flujo para el alumno. Inicia sesión, ve su avance —por ejemplo, uno de cinco—, elige un docente y le carga el cuestionario: quince preguntas en cuatro secciones, con la escala de cero, 2.5, cinco, 7.5 y diez. Responde, envía, y el servidor guarda las respuestas y actualiza el avance.
> Lo clave es la regla del recuadro: **una sola evaluación por docente y grupo en cada periodo**, y esa regla la hace cumplir el servidor, no la interfaz. Si alguien intenta reenviar, recibe un 409.

### Diapositiva 10 — Coordinación · Emiliano
> Para coordinación ya funciona la gestión de grupos con cupo opcional e inscripciones, protegidas con una transacción para que dos inscripciones simultáneas no rebasen el cupo. Funciona también el avance en vivo, con filtros por carrera, grupo y ciclo. Y los avisos: al iniciar sesión, el alumno con evaluaciones pendientes ve una ventana y una campana, desde siete días antes del cierre. Decidimos no usar correos porque las cuentas no tienen buzón real.
> **[Dato actualizado: el PDF dice que los gráficos institucionales están pendientes; ya existen. Los vamos a ver en la demostración.]**

### Diapositiva 11 — Decisiones · Amoxhua
> Esta diapositiva es de las decisiones que cambiaron el rumbo, y varias nos tocaron a la base de datos. Pasamos de Azure SQL Server a Supabase con PostgreSQL, porque la suscripción de Azure superó el crédito. Cambiamos el inicio de sesión de correo a número de cuenta porque la coordinadora nos dijo que no se usan correos personales. Cambiamos los recordatorios por correo por avisos en pantalla, porque el servidor gratuito bloquea el correo. Y la contraseña olvidada pasó de un enlace por correo a una **solicitud con aprobación**: quien olvidó su contraseña la solicita, y un coordinador o administrador la aprueba tecleando un código de verificación. **[Dato actualizado: ya está implementada; el PDF dice pendiente.]**
> Algo más: una revisión de seguridad nos mostró que las tablas de la base estaban abiertas a los roles públicos de Supabase. Lo corregimos: ahora esas tablas tienen seguridad por filas y el único acceso es nuestro backend.

### Diapositiva 12 — Calidad · Juan Antonio
> En calidad tenemos **293 pruebas automatizadas en verde**. **[Dato actualizado: el PDF dice 236.]** Cubren acceso, evaluación, cuentas, grupos, avisos, indicadores, estadísticas y el cambio de contraseña. Probamos que un token manipulado se rechaza, que reenviar una evaluación da 409, que los permisos cruzados entre roles dan 403 y que el sexto intento de acceso da 429. Además tenemos scripts que comparan lo que devuelve la API con consultas independientes contra la base real.
> Sabemos qué falta: una bitácora de auditoría, poder revocar una sesión antes de las ocho horas, y las pruebas de carga.

### Diapositiva 13 — Demostración · Mauricio
> Con esto pasamos a la parte más importante: les mostramos el sistema funcionando, en producción, con la base real. Lo vamos a hacer entre los cuatro.

### Diapositiva 14 — Lo que falta · Mauricio
> Lo que falta: el Sprint 5 venció hoy con dos de siete tareas; quedan talleres y laboratorios, las pruebas de carga y documentar el Prototipo 2. Siguen el Sprint 6, con los cinco reportes en PDF y la bitácora de auditoría; el 7, de estabilización y QA; y el 8, de cierre y entrega. Hubo atrasos: el Sprint 4 terminó fuera de fecha. Priorizamos lo demostrable, y por eso hoy ya hay indicadores y gráficos funcionando.
> **[Dato actualizado: el PDF muestra Sprint 4 vencido en 0 de 7.]**

### Diapositiva 15 — Riesgos · Amoxhua
> Los riesgos que seguimos vigilando: cada área depende de una sola persona; el servidor gratuito se duerme y puede afectar una demo; las cuentas de demostración tienen contraseña pública en un repositorio público, y las desactivaremos antes de la entrega final; y local y producción comparten la misma base de datos, así que cualquier prueba toca los mismos datos. Para mitigar, congelamos el alcance a mitad de cada sprint y repartimos las tareas por áreas en paralelo.

### Diapositiva 16 — Aprendizajes · los cuatro
> **Mauricio:** Aprendimos a escuchar al usuario real: la coordinadora nos hizo rediseñar el acceso y las altas.
> **Juan Antonio:** Aprendimos a tomar decisiones técnicas por el entorno real: el servidor gratuito bloquea el correo, y en lugar de forzarlo lo reemplazamos por avisos.
> **Amoxhua:** Aprendimos que las revisiones sirven: nos hicieron encontrar y cerrar un hueco de seguridad en la base antes de entregar.
> **Emiliano:** Aprendimos a cuidar la experiencia: avisos claros, el avance siempre visible y una interfaz que funciona también en el celular.
> **Todos:** Gracias. Les enseñamos el sistema.

---

## 3. Guía de la demostración (8–10 min)

### Quién maneja qué

Una persona maneja el teclado y la pantalla en cada bloque y los demás complementan hablando. Orden recomendado:

| # | Bloque | Maneja y habla | Min |
|---|---|---|---|
| 1 | Pruebas automatizadas en terminal | **Juan Antonio** | 1 |
| 2 | Alumno: avance y evaluar a un docente | **Emiliano** | 2 |
| 3 | Coordinador: avance, alta de alumno, inscripción | **Mauricio** | 2 |
| 4 | Indicadores y estadísticas con gráficos | **Amoxhua** | 2.5 |
| 5 | Docente: su propio perfil | **Emiliano** | 0.5 |
| 6 | Base de datos real en Supabase | **Amoxhua** | 1 |

### Antes de empezar (30 minutos antes)

1. **Despertar el servidor.** Abrir `https://dygsis-backend.onrender.com/api/health`. Si tarda cerca de un minuto, es normal. Repetir hasta ver `{"status":"ok"}`.
2. **Confirmar que lo último ya está publicado.** Abrir `https://ingenieros-malas-influencias.vercel.app`, iniciar sesión como Coordinador y comprobar que existe **Estadísticas** en el menú. Si no aparece, el despliegue aún no terminó.
3. **Tres ventanas separadas, ya con la sesión iniciada** (usar ventanas de incógnito distintas o perfiles distintos, para no tener que cerrar sesión en vivo):
   - Coordinador: `COORD0001`
   - Alumno: `DEMO0005` (**no usar `DEMO0001`**: también es Administrador y se vería el menú equivocado)
   - Docente: `EMP0001`
   - La contraseña de las cuentas de demostración es la que ya conocen (la sembrada en el repositorio). **No la escriban con la pantalla compartida visible.**
4. **Terminal lista:** `cd backend` y dejar escrito `npm test` sin ejecutar.
5. **Supabase abierto** en el Table Editor, ya en la tabla `P_EvaluacionDocente_Evaluacion`.
6. **Un respaldo:** grabar antes un video corto de toda la demostración. Si falla el internet, se reproduce.
7. **No intentar iniciar sesión mal.** Cinco intentos fallidos con una cuenta la bloquean 15 minutos (sale 429).

### Estado de los datos de demostración (a la fecha de este guion)

- Ciclo activo: **Evaluacion Docente 2026-2027-1**.
- `DEMO0005` tiene **0 de 5** evaluaciones hechas: es la cuenta ideal para evaluar en vivo. `DEMO0002` ya terminó las 5.
- La participación hoy es **4 de 5 alumnos (80 %)** y 10 de 25 evaluaciones enviadas (40 %). **Al evaluar con `DEMO0005` esas cifras suben** (el alumno pasa a participar). No es un error: es una buena forma de mostrar que el avance se actualiza solo.
- Ranking actual: Ana García 8.13 (Bueno); Elena Torres, Carlos Martínez y Luis Hernández 7.50 (Suficiente); Beatriz Ramírez 6.67 (No suficiente). Las evaluaciones nuevas moverán estos números.
- **Aviso:** lo que hagan en la demostración **escribe en la base real**. Después se puede dejar como está o pedirme un script para dejar `DEMO0005` en 0 evaluaciones.

### Bloque 1 — Pruebas en la terminal (Juan Antonio, 1 min)
- **Hacer:** ejecutar `npm test` en `backend`.
- **Decir:** "Estas son las pruebas automatizadas: acceso, evaluaciones, cuentas, indicadores, estadísticas. Todas en verde." Mientras corre, comentar que cada servicio tiene sus pruebas y que además hay scripts contra la base real.
- **Mostrar:** el resumen final, 293 pruebas.
- **Ojo:** si en su copia local ya está el código de talleres, saldrán 323; está bien, solo no se asusten con la diferencia.

### Bloque 2 — El alumno (Emiliano, 2 min)
- **Hacer, en la ventana del alumno `DEMO0005`:**
  1. Dashboard: mostrar el **avance en 0 de 5** y la ventana de avisos o la **campana** con las evaluaciones pendientes.
  2. Ir a **Evaluaciones** y elegir un docente.
  3. Mostrar el cuestionario: **15 preguntas en 4 secciones, con la barra de avance fija arriba**, y que el botón **Enviar** no se habilita hasta contestar todo.
  4. Contestar rápido (clic en una opción de cada pregunta) y enviar.
  5. Volver al dashboard: el avance ahora dice **1 de 5**.
- **Decir:** "La interfaz no deja enviar a medias, pero la regla importante está en el servidor: si intentan reenviar la misma evaluación, el servidor responde 409."
- **Mostrar también (opcional, 15 s):** reducir la ventana al ancho de un celular para enseñar que se adapta.

### Bloque 3 — El Coordinador (Mauricio, 2 min)
- **Hacer, en la ventana del Coordinador:**
  1. **Dashboard:** avance en vivo y cambiar un filtro (carrera, grupo o ciclo). Mostrar que la participación subió por la evaluación recién enviada.
  2. **Alumnos y docentes:** dar de alta a un alumno nuevo (número de cuenta de prueba, por ejemplo `DEMOPRES01`) y mostrar que la contraseña es temporal.
  3. **Grupos:** abrir un grupo e inscribir al alumno por número de cuenta.
- **Decir:** "El coordinador da de alta, inscribe y ve el avance. Un coordinador no puede crear administradores: esa regla la valida el servidor."
- **Ojo:** el alta **crea una cuenta real**. Si no quieren dejarla, pídanme un script de limpieza después. Si prefieren no crearla, muestren solo el formulario.

### Bloque 4 — Indicadores y estadísticas (Amoxhua, 2.5 min)
- **Hacer, en la ventana del Coordinador:**
  1. **Indicadores docentes:** el ranking con promedio ponderado y la clasificación (Excelente, Bueno, Suficiente, No suficiente). Entrar al **detalle de un docente** y mostrar su histórico por ciclo y la variación.
  2. **Estadísticas:** las tarjetas (alumnos que participaron, evaluaciones enviadas, promedio institucional, docentes con promedio), la **dona por categoría**, la **línea de tendencia** y el **concentrado por carrera**.
  3. Cambiar el selector de ciclo a un ciclo anterior (hay ciclos históricos de demostración).
- **Decir:**
  - "Hay **dos porcentajes distintos a propósito**: alumnos que participaron, y evaluaciones enviadas sobre las que se debían enviar. Un alumno que evaluó 1 de 5 docentes ya cuenta como participante."
  - "Los rangos de clasificación son supuestos nuestros; estamos esperando la tabla oficial." **(Decirlo honestamente: es un pendiente real.)**
  - "Los ciclos anteriores son datos de demostración; en un ciclo sin inscripciones el avance se muestra como un guion y no como 0 %."
- **Mostrar el caso de privacidad:** el docente puede ver su promedio incluso con pocas evaluaciones; está anotado como mejora (SCRUM-85).

### Bloque 5 — El docente (Emiliano, 30 s)
- **Hacer, en la ventana del Docente `EMP0001`:** abrir **Mi perfil** y **Comparativo histórico**.
- **Decir:** "El docente solo ve lo suyo y en solo lectura; no puede ver a otros docentes."

### Bloque 6 — La base de datos real (Amoxhua, 1 min)
- **Hacer:** en Supabase, abrir `P_EvaluacionDocente_Evaluacion` y mostrar la fila de la evaluación recién enviada; abrir `P_EvaluacionDocente_RespuestaEvaluacion` y mostrar sus 15 respuestas.
- **Decir:** "Aquí quedó lo que acaba de enviar el alumno. Cada respuesta apunta a su pregunta y a la opción elegida." Y cerrar con seguridad: "Las tablas tienen seguridad por filas activada y no son accesibles con la clave pública de Supabase; solo el backend entra."

### Si alcanza el tiempo (extra de 1 minuto)
- **Cambio de contraseña con aprobación:** en la pantalla de inicio, "¿Olvidaste tu contraseña?" → mandar una solicitud → mostrar el **código de verificación** → como Coordinador, entrar a **Solicitudes de contraseña**, teclear el código y aprobar. **Cuidado:** esto cambia la contraseña de la cuenta que usen; usen una cuenta que no sea la de la demostración o se quedarán sin acceso. Es más seguro **solo mencionarlo**.
- **Talleres y laboratorios:** **solo si ya está publicado.** Si no, dígase "está en desarrollo".

### Plan B
| Si pasa esto | Hagan esto |
|---|---|
| El sitio tarda en responder | Es el servidor gratuito despertando. Hablar un minuto del problema o la arquitectura mientras tanto. |
| Sale "Demasiados intentos" (429) | Esperar 15 minutos o usar otra cuenta. Por eso no deben fallar la contraseña a propósito. |
| Falla el internet | Reproducir el video de respaldo. |
| El sitio publicado no tiene lo último | Correr local (`npm run dev` en `backend` y en `frontend`). **Ojo:** local usa la misma base real. |
| Algo se rompe en pantalla | No improvisar: decir "lo anotamos" y pasar al siguiente bloque. |

---

## 4. Preguntas probables y cómo responderlas

- **¿Por qué cambiaron de SQL Server a Supabase?** La suscripción de Azure superó el crédito; Supabase (PostgreSQL) es gratuito. El modelo y los repositorios por capas hicieron que el cambio fuera acotado.
- **¿Cómo se garantiza el anonimato?** La evaluación del alumno no se muestra con su nombre en los reportes. Con honestidad: hoy la base sí guarda quién respondió (hace falta para impedir que se evalúe dos veces); el anonimato está en cómo se muestran los resultados. Reforzarlo es parte de la bitácora y del sprint de seguridad.
- **¿Por qué no mandan correos?** Las cuentas no tienen buzón real y el servidor gratuito bloquea el correo. Lo reemplazamos por avisos en pantalla y por aprobación humana del cambio de contraseña.
- **¿Qué pasa si se olvida la contraseña?** Se manda una solicitud, y un coordinador o administrador la aprueba con un código de verificación. Si el único administrador la olvida, hoy se resuelve con un script, y está anotado.
- **¿Qué tan seguro está?** Contraseñas con bcrypt, token firmado de ocho horas, límite de intentos, permisos por rol validados en el servidor, tablas con seguridad por filas. Pendiente: revocar sesiones antes de las ocho horas y la bitácora de auditoría.
- **¿Qué falta para terminar?** Talleres y laboratorios, reportes en PDF, bitácora, pruebas de carga y documentación final.
- **¿Por qué hubo atraso?** Hubo sprints que se cerraron fuera de fecha; replanificamos y priorizamos lo demostrable. Cerramos el Sprint 3 y el 4 completos.
- **¿Los rangos de clasificación son oficiales?** No: son un supuesto nuestro (9, 8 y 7). Los vamos a ajustar con la tabla oficial.
- **¿Funciona en el celular?** Sí, la interfaz es adaptable; se puede mostrar reduciendo la ventana.
- **¿Qué pasaría con muchos usuarios a la vez?** Falta hacer las pruebas de carga (tarea SCRUM-58). El servidor gratuito no está pensado para carga alta.
