import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EmBajio Operaciones - ERP de Inspeccion",
  description: "ERP para inspeccion y clasificacion de piezas industriales",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
