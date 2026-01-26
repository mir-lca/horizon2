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
    console.log("[RootLayout] Mounting - setting up event listeners for debugging");

    const handleFocus = () => {
      console.log("[Window Event] Focus event triggered");
    };

    const handleVisibility = () => {
      console.log("[Document Event] Visibility changed:", document.visibilityState);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      console.log("[RootLayout] Unmounting - cleaning up event listeners");
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
