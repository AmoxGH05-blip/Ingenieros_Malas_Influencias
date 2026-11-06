# Guion de la presentación y guía de la demostración

**Equipo:** Juan Antonio (backend), Emiliano (frontend), Amoxhua (base de datos e indicadores), Mauricio (QA, documentación y Scrum Master).
**Duración sugerida:** presentación 10–12 min + demostración 8–10 min. Los cuatro hablan en ambas partes.

---

## 0. Lo primero: usen el PDF NUEVO

El PDF que traías (`DYGSIS-Presentacion-Avance-2026-11-05.pdf`) estaba desactualizado. **Ya se regeneró con las cifras de hoy:**

- `docs/DYGSIS-Presentacion-Avance-2026-11-06.pdf` (para proyectar)
- `docs/DYGSIS-Presentacion-Avance-2026-11-06.pptx` (editable)

Este guion sigue **esa** versión, con las mismas 16 diapositivas en el mismo orden. **No usen el PDF del 5 de noviembre**: dice cosas que ya no son ciertas (29 de 64 tareas, 236 pruebas, indicadores y cambio de contraseña pendientes).

Cifras de la versión nueva (verifíquenlas en `PROGRESS.md` antes de presentar):

| Dato | Valor |
|---|---|
| Tareas finalizadas | **44 de 64 (69 %)** |
| Sprints 0 a 4 | **completos** (Sprint 3: 7 de 7; Sprint 4: 7 de 7) |
| Sprint 5 | **5 de 7** (listos estadísticas con gráficos y talleres; faltan pruebas de carga y documentar el Prototipo 2). Venció hoy, 6 de noviembre. |
| Tareas nuevas 78 a 80 | 3 de 3 (y SCRUM-81, seguridad de la base, también cerrada) |
| Requerimientos | **14 listos, 4 parciales, 2 pendientes** (pendientes: RF09 reportes PDF y RNF04 respuesta menor a 3 s) |
| Pruebas automatizadas | **325** en 26 archivos |
| Base de datos | 25 tablas y 5 vistas |

**Cosa honesta que deben saber decir:** los talleres y laboratorios están publicados y activos, pero los resultados solo se ven con **5 evaluaciones o más** (por privacidad). La revisión de seguridad recomendó además mostrarlos solo con el ciclo cerrado; **eso queda como decisión pendiente** (ver la sección de preguntas).

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
> El sistema tiene cuatro roles y una jerarquía de altas. Hay una cuenta única de Administrador que da de alta a coordinadores y a otros administradores. El Coordinador da de alta a alumnos y docentes, crea materias y grupos, inscribe alumnos y ve el avance. El Estudiante responde sus evaluaciones y ve su propio avance. Y el Docente consulta sus indicadores y su comparativo histórico, en solo lectura. Los cuatro roles ya están implementados.
> Todos entran con su número de cuenta, no con correo, y el modelo funciona para varias carreras y facultades sin cambiar la base de datos.

### Diapositiva 4 — Avance · Mauricio
> Les resumo dónde estamos. Llevamos **44 de las 64 tareas del plan terminadas, el 69 %**. Los sprints 0 al 4 están completos. El Sprint 4 era el de indicadores y históricos, y lo cerramos, aunque fuera de fecha. En el Sprint 5, que venció hoy, llevamos cinco de siete: ya están las estadísticas con gráficos y los talleres y laboratorios; faltan las pruebas de carga y documentar el Prototipo 2.
> Además de las tareas del plan, cerramos tareas nuevas que salieron de las revisiones, por ejemplo la seguridad de la base de datos.

### Diapositiva 5 — Requerimientos · Mauricio
> En requerimientos, **14 están implementados, 4 parciales y 2 pendientes**. Ya funcionan el acceso por número de cuenta, la evaluación sin duplicados, el avance y los avisos, las altas jerárquicas, el cambio de contraseña con aprobación, y desde el último informe también las estadísticas con gráficos, los indicadores por docente y los talleres y laboratorios. Quedan pendientes los reportes en PDF y verificar el tiempo de respuesta menor a tres segundos; y cuatro requerimientos parciales, como la bitácora de auditoría.

