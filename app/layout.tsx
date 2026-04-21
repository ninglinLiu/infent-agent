import type { Metadata, Viewport } from "next"
import { DM_Sans, Syne } from "next/font/google"
import "./globals.css"
import { BRAND } from "@/lib/brand"
import { Providers } from "./providers"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: `${BRAND.full}`,
  description:
    "Omni-Intelligent Investment Advisor & Risk Management AI — lightweight financial copilot for ordinary investors. Natural-language strategy generation, live risk monitoring, and one-click portfolio execution.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070809",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${dmSans.variable} ${syne.variable} ${dmSans.className} bg-[var(--bg-0)] text-[var(--fg-0)]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
