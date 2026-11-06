import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // The API key lives only in server code; nothing under NEXT_PUBLIC_ is used.
  poweredByHeader: false,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'no-store' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
      ],
    },
  ],
};

export default config;
