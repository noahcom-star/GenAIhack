import './globals.css';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import AuthProviderWrapper from '@/lib/components/AuthProviderWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'HackBuddy - Find the Perfect Hackathon Partner',
  description: 'Connect with like-minded developers, designers, and innovators for your next hackathon.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <AuthProviderWrapper>
          <Suspense fallback={<div>Loading...</div>}>
            {children}
          </Suspense>
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
