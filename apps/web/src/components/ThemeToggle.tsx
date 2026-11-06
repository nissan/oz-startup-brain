'use client';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

/** Reads the theme the layout script applied before paint, and lets the founder switch and keep it. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    const t = document.documentElement.getAttribute('data-theme');
    setTheme(t === 'dark' ? 'dark' : 'light');
  }, []);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-pressed={theme === 'dark'}
      onClick={() => {
        document.documentElement.setAttribute('data-theme', next);
        try {
          localStorage.setItem('osb-theme', next);
        } catch {
          /* storage may be unavailable; the attribute still applies for this page */
        }
        setTheme(next);
      }}
    >
      <span aria-hidden="true">{theme === 'dark' ? '☼' : '☾'}</span>
      {theme === null ? 'Theme' : theme === 'dark' ? 'Dark theme' : 'Light theme'}
    </button>
  );
}
