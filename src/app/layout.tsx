import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SwiftLog - AI-Powered SIWES Log Generation",
  description: "The smartest way for IT students to create professional SIWES logbook entries. Transform your weekly summaries into detailed daily logs with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-white" style={{ backgroundColor: 'white' }}>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body {
              background-color: white !important;
              margin: 0;
              padding: 0;
            }
            .hero-title, .hero-subtitle, .hero-buttons,
            .changelog-header, .changelog-entry {
              opacity: 1 !important;
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}
        style={{ backgroundColor: 'white' }}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
