import type { Metadata } from "next";
import { Andika } from "next/font/google";
import "./globals.css";

const andika = Andika({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-andika",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tinku 2.0",
  description: "Plataforma pedagógica tri-lateral para alumnos, padres y docentes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={`${andika.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
