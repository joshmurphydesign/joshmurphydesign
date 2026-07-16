import type { Metadata, Viewport } from "next";
import { Inter, Oxanium, Rajdhani, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { DataProvider } from "@/lib/data-context";

// Brand type system: Oxanium for headlines/hero moments, Space Grotesk for
// section headers/buttons/nav/labels, Inter for body copy, Rajdhani for
// streak counts and performance numbers.
const oxanium = Oxanium({
  variable: "--font-oxanium",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Ascend — Show Up. Stand Out. Rise Together.",
  description:
    "Ascend is a social accountability platform for athletes. Set goals, rally your people, compete with purpose, and ascend together.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#05070d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${oxanium.variable} ${spaceGrotesk.variable} ${inter.variable} ${rajdhani.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink-950 text-chalk-100">
        <AuthProvider>
          <DataProvider>{children}</DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
