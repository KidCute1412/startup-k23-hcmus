import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-display",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Vanguard Elite | Thuê gear gaming cao cấp",
  description:
    "Marketplace thuê bàn phím, chuột, tai nghe và setup gaming hi-end theo phong cách Vanguard Elite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark scroll-smooth" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} font-body`}>
        <div className="flex min-h-screen flex-col bg-vanguard-light-bg text-vanguard-light-text transition-colors duration-300 dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
