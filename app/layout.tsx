import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { computeDongMedians, loadDongGeoJson, loadPolicyData, loadRentData } from "@/lib/data";
import { AppProvider } from "./components/AppProvider";
import SiteChat from "./components/SiteChat";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
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
  title: {
    default: "집구해조 | 청년 실질 주거비 진단",
    template: "%s | 집구해조",
  },
  description: "지원정책을 반영한 청년 실질 주거비 계산 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // 모든 페이지가 같은 데이터·조건을 쓰도록 여기서 한 번 읽는다
  const data = {
    policies: loadPolicyData(),
    dongMedians: computeDongMedians(loadRentData()),
    geojson: loadDongGeoJson(),
  };

  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppProvider data={data}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <SiteChat />
        </AppProvider>
      </body>
    </html>
  );
}
