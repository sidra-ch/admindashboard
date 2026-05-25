import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { AppProviders } from '../components/app-providers';
import { ThemeProvider } from '../components/theme-provider';
import { Toaster } from '../components/ui/sonner';
import './globals.css';
import 'leaflet/dist/leaflet.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Velocity Fleet OS',
  description: 'Enterprise-grade AI-powered fleet management operating system for Australian mobility leaders.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${inter.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="velocity-theme">
          <AppProviders>
            {children}
            <Toaster richColors position="top-right" />
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
