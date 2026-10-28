import type { ReactNode } from "react";

export type ZoneIconName =
  | "algebra"
  | "arrow-left"
  | "book"
  | "brain"
  | "check"
  | "chevron"
  | "compass"
  | "formula"
  | "graduation"
  | "grid"
  | "key"
  | "logic"
  | "send"
  | "shield"
  | "sparkles"
  | "target";

const zoneIconPaths: Record<ZoneIconName, ReactNode> = {
  algebra: <path d="M4 6h7M7.5 2.5v7M14 4l6 6M20 4l-6 6M4 16h7M14 16h6M14 20h6" />,
  "arrow-left": (
    <>
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h11" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      <path d="M8 7h8M8 11h6" />
    </>
  ),
  brain: (
    <>
      <path d="M9.5 4.5A3 3 0 0 0 4 6.2 3.5 3.5 0 0 0 3 12a3.5 3.5 0 0 0 1.5 5.8A3 3 0 0 0 10 19.5V4.5Z" />
      <path d="M14.5 4.5A3 3 0 0 1 20 6.2a3.5 3.5 0 0 1 1 5.8 3.5 3.5 0 0 1-1.5 5.8 3 3 0 0 1-5.5 1.7V4.5ZM10 9H7.5M14 9h2.5M10 15H7.5M14 15h2.5" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m16 8-2.5 5.5L8 16l2.5-5.5Z" />
    </>
  ),
  formula: (
    <>
      <path d="M5 4h6M8 4v16M5 20h6M15 7l5 10M20 7l-5 10" />
    </>
  ),
  graduation: (
    <>
      <path d="m2 10 10-5 10 5-10 5Z" />
      <path d="M6 12.5V17c3 2 9 2 12 0v-4.5M22 10v6" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 9-9M16 7l3 3M14 9l3 3" />
    </>
  ),
  logic: (
    <>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M8 6h8M7 8l4 8M17 8l-4 8" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3-1.1 3.1A4.3 4.3 0 0 1 8.3 8.7L5 10l3.3 1.3a4.3 4.3 0 0 1 2.6 2.6L12 17l1.1-3.1a4.3 4.3 0 0 1 2.6-2.6L19 10l-3.3-1.3a4.3 4.3 0 0 1-2.6-2.6L12 3Z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
};

export default function ZoneIcon({ name, className = "size-5" }: { name: ZoneIconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {zoneIconPaths[name]}
    </svg>
  );
}
