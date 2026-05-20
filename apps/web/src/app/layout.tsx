import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Private Cloud',
  description: 'Platform cloud pribadi untuk penyimpanan file, catatan, jadwal, dan alat produktivitas.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-surface-950 font-sans text-surface-50 antialiased">
        {children}
      </body>
    </html>
  );
}
