import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Q-Less: Digital Queueing & Appointment System for Mapúa',
  description: 'Mapúa University digital self-service kiosk, queueing, and appointment management system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased selection:bg-mapua-gold selection:text-mapua-black">
        {children}
      </body>
    </html>
  );
}
