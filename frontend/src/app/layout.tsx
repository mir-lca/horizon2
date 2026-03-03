import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { NavbarCompact } from "@/components/layout/navbar-compact";
import { ThemeProvider } from "@/lib/theme-provider";
import { QueryProvider } from "@/lib/query-provider";
import { OrgDataProvider } from "@/contexts/org-data-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { ProgressBar } from "@/components/ui/progress-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Horizon",
  description: "Program and project portfolio dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <ErrorBoundary>
          <QueryProvider>
            <OrgDataProvider>
              <ThemeProvider defaultTheme="system" storageKey="horizon-theme">
                <div className="contents">
                  <ProgressBar />
                  <div className="flex min-h-screen">
                    <Sidebar />
                    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
                      <NavbarCompact />
                      <main className="flex-1 flex flex-col min-h-0">
                        {children}
                      </main>
                    </div>
                  </div>
                  <Toaster position="top-right" />
                </div>
              </ThemeProvider>
            </OrgDataProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