### Diapositiva 6 — Arquitectura · Juan Antonio
> Del lado técnico, el sistema está hecho por capas. El frontend es React con Vite y Tailwind. La API es Express con TypeScript: los controladores reciben la petición, los servicios tienen la lógica de negocio, y los repositorios hablan con la base de datos mediante TypeORM. La base es PostgreSQL en Supabase.
> Todo está desplegado sin costo: el frontend en Vercel, que se actualiza solo en cada push a GitHub; la API en Render, que en el plan gratuito se duerme tras quince minutos sin tráfico y tarda cerca de un minuto en despertar; y la base en Supabase, con un flujo diario de GitHub Actions que la mantiene despierta.

### Diapositiva 7 — Modelo de datos · Amoxhua
> Yo me encargué del modelo de datos. Son 25 tablas y 5 vistas; aquí mostramos ocho tablas. Lo importante es la idea: el cuestionario es **un dato**, no código. Un instrumento tiene secciones, preguntas y opciones de respuesta, así que crear un cuestionario nuevo es insertar filas. Una evaluación es la respuesta de un alumno a un grupo en un periodo, y es única por alumno, grupo y periodo. No hay borrado en cascada y todas las restricciones tienen nombre propio, lo que facilita los mensajes de error y el mantenimiento.

### Diapositiva 8 — Acceso · Juan Antonio
> El acceso es por número de cuenta, con varios controles. La cuenta nueva trae una contraseña temporal y está obligada a cambiarla en su primer ingreso; mientras no lo haga, el servidor responde 403. Las contraseñas se guardan con bcrypt, nunca en texto plano. La sesión es un token firmado con vigencia de ocho horas. Hay un límite de intentos: cinco por cuenta y treinta por IP cada quince minutos. Y el error es genérico: no se distingue entre cuenta inexistente y contraseña incorrecta, para no dar pistas a un atacante.

### Diapositiva 9 — Flujo del alumno · Emiliano
> Así se ve el flujo para el alumno. Inicia sesión, ve su avance —por ejemplo, uno de cinco—, elige un docente y le carga el cuestionario: quince preguntas en cuatro secciones, con la escala de cero, 2.5, cinco, 7.5 y diez. Responde, envía, y el servidor guarda las respuestas y actualiza el avance.
> Lo clave es la regla del recuadro: **una sola evaluación por docente y grupo en cada periodo**, y esa regla la hace cumplir el servidor, no la interfaz. Si alguien intenta reenviar, recibe un 409.

### Diapositiva 10 — Coordinación · Emiliano
> Para coordinación ya funciona la gestión de grupos con cupo opcional e inscripciones, protegidas con una transacción para que dos inscripciones simultáneas no rebasen el cupo. Funciona también el avance en vivo, con filtros por carrera, grupo y ciclo. Y los avisos: al iniciar sesión, el alumno con evaluaciones pendientes ve una ventana y una campana, desde siete días antes del cierre. Decidimos no usar correos porque las cuentas no tienen buzón real. Y desde el último informe, coordinación también tiene estadísticas con gráficos y la configuración de talleres por carrera, que vamos a ver en la demostración.

### Diapositiva 11 — Decisiones · Amoxhua
> Esta diapositiva es de las decisiones que cambiaron el rumbo, y varias nos tocaron a la base de datos. Pasamos de Azure SQL Server a Supabase con PostgreSQL, porque la suscripción de Azure superó el crédito. Cambiamos el inicio de sesión de correo a número de cuenta porque la coordinadora nos dijo que no se usan correos personales. Cambiamos los recordatorios por correo por avisos en pantalla, porque el servidor gratuito bloquea el correo. Y la contraseña olvidada pasó de un enlace por correo a una **solicitud con aprobación**: quien olvidó su contraseña la solicita, y un coordinador o administrador la aprueba tecleando un código de verificación.
> Algo más: una revisión de seguridad nos mostró que las tablas de la base estaban abiertas a los roles públicos de Supabase. Lo corregimos: ahora esas tablas tienen seguridad por filas y el único acceso es nuestro backend.

