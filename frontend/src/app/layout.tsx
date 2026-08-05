import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/hooks/useAuth";
import "./globals.css";

const body = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Mutux | Thuê gear gaming cao cấp",
  description:
    "Marketplace thuê bàn phím, chuột, tai nghe và setup gaming hi-end.",
  icons: {
    icon: "/favicon.ico",
  },
};

import { CartProvider } from "@/features/cart/cart-context";
import { ToastProvider } from "@/components/ui/toast";
import NextTopLoader from "nextjs-toploader";

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
      <body className={`${body.variable} font-body`}>
        <NextTopLoader
          color="#d4af37"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #d4af37, 0 0 5px #d4af37"
        />
        <ToastProvider>
          <CartProvider>
            <AuthProvider>
              <AppShell>{children}</AppShell>
            </AuthProvider>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
