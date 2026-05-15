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
      ],
    },
  ],
};

export function notePath(sectionPath: string, notePath: string): string {
  return `/${sectionPath}/${notePath}`;
}
