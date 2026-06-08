import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Today Satta Result | Live Satta King Result 2026 | Gali Desawar Faridabad Ghaziabad",
    template: "%s | Today Satta Result",
  },
  description:
    "Today Satta Results provides fast and accurate Satta King results, live updates, record charts, Delhi Bazar, Gali, Desawar, Faridabad and Ghaziabad results.",
    verification: {
      google: "bXizORxuTsUj31XTKd-Of9ok8giwf-YwXv-c-TOvlGA",
    },
    keywords: [
    "today satta result",
    "satta king result",
    "satta king",
    "satta result",
    "gali result",
    "desawar result",
    "ghaziabad result",
    "faridabad result",
    "satta king chart",
    "satta king 2026",
    "satta king live",
    "delhi bazar result",
    "shri ganesh result",
    "satta king today",
    "satta result today",
    "satta king gali",
    "satta king desawar",
    "monthly satta chart",
    "satta chart 2026",
    "satta king fast result",
    "live satta result",
    "todaysattaresult",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://todaysattaresult.com",
    siteName: "Today Satta Result",
    title: "Today Satta Result | Live Satta King Result 2026",
    description:
      "Superfast live Satta King results for Gali, Desawar, Ghaziabad, Faridabad & 100+ games. Free chart records 2015-2026.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://todaysattaresult.com",
  },
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
        <Toaster position="top-right" />
        <Header />
        <main className="flex-1">{children}</main>
        {/* <WhatsAppButton /> */}
      </body>
    </html>
  );
}
