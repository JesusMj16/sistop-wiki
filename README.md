# Sistop Wiki

**Guía de estudio interactiva para Sistemas Operativos** — una wiki de notas en formato neo-brutalista construida con React, TypeScript y Vite. Reúne explicaciones de teoría, código en C anotado línea por línea, diagramas animados y referencias de comandos, todo organizado como un libro de curso con progreso persistente.

## ¿Qué es esto?

Este proyecto nace de la materia **Sistemas Operativos** del sexto semestre de Ingeniería en Computación en la **Universidad Tecnológica de la Mixteca**. La idea original era tomar apuntes y, al ir refinándolos, terminaron convirtiéndose en un material consultable que cubre los temas centrales del curso con el estilo de un manual visual:

- **Procesos** — creación, identificación, terminación, hilos, estado zombi.
- **IPC** — pipes, FIFOs, llaves, semáforos System V, memoria compartida, colas de mensajes y los comandos `ipcs`/`ipcrm`.
- **Interbloqueo** — inanición, prevención, algoritmo del banquero, detección y predicción.
- **Administración de memoria** — la introducción al tema (en desarrollo).
- **Proyecto Minishell** — documentación completa de una shell minimalista escrita en C, con cada comando explicado en términos de la llamada al sistema que envuelve.

Cada nota se renderiza como una tarjeta independiente con cabecera, contenido y herramientas (marcar como leída, guardar como favorita, escribir nota personal). El progreso de lectura, los favoritos y las notas se persisten en `localStorage`, así que un lector puede cerrar la pestaña y volver más tarde sin perder nada.

## Estado actual

| Sección | Notas | Estado |
|---|---|---|
| 01 Introducción | 1 nota | Listo |
| 02 Procesos e hilos | 8 notas | Listo |
| 03 IPC | 8 notas | Listo |
| 04 Interbloqueo | 5 notas | Listo |
| 05 Memoria | 1 nota | En desarrollo |
| 06 Proyecto Minishell | 4 notas | Listo |

## Características

- **Lectura responsiva** con tres modos de densidad (compacta, regular, cómoda) y tamaño de fuente ajustable.
- **Modo oscuro** con tokens semánticos `--bx-*` que controlan bordes, superficies y fills en un solo lugar.
- **Cinco paletas de color** intercambiables (Terracota, Bosque, Cobalto, Ciruela, Bronce) que se aplican en tiempo real vía propiedades CSS personalizadas.
- **Búsqueda global** del curso en el sidebar — busca por título de nota o sección.
- **Minimapa de progreso** sticky que muestra cada nota como un dot navegable y marca la actual.
- **Animaciones de conceptos** — ilustraciones interactivas para fork(), wait()/waitpid(), abanico de procesos y copy-on-write, todas hechas a mano con CSS/SVG en estilo "panel de cómic".
- **Componente `CodeExplain`** que renderiza código en C línea a línea con una nota explicativa pegada a cada renglón — útil para desmenuzar ejemplos largos.
- **Panel de Ajustes** flotante (icono `✦` en la esquina) accesible para cualquier visitante: paleta, modo oscuro, tamaño de lectura y densidad.

## Stack técnico

- **React 19** con `react-router-dom 7` para el ruteo declarativo.
- **TypeScript** estricto para todo el código de aplicación.
- **Vite** como bundler/dev server.
- **CSS puro** con custom properties (sin Tailwind ni preprocesadores). Toda la estética neo-brutalista vive en archivos `.css` por componente.
- **lucide-react** únicamente para iconos puntuales; el resto son SVGs propios en [Icons.tsx](src/components/Icons/Icons.tsx).

No hay backend: todo el estado se guarda en `localStorage` del navegador.

## Cómo correrlo

Necesitas Node ≥ 20.

```bash
# Clona el repo
git clone https://github.com/JesusMj16/sistop-wiki.git
cd sistop-wiki

# Instala dependencias
npm install

# Arranca el dev server (Vite)
npm run dev

# Compila para producción
npm run build

# Sirve el build de producción localmente
npm run preview

# Lint
npm run lint
```

El dev server arranca en `http://localhost:5173` por defecto.

## Cómo agregar una nota nueva

