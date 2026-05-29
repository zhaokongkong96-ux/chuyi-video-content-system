import type { ReactNode } from 'react';

export const metadata = {
  title: 'Chuyi Content System',
  description: 'Cloud social publishing and content production system for Chuyi.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
