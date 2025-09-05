import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Suika Game Clone - Fruit Fusion Puzzle',
  description: 'A modern clone of the popular Suika (Watermelon) game. Merge fruits to create bigger ones in this addictive physics-based puzzle game!',
  keywords: 'suika game, watermelon game, fruit puzzle, merge game, physics game',
  authors: [{ name: 'Suika Game Clone' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
          {children}
        </div>
      </body>
    </html>
  );
}