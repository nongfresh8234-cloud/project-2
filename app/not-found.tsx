import Link from 'next/link';
export default function NotFound() { return <main className="not-found"><h1>Page not found</h1><p>This page may have moved or the address is incorrect.</p><Link href="/" className="button primary">Back to dashboard</Link></main>; }
