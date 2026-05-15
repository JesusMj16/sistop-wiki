import type { Course } from '../types/course';

export const COURSE: Course = {
  title: 'Sistemas Operativos',
  subtitle: 'Una guia de Estudio',
  author: 'Mtro. Gabriel Geronimo Castillo',
  semester: '602-B',
  sections: [
    {
      id: 's1',
      number: '01',
      title: 'Introducción',
      summary: 'El conjunto de programas para la administración de los recursos de un dispositivo de computo',
      duration: '≈ 25 min',
      path: 'introduccion',
      notes: [
        {
          id: 'n1-1',
          title: 'Introducción a los Sistemas Operativos',
          kind: 'lectura',
          path: 'sistemas-operativos',
        },
      ],
    },
    {
      id: 's2',
      number: '02',
      title: 'Procesos e Hilos',
      summary: 'Conceptos de procesos e hilos, caracteristicas y mecanismos de administación',
      duration: '',
      path: 'procesos',
      notes: [
        {
          id: 'n2-1',
          title: 'Introducción a Procesos',
          kind: 'sintesis',
          path: 'intro-procesos',
        },
        {
          id:'n2-2',
          title: 'Control de Procesos',
          kind: 'concepto',
          path: 'control-procesos',
        },
        {
          id:'n2-3',
          title: 'Sistema de llamado para crear procesos',
          kind: 'concepto',
          path: 'systemcall-procesos',
        },
        {
          id:'n2-4',
          title: 'Identificar Procesos',
          kind: 'concepto',
          path: 'identify-process',
        },
        {
          id: 'n2-5',
          title: 'Llamadas de wait',
          kind: 'concepto',
          path: 'llamada-wait',
        },
        {
          id: 'n2-6',
          title: 'Llamadas de exit',
          kind: 'concepto',
          path: 'llamada-exit',
        },
        {
          id: 'n2-7',
          title: 'Estado zombi',
          kind: 'concepto',
          path: 'zombies',
        },
        {
          id: 'n2-8',
          title: 'Hilos POSIX',
          kind: 'concepto',
          path: 'hilos',
        }

      ],
    },
    {
      id: 's3',
      number: '03',
      title: 'Mecanismos de comunicación entre procesos - IPC',
      summary: 'Tecnicas que el sistema operativo ofrece para que los procesos intercambien informacion y se sincronicen',
      duration: '',
      path: 'ipc',
      notes: [
        {
          id: 'n3-1',
          title: '3.0 Introducción a IPC',
          kind: 'sintesis',
          path: 'intro-ipc',
        },
        {
          id: 'n3-2',
          title: '3.1.1 Tuberías sin nombre - pipe',
          kind: 'concepto',
          path: 'pipes',
        },
        {
          id: 'n3-3',
          title: '3.1.2 Tuberías con nombre - fifo',
          kind: 'concepto',
          path: 'fifos',
        },
        {
          id: 'n3-4',
          title: '3.2.1 Llaves',
          kind: 'concepto',
          path: 'llaves',
        },
        {
          id: 'n3-5',
          title: '3.2.2 Semáforos en derivados de System V',
          kind: 'concepto',
          path: 'semaforos-sysv',
        },
        {
          id: 'n3-6',
          title: '3.3 Memoria compartida',
          kind: 'concepto',
          path: 'memoria-compartida',
        },
        {
          id: 'n3-7',
          title: '3.4 Cola de mensajes',
          kind: 'concepto',
          path: 'cola-mensajes',
        },
        {
          id: 'n3-8',
          title: '3.5 Información de IPC por medio de comandos del sistema',
          kind: 'referencia',
          path: 'comandos-ipc',
        },
      ],
    },
    {
      id: 's4',
      number: '04',
      title: 'Interbloqueo e Inanición',
      summary: 'Procesos atorados esperando recursos, cómo prevenirlo, detectarlo y predecirlo',
      duration: '',
      path: 'interbloqueo',
      notes: [
        {
          id: 'n4-1',
          title: '4.1 Inanición y condiciones de Coffman',
          kind: 'concepto',
          path: 'inanicion',
        },
        {
          id: 'n4-2',
          title: '4.2 Prevención del bloqueo mutuo',
          kind: 'concepto',
          path: 'prevencion',
        },
        {
          id: 'n4-3',
          title: '4.3 Algoritmo del banquero',
          kind: 'concepto',
          path: 'banquero',
        },
        {
          id: 'n4-4',
          title: '4.4 Detección del bloqueo mutuo',
          kind: 'concepto',
          path: 'deteccion',
        },
        {
          id: 'n4-5',
          title: '4.5 Predicción del bloqueo mutuo',
          kind: 'concepto',
          path: 'prediccion',
        },
      ],
    },
    {
      id: 's5',
      number: '05',
      title: 'Administración de memoria',
      summary: 'Cómo el sistema operativo reparte, mide y vigila la memoria principal entre los procesos activos',
      duration: '',
      path: 'memoria',
      notes: [
        {
          id: 'n5-1',
          title: '5.1 Introducción a la memoria',
          kind: 'concepto',
          path: 'intro',
        },
      ],
    },
    {
      id: 's6',
      number: '06',
      title: 'Proyecto Minishell',
      summary: 'Construcción de una shell minimalista en C que integra las llamadas al sistema vistas en el curso',
      duration: '',
      path: 'proyecto-minishell',
      notes: [
        {
          id: 'n6-1',
          title: '6.0 Introducción al proyecto',
          kind: 'sintesis',
          path: 'intro',
        },
        {
          id: 'n6-2',
          title: '6.1 Arquitectura: el bucle REPL',
          kind: 'concepto',
          path: 'arquitectura',
        },
        {
          id: 'n6-3',
          title: '6.2 Comandos del sistema de archivos',
          kind: 'concepto',
          path: 'comandos-fs',
        },
        {
          id: 'n6-4',
          title: '6.3 Comandos de información del sistema',
          kind: 'concepto',
          path: 'comandos-sistema',
        },
      ],
    },
  ],
};

export function notePath(sectionPath: string, notePath: string): string {
  return `/${sectionPath}/${notePath}`;
}
