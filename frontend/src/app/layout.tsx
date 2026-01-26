"use client";

import type { Metadata } from "next";
import { useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/lib/theme-provider";
import { QueryProvider } from "@/lib/query-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { ProgressBar } from "@/components/ui/progress-bar";
// import { FeedbackProvider } from "tr-workspace-components"; // Temporarily disabled due to React.Children.only error

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Move metadata to a separate file due to "use client" directive
// export const metadata: Metadata = {
//   title: "Horizon",
//   description: "Program and project portfolio dashboard",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    let focusCount = 0;
    let visibilityCount = 0;

    const handleFocus = () => {
      focusCount++;
      console.log(`[FOCUS EVENT #${focusCount}] Window focused`);
    };

    const handleVisibility = () => {
      visibilityCount++;
      console.log(`[VISIBILITY EVENT #${visibilityCount}] State: ${document.visibilityState}`);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <ErrorBoundary>
          <QueryProvider>
            <ThemeProvider defaultTheme="system" storageKey="horizon-theme">
              <>
                <ProgressBar />
                <div className="flex flex-col min-h-screen">
                  <Navbar />
                  <main className="flex-1 flex flex-col min-h-0 overflow-auto md:overflow-hidden">
                    {children}
                  </main>
                </div>
                <Toaster position="top-right" />
              </>
            </ThemeProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
