import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement>;

export const CheckIcon = (p: Props) => (
  <svg viewBox="0 0 16 16" {...p}>
    <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const CircleIcon = (p: Props) => (
  <svg viewBox="0 0 16 16" {...p}>
    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);
export const BookmarkIcon = (p: Props) => (
  <svg viewBox="0 0 16 16" {...p}>
    <path d="M4 2.5h8v11l-4-3-4 3z" fill="currentColor" />
  </svg>
);
export const BookmarkOIcon = (p: Props) => (
  <svg viewBox="0 0 16 16" {...p}>
    <path d="M4 2.5h8v11l-4-3-4 3z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);
export const SearchIcon = (p: Props) => (
  <svg viewBox="0 0 16 16" {...p}>
    <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
export const PencilIcon = (p: Props) => (
  <svg viewBox="0 0 16 16" {...p}>
    <path d="M2.5 13.5l1-3 7-7 2 2-7 7-3 1z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);
export const ArrowIcon = (p: Props) => (
  <svg viewBox="0 0 16 16" {...p}>
    <path d="M5 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const MenuIcon = (p: Props) => (
  <svg viewBox="0 0 16 16" {...p}>
    <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
export const ClockIcon = (p: Props) => (
  <svg viewBox="0 0 16 16" {...p}>
    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
export const SparkIcon = (p: Props) => (
  <svg viewBox="0 0 16 16" {...p}>
    <path d="M8 1.5L9.5 6 14 7.5 9.5 9 8 13.5 6.5 9 2 7.5 6.5 6z" fill="currentColor" />
  </svg>
);
export const BulbIcon = (p: Props) => (
  <svg viewBox="0 0 16 16" {...p}>
    <path d="M5.5 10.5c-1-.8-1.5-2-1.5-3.3 0-2.3 1.8-4.2 4-4.2s4 1.9 4 4.2c0 1.3-.5 2.5-1.5 3.3v1.7h-5z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M6 13h4M7 14.5h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
export const WarnIcon = (p: Props) => (
  <svg viewBox="0 0 16 16" {...p}>
    <path d="M8 2L14.5 13.5h-13z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M8 6.5v3.5M8 11.8v.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
export const ListIcon = (p: Props) => (
  <svg viewBox="0 0 16 16" {...p}>
    <circle cx="3" cy="4" r="1" fill="currentColor" />
    <circle cx="3" cy="8" r="1" fill="currentColor" />
    <circle cx="3" cy="12" r="1" fill="currentColor" />
    <path d="M6 4h8M6 8h8M6 12h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