### Diapositiva 12 — Calidad · Juan Antonio
> En calidad tenemos **325 pruebas automatizadas en verde**. Cubren acceso, evaluación, cuentas, grupos, avisos, indicadores, estadísticas, talleres y el cambio de contraseña. Probamos que un token manipulado se rechaza, que reenviar una evaluación da 409, que los permisos cruzados entre roles dan 403 y que el sexto intento de acceso da 429. Además tenemos scripts que comparan lo que devuelve la API con consultas independientes contra la base real.
> Sabemos qué falta: una bitácora de auditoría, poder revocar una sesión antes de las ocho horas, y las pruebas de carga.

### Diapositiva 13 — Demostración · Mauricio
> Con esto pasamos a la parte más importante: les mostramos el sistema funcionando, en producción, con la base real. Lo vamos a hacer entre los cuatro.

### Diapositiva 14 — Lo que falta · Mauricio
> Lo que falta: el Sprint 5 vence hoy con cinco de siete; quedan las pruebas de carga y documentar el Prototipo 2. Siguen el Sprint 6, con los cinco reportes en PDF y la bitácora de auditoría; el 7, de estabilización y QA; y el 8, de cierre y entrega. Hubo atrasos: el Sprint 4 terminó fuera de fecha. Priorizamos lo demostrable, y por eso hoy ya hay indicadores, gráficos y talleres funcionando. En el backlog también quedan tareas nuevas que salieron de las revisiones, como poder revocar sesiones.

### Diapositiva 15 — Riesgos y siguientes pasos · Amoxhua
> Los riesgos que seguimos vigilando: el Sprint 5 vence hoy con dos tareas pendientes; cada área depende de una sola persona; el servidor gratuito se duerme y puede afectar una demo; las cuentas de demostración tienen contraseña pública en un repositorio público, y las desactivaremos antes de la entrega final; y local y producción comparten la misma base de datos, así que cualquier prueba toca los mismos datos.
> Los siguientes pasos: cerrar las pruebas de carga y el Prototipo 2, hacer en el Sprint 6 los reportes en PDF y la bitácora, revocar sesiones y proteger la privacidad de los promedios, y congelar el alcance a mitad de cada sprint.

### Diapositiva 16 — Aprendizajes · los cuatro
> **Mauricio:** Aprendimos a escuchar al usuario real: la coordinadora nos hizo rediseñar el acceso y las altas.
> **Juan Antonio:** Aprendimos a tomar decisiones técnicas por el entorno real: el servidor gratuito bloquea el correo, y en lugar de forzarlo lo reemplazamos por avisos.
> **Amoxhua:** Aprendimos que las revisiones sirven: nos hicieron encontrar y cerrar un hueco de seguridad en la base antes de entregar.
> **Emiliano:** Aprendimos a cuidar la experiencia: avisos claros, el avance siempre visible y una interfaz que funciona también en el celular.
> **Todos:** Gracias. Les enseñamos el sistema.

---

## 3. Guía de la demostración (9–10 min)

### Quién maneja qué

Una persona maneja el teclado y la pantalla en cada bloque y los demás complementan hablando. Orden recomendado:

| # | Bloque | Maneja y habla | Min |
|---|---|---|---|
| 1 | Pruebas automatizadas en terminal | **Juan Antonio** | 1 |
| 2 | Alumno: avance y evaluar a un docente | **Emiliano** | 2 |
| 3 | Coordinador: avance, alta de alumno, inscripción | **Mauricio** | 2 |
| 4 | Indicadores y estadísticas con gráficos | **Amoxhua** | 2.5 |
| 5 | Talleres y laboratorios (configuración y evaluación) | **Juan Antonio** | 1.5 |
| 6 | Docente: su propio perfil | **Emiliano** | 0.5 |
| 7 | Base de datos real en Supabase | **Amoxhua** | 1 |

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

