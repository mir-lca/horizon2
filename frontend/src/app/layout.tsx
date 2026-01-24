import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navbar, DateRangeProvider, BusinessUnitProvider } from "@/components/layout/navbar";
import { ThemeProvider } from "@/lib/theme-provider";
// import { FeedbackProvider } from "tr-workspace-components"; // Temporarily disabled due to React.Children.only error

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
        <ThemeProvider defaultTheme="system" storageKey="horizon-theme">
          <BusinessUnitProvider>
            <DateRangeProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1 flex flex-col min-h-0 overflow-auto md:overflow-hidden">
                  {children}
                </main>
              </div>
            </DateRangeProvider>
          </BusinessUnitProvider>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
