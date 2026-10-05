import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Abuja Life — Live Your FCT Story",
  description: "A Sims-style life simulation game set in Abuja, Nigeria. From Kubwa corper hustle to Maitama elite soft life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen overflow-x-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
