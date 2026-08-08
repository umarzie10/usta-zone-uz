import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FirstLoginTrialBanner from './FirstLoginTrialBanner';
import AIAssistant from './AIAssistant';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface LayoutProps {
  children: ReactNode;
  noFooter?: boolean;
}

function useReferralCapture() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) localStorage.setItem('ustazone_ref', ref.toUpperCase());
  }, []);
}

export default function Layout({ children, noFooter = false }: LayoutProps) {
  useReferralCapture();
  useHeartbeat();
  useScrollReveal();
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden w-full max-w-full">
      <Navbar />
      <FirstLoginTrialBanner />
      <main key={pathname} className="flex-1 w-full max-w-full overflow-x-hidden page-enter">
        {children}
      </main>
      {!noFooter && <Footer />}
    </div>
  );
}
