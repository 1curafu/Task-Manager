import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
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
  metadataBase: new URL('https://vela.works'),
  title: {
    default: "Vela - Set your sails",
    template: "%s | Vela"
  },
  description: "A modern team collaboration and task management platform designed to help you organize, track, and manage your work efficiently.",
  keywords: ["task management", "collaboration", "productivity", "teamwork", "project management"],
  openGraph: {
    title: "Vela - Set your sails",
    description: "A modern team collaboration and task management platform",
    url: 'https://vela.works',
    siteName: 'Vela',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Vela - Set your sails",
    description: "A modern team collaboration and task management platform",
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/vela_updated.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
