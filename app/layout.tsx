import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Realytics — AI-Powered Real Estate Investment Analysis',
  description:
    'Make smarter real estate investment decisions with AI-powered financial analysis, market insights, and deal scoring for residential, commercial, multifamily, land, and development properties.',
  keywords: ['real estate', 'investment analysis', 'cap rate', 'cash flow', 'ROI', 'IRR', 'property analysis'],
  authors: [{ name: 'Realytics' }],
  openGraph: {
    title: 'Realytics — AI-Powered Real Estate Investment Analysis',
    description: 'Analyze any real estate deal in seconds with institutional-grade financial modeling.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ background: "#ffffff", color: "#0f172a" }} className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
