import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: {
    default: "RedTours - Пътувания с характер",
    template: "%s | RedTours"
  },
  description:
    "Селектирани пътувания, авторски програми и персонално обслужване от RedTours.",
  metadataBase: new URL("https://redtours.bg")
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg">
      <body className={manrope.variable}>{children}</body>
    </html>
  );
}