### Estado de los datos de demostración (6 de noviembre, por la tarde)

- Ciclo activo: **Evaluacion Docente 2026-2027-1**.
- `DEMO0005` tiene **0 de 5** evaluaciones de docentes hechas: es la cuenta ideal para evaluar en vivo. `DEMO0002` ya terminó las 5.
- **Talleres ya activados** para Ingeniería en Sistemas Computacionales, con tres de demostración: *Laboratorio de redes*, *Laboratorio de bases de datos* y *Taller de programación*. Ningún alumno los ha evaluado todavía.
- La participación hoy es **4 de 5 alumnos (80 %)** y 10 de 25 evaluaciones enviadas (40 %). **Al evaluar con `DEMO0005` esas cifras suben.** No es un error: es una buena forma de mostrar que el avance se actualiza solo.
- Ranking actual: Ana García 8.13 (Bueno); Elena Torres, Carlos Martínez y Luis Hernández 7.50 (Suficiente); Beatriz Ramírez 6.67 (No suficiente). Las evaluaciones nuevas moverán estos números.
- **Aviso:** lo que hagan en la demostración **escribe en la base real**. Pídanme un script para dejar `DEMO0005` en 0 evaluaciones y los talleres sin evaluar cuando terminen.

### Bloque 1 — Pruebas en la terminal (Juan Antonio, 1 min)
- **Hacer:** ejecutar `npm test` en `backend`.
- **Decir:** "Estas son las pruebas automatizadas: acceso, evaluaciones, cuentas, indicadores, estadísticas. Todas en verde." Mientras corre, comentar que cada servicio tiene sus pruebas y que además hay scripts contra la base real.
- **Mostrar:** el resumen final, 325 pruebas.
- **Ojo:** hay que tener la última versión del repositorio (`git pull`) y las dependencias instaladas; si no, el número será menor.

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

### Bloque 5 — Talleres y laboratorios (Juan Antonio, 1.5 min)
- **Hacer, en la ventana del Coordinador:** abrir **Talleres** en el menú. En **Configuración** mostrar la carrera con el interruptor **Habilitada** y sus tres talleres (y que se puede agregar uno o dar de baja). Pasar a **Resultados**.
- **Hacer, en la ventana del alumno `DEMO0005`:** abrir **Talleres** en el menú, entrar a *Laboratorio de redes*, contestar y enviar. Debe aparecer "Evaluado".
- **Volver a Resultados (Coordinador) y recargar:** el taller sigue sin cifras, con el aviso de que se muestran con 5 evaluaciones o más.
- **Decir:** "Un taller es una actividad de la carrera, no de un docente. Cada carrera puede encender o apagar esta evaluación. Los resultados no se publican hasta que haya al menos cinco evaluaciones, para que nadie pueda adivinar quién respondió: una revisión de seguridad nos señaló ese riesgo y lo corregimos."
- **Ojo:** con una sola evaluación **no van a ver promedios**, y está bien: es justo la protección que queremos mostrar. No intenten llegar a cinco en vivo.

### Bloque 6 — El docente (Emiliano, 30 s)
- **Hacer, en la ventana del Docente `EMP0001`:** abrir **Mi perfil** y **Comparativo histórico**.
- **Decir:** "El docente solo ve lo suyo y en solo lectura; no puede ver a otros docentes."

### Bloque 7 — La base de datos real (Amoxhua, 1 min)
- **Hacer:** en Supabase, abrir `P_EvaluacionDocente_Evaluacion` y mostrar la fila de la evaluación recién enviada; abrir `P_EvaluacionDocente_RespuestaEvaluacion` y mostrar sus 15 respuestas.
- **Decir:** "Aquí quedó lo que acaba de enviar el alumno. Cada respuesta apunta a su pregunta y a la opción elegida." Y cerrar con seguridad: "Las tablas tienen seguridad por filas activada y no son accesibles con la clave pública de Supabase; solo el backend entra."

