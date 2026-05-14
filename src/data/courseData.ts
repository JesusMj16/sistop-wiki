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
        }
        
      ],
    },
  ],
};

export function notePath(sectionPath: string, notePath: string): string {
  return `/${sectionPath}/${notePath}`;
}
