// src/app/layout.tsx
// Root layout for the Grafton Safaris Booking System

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Book Your Safari — Grafton Safaris & Travel Management',
  description: 'Reserve your African safari adventure with Grafton Safaris. Browse fixed departure dates, custom packages, and secure your spot in minutes.',
  keywords: ['Grafton Safaris', 'Africa safari booking', 'Kenya safari', 'Tanzania safari', 'Northern Highlights small group tour'],
  authors: [{ name: 'Grafton Safaris & Travel Management' }],
  metadataBase: new URL('https://booking.graftonsafaris.com'),
  openGraph: {
    title: 'Book Your Safari — Grafton Safaris',
    description: 'Your African safari adventure starts here. Secure your spot on a fixed departure or inquire about a custom package.',
    url: 'https://booking.graftonsafaris.com',
    siteName: 'Grafton Safaris Booking',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
