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
export const GithubIcon = (p: Props) => (
  <svg viewBox="0 0 16 16" {...p}>
    <path
      fill="currentColor"
      d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
    />
  </svg>
);
