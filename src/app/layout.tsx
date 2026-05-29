import type { ReactNode } from 'react';

export const metadata = {
  title: "Chuyi Content System",
  description: "Daily content automation system"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

