import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@/styles/fonts.css';
import '@/design-system/generated/tokens.css';
import '@/design-system/generated/bundle.css';
import '@/styles/app.css';

export const metadata: Metadata = {
  title: 'Oz Startup Brain — local fixture journey',
  description: 'Evidence-backed next steps for Australian founders. Local fixture mode: every program, round and source is fictional.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, colorScheme: 'light dark' };

/**
 * Sets data-theme before first paint from the founder's saved choice, else the system preference,
 * so neither theme flashes. The toggle in the header updates both the attribute and the saved value.
 */
const themeScript = `(function(){try{var t=localStorage.getItem('osb-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-AU" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
