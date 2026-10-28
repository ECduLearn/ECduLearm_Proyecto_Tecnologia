import type { ReactNode } from "react"

export type IconName = "arrow-left" | "bold" | "book" | "check" | "chevron" | "clock" | "download" | "file" | "info" | "italic" | "magic" | "menu" | "paperclip" | "plus" | "printer" | "redo" | "send" | "share" | "sparkles" | "undo" | "upload" | "user" | "x"

const iconPaths: Record<IconName, ReactNode> = {
  "arrow-left": (
    <>
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h11" />
    </>
  ),

  bold: (
    <>
      <path d="M7 5h6a4 4 0 0 1 0 8H7z" />
      <path d="M7 13h7a4 4 0 0 1 0 8H7z" />
    </>
  ),

  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      <path d="M8 7h8M8 11h6" />
    </>
  ),

  check: <path d="m5 12 4 4L19 6" />,

  chevron: <path d="m9 18 6-6-6-6" />,

  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),

  download: (
    <>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M5 20h14" />
    </>
  ),

  file: (
    <>
      <path d="M6 2h8l4 4v16H6z" />
      <path d="M14 2v5h5M9 12h6M9 16h6" />
    </>
  ),

  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),

  italic: <path d="M10 4h8M6 20h8M14 4 10 20" />,

  magic: (
    <>
      <path d="m15 4 5 5L8 21l-5-5Z" />
      <path d="m6 14 5 5M14 4l1-2M20 10l2 1M19 3l2-1M4 10 2-1" />
    </>
  ),

  menu: <path d="M4 7h16M4 12h16M4 17h16" />,

  paperclip: (
    <path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />
  ),

  plus: <path d="M12 5v14M5 12h14" />,

  printer: (
    <>
      <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </>
  ),

  redo: (
    <>
      <path d="m15 7 5 5-5 5" />
      <path d="M4 17a7 7 0 0 1 7-7h9" />
    </>
  ),

  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </>
  ),

  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
    </>
  ),

  sparkles: (
    <>
      <path d="m12 3-1.1 3.1A4.3 4.3 0 0 1 8.3 8.7L5 10l3.3 1.3a4.3 4.3 0 0 1 2.6 2.6L12 17l1.1-3.1a4.3 4.3 0 0 1 2.6-2.6L19 10l-3.3-1.3a4.3 4.3 0 0 1-2.6-2.6L12 3Z" />
      <path d="m5 3-.4 1.1a1.6 1.6 0 0 1-1 1L2.5 5.5l1.1.4a1.6 1.6 0 0 1 1 1L5 8l.4-1.1a1.6 1.6 0 0 1 1-1l1.1-.4-1.1-.4a1.6 1.6 0 0 1-1-1L5 3Z" />
    </>
  ),

  undo: (
    <>
      <path d="m9 7-5 5 5 5" />
      <path d="M20 17a7 7 0 0 0-7-7H4" />
    </>
  ),

  upload: (
    <>
      <path d="M12 16V4m0 0L7 9m5-5 5 5" />
      <path d="M4 15v5h16v-5" />
    </>
  ),

  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),

  x: <path d="m6 6 12 12M18 6 6 18" />,
}

export default function Icon({
  name,
  className = "size-5",
}: {
  name: IconName
  className?: string
}) {
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
      {iconPaths[name]}
    </svg>
  )
}

export function Logo() {
  return (
    <div className="flex items-center gap-3" aria-label="ECduLearn">
      <span className="grid size-10 place-items-center rounded-xl bg-ink-950 text-sand-50">
        <Icon name="book" className="size-5" />
      </span>
      <span className="text-lg font-bold tracking-tight text-sand-900">
        EC<span className="text-hint-600">du</span>Learn
      </span>
    </div>
  )
}
