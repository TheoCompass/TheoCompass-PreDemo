import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";

// Configure our modern UI font
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
});

// Configure our academic heading font
const merriweather = Merriweather({ 
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"], 
  variable: "--font-merriweather",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TheoCompass | Explore Your Theological Profile",
  description: "A nuanced, data-driven map of the Christian theological landscape.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
