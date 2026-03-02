import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://foodmedals.com'),
  title: 'FoodMedals — Community Food Rankings for Utah Restaurants',
  description:
    'Vote for the best cheeseburgers, tacos, fries, and more. Award Gold, Silver & Bronze medals to your favorite restaurants.',
  openGraph: {
    title: 'FoodMedals — Community Food Rankings',
    type: 'website',
    url: 'https://foodmedals.com',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
