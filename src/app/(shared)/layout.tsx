import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Calendrier Partagé | KidsFirst Planner',
  description: 'Consultez un calendrier de garde partagé.',
};

export default function SharedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
       <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Open+Sans:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-background">{children}</body>
    </html>
  );
}
