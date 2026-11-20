import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#2b4865',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'AssetCrest — Investor Dashboard',
  description:
    'AssetCrest Investor Dashboard, Crypto Deposits, Swaps, Vacation & Real Estate Portals, KYC Compliance, and Android WebAPK.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AssetCrest',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'AssetCrest — Investor Dashboard',
    description:
      'AssetCrest Investor Dashboard, Crypto Deposits, Swaps, Vacation & Real Estate Portals, KYC Compliance, and Android WebAPK.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AssetCrest — Investor Dashboard',
    description:
      'AssetCrest Investor Dashboard, Crypto Deposits, Swaps, Vacation & Real Estate Portals, KYC Compliance, and Android WebAPK.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="font-sans bg-[#f4f6f9] dark:bg-slate-950 text-[#2d3748] dark:text-slate-100 min-h-screen antialiased transition-colors duration-200"
      >
        <ServiceWorkerRegistrar />
        <OfflineIndicator />
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
