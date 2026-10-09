import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Project 2 | Equipment management', description: 'Equipment borrowing and return management for your department.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
