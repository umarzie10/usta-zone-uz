import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useHeartbeat } from '@/hooks/useHeartbeat';

interface LayoutProps {
  children: ReactNode;
  noFooter?: boolean;
}

export default function Layout({ children, noFooter = false }: LayoutProps) {
  useHeartbeat();
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden w-full max-w-full">
      <Navbar />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {children}
      </main>
      {!noFooter && <Footer />}
    </div>
  );
}
