import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hotel Cleaning Manager",
  description: "Internal staff manual and task management system",
  appleWebApp: {
    capable: true,
    title: "Cleaning App",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${inter.variable} font-sans antialiased text-black bg-[#e5e5e5]`}
      >
        <div className="max-w-[480px] mx-auto bg-[#fdfdfd] min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
          <main
            className="flex-1 w-full"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}
          >
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
