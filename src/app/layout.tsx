import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
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
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {publishableKey ? (
          <ClerkProvider publishableKey={publishableKey}>
            {children}
          </ClerkProvider>
        ) : (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
            <div className="max-w-md mx-auto text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                MenuGen
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Please configure your Clerk authentication keys
              </p>
              <div className="text-left bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm">
                <p className="mb-2">1. Create a Clerk account at <a href="https://clerk.com" className="text-blue-600">clerk.com</a></p>
                <p className="mb-2">2. Get your keys from the dashboard</p>
                <p className="mb-2">3. Create a <code>.env.local</code> file with:</p>
                <pre className="text-xs bg-gray-800 text-green-400 p-2 rounded mt-2">
{`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
