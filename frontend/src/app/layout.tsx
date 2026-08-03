import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-display",
});

const body = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Vanguard Elite | Thuê gear gaming cao cấp",
  description:
    "Marketplace thuê bàn phím, chuột, tai nghe và setup gaming hi-end theo phong cách Vanguard Elite.",
};

import { CartProvider } from "@/features/cart/cart-context";
import { ToastProvider } from "@/components/ui/toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('color-theme');
                  var isDark = stored === 'light' ? false : (stored === 'dark' ? true : true);
                  if (!isDark) {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${display.variable} ${body.variable} font-body`}>
        <ToastProvider>
          <CartProvider>
            <AppShell>{children}</AppShell>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
