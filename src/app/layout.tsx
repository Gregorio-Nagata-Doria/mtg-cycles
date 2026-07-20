import { Header } from "@/components/Header";
import { Cormorant_Garamond, IBM_Plex_Sans } from "next/font/google";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
});

import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <html
        lang="en"
        data-theme="light"
        className={`${cormorant.variable} ${plexSans.variable} h-full antialiased bg-background`}
        suppressHydrationWarning
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem("theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}})()`,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col bg-background text-foreground  font-serif">
          <Header />
          <main className="flex-1">{children}</main>
        </body>
      </html>
    </>
  );
}
