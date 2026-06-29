import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Hostel Management System — Enterprise Edition',
  description:
    'A production-ready, enterprise-grade hostel management platform for colleges and universities. Manage rooms, leaves, complaints, payments, and more.',
  keywords: ['hostel management', 'college hostel', 'Hostel Management System', 'room allocation', 'student portal'],
  openGraph: {
    title: 'Hostel Management System — Enterprise Edition',
    description: 'Manage your entire hostel operations digitally.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
