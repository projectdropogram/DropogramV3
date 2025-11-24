import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";
import { PlasmicClientRootProvider } from "@/components/PlasmicClientRootProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Dropogram | Homemade Food, Nearby",
  description: "Discover and order homemade food from your neighbors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${outfit.variable} antialiased`}
      >
        <ThemeProvider>
          <PlasmicClientRootProvider>
            {children}
          </PlasmicClientRootProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
