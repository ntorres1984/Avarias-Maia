import './globals.css';

export const metadata = {
  title: 'Plataforma de Registo de Avarias',
  description: 'Unidades de Saúde da Maia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
