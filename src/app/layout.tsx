import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/styles.css";
import "@/styles/responsive.css";
import "@/styles/uploader.css";
import "@/styles/results.css";
import "@/styles/batch-validation.css";
import ClientLayout from "@/components/layout/ClientLayout";
import { getMessages, getLocale } from 'next-intl/server';

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

// Get the base URL from environment variable, default to empty string
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

export const metadata: Metadata = {
  title: "Paperflow - Validate e-signed documents",
  description: "Securely validate e-signed documents using the Skribble API",
  openGraph: {
    images: [`${baseUrl}/images/og.png`],
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ClientLayout locale={locale} messages={messages}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
