import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";



export const metadata: Metadata = {
  title: "Gym Portal"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900">
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