1. Crea el archivo de la nota en [src/pages/notes/](src/pages/notes/), por ejemplo `MiNota.tsx`:
   ```tsx
   import { P, H2, List, Callout, CodeExplain } from '../../components/ui/Prose';

   export default function MiNota() {
     return (
       <>
         <P>Texto de introducción...</P>
         <H2>Encabezado</H2>
         <List>
           <li><strong>Punto:</strong> contenido.</li>
         </List>
       </>
     );
   }
   ```
2. Registra la ruta en [src/router.tsx](src/router.tsx):
   ```ts
   import MiNota from './pages/notes/MiNota';
   // ...
   { path: 'seccion/mi-nota', Component: MiNota },
   ```
3. Añade la entrada en [src/data/courseData.ts](src/data/courseData.ts) dentro del array `notes` de la sección correspondiente:
   ```ts
   {
     id: 'nX-Y',
     title: 'Título legible',
     kind: 'concepto', // o 'sintesis', 'referencia', 'ejercicio', 'lectura'
     path: 'mi-nota',
   }
   ```

El sidebar y el minimapa se regeneran automáticamente desde `courseData.ts`.

## Componentes de prosa disponibles

Importables desde `components/ui/Prose`:

| Componente | Para qué sirve |
|---|---|
| `P` | Párrafo estándar con sangrado y drop-cap en el primero. |
| `H2`, `H3`, `H4` | Títulos con barra de color (yellow, accent, blue). |
| `List` | Lista no ordenada con bullets brutalistas. |
| `Code` | Bloque de código en una "ventana de terminal" con tres puntos. |
| `Callout` | Caja destacada en 5 tonos: `idea`, `warn`, `info`, `success`, `danger`. |
| `Quote` | Cita extensa con comillas decorativas. |
| `Table` | Tabla simple con header destacado. |
| `CodeExplain` | Código C línea a línea con notas adjuntas. |
| `ProcessFan` | Animación: 5 estados del proceso desplegados en abanico. |
| `ForkTree` | Animación: árbol de fork() con padre/hijo. |
| `Thinkers` | Tarjetas estilo "tarot" para conceptos o autores. |
| `CowAnimation` | Cómic explicando copy-on-write. |
| `WaitTimeline`, `WaitpidMatrix` | Animaciones interactivas para wait()/waitpid(). |

## Convenciones de estilo

El proyecto sigue una estética **neo-brutalista**: bordes negros gruesos, sombras planas con offset, mayúsculas, espaciado generoso. Los tokens semánticos están en [src/index.css](src/index.css):

- `--bx-surface` / `--bx-surface-on` — paneles blancos y su texto.
- `--bx-fill` / `--bx-fill-on` — fills sólidos oscuros y su texto.
- `--bx-border` — bordes y separadores.
- `--bx-shadow` — sombra hard-offset.
- `--bx-highlight` / `--bx-highlight-on` — superficies tipo callout amarillo.
- `--accent` — color de marca (cambia por paleta).
- `--hi-cobalt`, `--hi-emerald`, `--hi-amber`, `--hi-grape`, `--hi-rose` — colores temáticos para tipos de nota y callouts.

Todos los tokens se invierten en modo oscuro mediante el selector `[data-theme='dark']` en el mismo archivo. Cualquier componente nuevo debe usar **únicamente** estas variables (nunca `#000`/`#fff` literales) para mantener el switch de tema funcional.

## Autores

Trabajo realizado por estudiantes del sexto semestre de Ingeniería en Computación en la Universidad Tecnológica de la Mixteca:

- **Dante Neil Martínez Jiménez** — [@NeilDMJ](https://github.com/NeilDMJ)
- **Jesús Alfonso Morales Jaimes** — [@JesusMj16](https://github.com/JesusMj16)

Profesor de la materia: **M.C. Gabriel Gerónimo Castillo**.

## Créditos y fuentes

- Tipografía: **Fraunces** (chunky serif) como tipografía de display y **Arial** como cuerpo. Iconos y SVGs hechos a mano salvo los importados de `lucide-react`.
- El estilo neo-brutalista está inspirado en sitios como *gumroad* y *neobrutalism.dev*, llevado a un lenguaje de "panel de cómic" para encajar con el tono didáctico.
- Material académico de la materia *Sistemas Operativos* impartida por el M.C. Gabriel Gerónimo Castillo en la UTM.

## Licencia

Este proyecto es de uso educativo. Si vas a reutilizar contenido, por favor da crédito a los autores y al curso original.
