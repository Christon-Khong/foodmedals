import type { Metadata } from 'next'
import { Geist, Geist_Mono, Lexend, Playfair_Display, Lora } from 'next/font/google'
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

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://foodmedals.com'),
  title: 'FoodMedals — Community Food Rankings',
  description:
    'Community-powered restaurant rankings. Award Gold, Silver & Bronze medals to the best food in your city.',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/android-chrome-192x192.png',
  },
  openGraph: {
    title: 'FoodMedals — Community Food Rankings',
    description: 'Community-powered restaurant rankings. Award Gold, Silver & Bronze medals to the best food in your city.',
    type: 'website',
    url: 'https://foodmedals.com',
    siteName: 'FoodMedals',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FoodMedals — Community Food Rankings',
    description: 'Community-powered restaurant rankings. Award Gold, Silver & Bronze medals to the best food in your city.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${lexend.variable} ${playfair.variable} ${lora.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