### Si alcanza el tiempo (extra de 1 minuto)
- **Cambio de contraseña con aprobación:** en la pantalla de inicio, "¿Olvidaste tu contraseña?" → mandar una solicitud → mostrar el **código de verificación** → como Coordinador, entrar a **Solicitudes de contraseña**, teclear el código y aprobar. **Cuidado:** esto cambia la contraseña de la cuenta que usen; usen una cuenta que no sea la de la demostración o se quedarán sin acceso. Es más seguro **solo mencionarlo**.

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
- **¿Por qué no se ven los resultados de un taller?** Porque con menos de cinco evaluaciones (o en una carrera con menos de cinco alumnos) no se publica nada: ni promedio ni conteo. Con pocas respuestas se podría deducir quién respondió y qué calificó. Además queda una decisión pendiente: publicar los resultados solo cuando el ciclo esté cerrado.
- **¿Cómo se garantiza el anonimato?** La evaluación del alumno no se muestra con su nombre en los reportes. Con honestidad: hoy la base sí guarda quién respondió (hace falta para impedir que se evalúe dos veces); el anonimato está en cómo se muestran los resultados. Reforzarlo es parte del sprint de seguridad.
- **¿Por qué no mandan correos?** Las cuentas no tienen buzón real y el servidor gratuito bloquea el correo. Lo reemplazamos por avisos en pantalla y por aprobación humana del cambio de contraseña.
- **¿Qué pasa si se olvida la contraseña?** Se manda una solicitud, y un coordinador o administrador la aprueba con un código de verificación. Si el único administrador la olvida, hoy se resuelve con un script, y está anotado.
- **¿Qué tan seguro está?** Contraseñas con bcrypt, token firmado de ocho horas, límite de intentos, permisos por rol validados en el servidor, tablas con seguridad por filas. Pendiente: revocar sesiones antes de las ocho horas y la bitácora de auditoría.
- **¿Qué falta para terminar?** Reportes en PDF, bitácora de auditoría, pruebas de carga, documentación del Prototipo 2 y la documentación final.
- **¿Por qué hubo atraso?** Hubo sprints que se cerraron fuera de fecha; replanificamos y priorizamos lo demostrable. Cerramos el Sprint 3 y el 4 completos.
- **¿Los rangos de clasificación son oficiales?** No: son un supuesto nuestro (9, 8 y 7). Los vamos a ajustar con la tabla oficial.
- **¿Funciona en el celular?** Sí, la interfaz es adaptable; se puede mostrar reduciendo la ventana.
- **¿Qué pasaría con muchos usuarios a la vez?** Falta hacer las pruebas de carga (tarea SCRUM-58). El servidor gratuito no está pensado para carga alta.

---

## 5. URLs y cuentas para el día de la presentación

| Qué | URL |
|---|---|
| **Sistema (frontend)** | https://ingenieros-malas-influencias.vercel.app |
| **API (despertarla antes)** | https://dygsis-backend.onrender.com/api/health |
| **Repositorio** | https://github.com/AmoxGH05-blip/Ingenieros_Malas_Influencias |
| **Jira (tablero)** | https://proyecto-dygsis-787980372587.atlassian.net/jira/software/projects/SCRUM/boards |
| **Presentación (PDF)** | `docs/DYGSIS-Presentacion-Avance-2026-11-06.pdf` |

| Rol | Cuenta | Para qué |
|---|---|---|
| Coordinador | `COORD0001` | Avance, altas, grupos, indicadores, estadísticas, talleres |
| Alumno | `DEMO0005` | Evaluar un docente y un taller (0 de 5 hechas) |
| Docente | `EMP0001` | Mi perfil y comparativo |
| **No usar** | `DEMO0001` | También es Administrador: el menú no es el de un alumno |

La contraseña de las cuentas de demostración es la sembrada en el repositorio (la conocen); no la tecleen con la pantalla visible.
