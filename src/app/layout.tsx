import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Aditva Passes | Premium Ticket Distribution",
  description: "Seamless ticket distribution for high-end events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="grid-background" />
        <div className="hero-gradient" />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
