import type { ComponentType, SVGProps } from 'react';
import type { NoteKind } from '../types/course';
import { ArrowIcon, BulbIcon, ListIcon, SparkIcon } from '../components/Icons/Icons';

export const KIND_LABEL: Record<NoteKind, string> = {
  lectura: 'Lectura',
  concepto: 'Concepto',
  referencia: 'Referencia',
  ejercicio: 'Ejercicio',
  diagrama: 'Diagrama',
  sintesis: 'Síntesis',
  siguiente: 'Siguiente',
};

export const KIND_ICON: Record<NoteKind, ComponentType<SVGProps<SVGSVGElement>>> = {
  lectura: ListIcon,
  concepto: BulbIcon,
  referencia: ListIcon,
  ejercicio: SparkIcon,
  diagrama: SparkIcon,
  sintesis: BulbIcon,
  siguiente: ArrowIcon,
};
