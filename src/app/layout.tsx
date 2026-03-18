import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Plataforma de Avarias · Maia',
  description: 'Registo e reporte de avarias nas unidades de saúde da Maia',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
