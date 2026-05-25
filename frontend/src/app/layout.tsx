import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Overengineered TODO',
  description: 'The most overengineered TODO app ever built',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
