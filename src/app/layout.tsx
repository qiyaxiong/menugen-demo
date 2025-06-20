import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MenuGen - AI Menu Image Generator",
  description: "Upload a photo of a restaurant menu and generate beautiful AI images of each dish. Powered by OCR and AI image generation.",
  keywords: ["menu", "AI", "food", "image generation", "OCR", "restaurant"],
  authors: [{ name: "MenuGen Team" }],
  creator: "MenuGen",
  publisher: "MenuGen",
  openGraph: {
    title: "MenuGen - AI Menu Image Generator",
    description: "Transform restaurant menus into stunning food photos with AI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "MenuGen - AI Menu Image Generator",
    description: "Transform restaurant menus into stunning food photos with AI",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
