import type { ReactNode } from "react";

type IconProps = {
  className?: string;
};

export function Icon({ className = "", name }: IconProps & { name: string }) {
  const paths: Record<string, ReactNode> = {
    overview: <path d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-5H4v5Z" />,
    applications: <path d="M7 7V5a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v2h3v14H4V7h3Zm2 0h6V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v2Z" />,
    analytics: <path d="M5 19V9h3v10H5Zm6 0V4h3v15h-3Zm6 0v-7h3v7h-3Z" />,
    settings: <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Zm8.6-3.5c0-.5-.1-.9-.2-1.4l2-1.5-2-3.4-2.4 1a8 8 0 0 0-2.4-1.4L15.3 3h-4l-.4 2.3A8 8 0 0 0 8.5 6.7l-2.2-1-2 3.4 1.9 1.5a7.3 7.3 0 0 0 0 2.8l-1.9 1.5 2 3.4 2.2-1c.7.6 1.5 1 2.4 1.4l.4 2.3h4l.4-2.3a8 8 0 0 0 2.4-1.4l2.3 1 2-3.4-2-1.5c.1-.5.2-.9.2-1.4Z" />,
    search: <path d="m20 20-4.2-4.2M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    table: <path d="M4 5h16v14H4V5Zm0 5h16M9 5v14" />,
    pipeline: <path d="M4 7h5v10H4V7Zm7 0h5v10h-5V7Zm7 0h2v10h-2V7Z" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    chevron: <path d="m15 18-6-6 6-6" />,
    logout: <path d="M10 17v2H4V5h6v2M14 8l4 4-4 4M18 12H9" />,
    eye: <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
    more: <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm14 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}
