import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AuthProvider } from "@/providers/AuthProvider";
import { LoadingProvider } from "@/providers/LoadingProvider";
import { ToastProvider } from "@/providers/ToastProvider";

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
  title: "Squadio Web",
  description: "Squadio Web Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <LoadingProvider>
            <ToastProvider>{children}</ToastProvider>
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
