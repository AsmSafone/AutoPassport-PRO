import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'AutoPassport PRO — AI Passport Photo Generator',
    template: '%s | AutoPassport PRO'
  },
  description: 'Generate perfect biometrically-compliant passport photos in seconds. Professional AI background removal, auto-cropping, and multi-country presets with various print layout.',
  keywords: ['passport photo generator', 'biometric photo', 'visa photo maker', 'AI background removal', 'automatic passport photo', 'passport photo print layout', 'online passport photo maker'],
  authors: [{ name: 'Safone', url: 'https://safone.dev' }],
  creator: 'Safone',
  publisher: 'Safone',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    title: 'AutoPassport',
    statusBarStyle: 'default',
    capable: true,
  },
  metadataBase: new URL('https://autopassport.pro.bd'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'AutoPassport PRO — AI Passport Photo Generator',
    description: 'Professional AI-powered passport photos in seconds. Auto-crop, BG remove, and various print sheets.',
    url: 'https://autopassport.pro.bd',
    siteName: 'AutoPassport PRO',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AutoPassport PRO',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoPassport PRO — AI Passport Photo Generator',
    description: 'Generate perfect passport photos automatically with AI.',
    creator: '@safone',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

