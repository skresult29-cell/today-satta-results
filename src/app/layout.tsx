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
    default: "Today Satta Result 2026 | Live Gali, Desawar, Faridabad & Ghaziabad Results",
    template: "%s | Today Satta Result",
  },
  description:
    "Check Today Satta Result 2026 with live Satta King results for Gali, Desawar, Faridabad and Ghaziabad. Get fast daily updates, charts, records and market results.",
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
    url: "https://todaysattaresults.com",
    siteName: "Today Satta Result",
    title: "Today Satta Result 2026 | Live Gali, Desawar, Faridabad & Ghaziabad Results",
    description:
      "Check Today Satta Result 2026 with live Satta King results for Gali, Desawar, Faridabad and Ghaziabad. Get fast daily updates, charts, records and market results.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.todaysattaresults.com",
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
