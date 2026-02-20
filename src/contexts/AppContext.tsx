import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations } from '@/lib/i18n';

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notification: { type: 'success' | 'error'; message: string } | null;
  showNotification: (type: 'success' | 'error', message: string) => void;
  t: (key: keyof typeof translations['uz']) => string;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('ustazone_lang') as Language) || 'uz';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('ustazone_theme') as 'light' | 'dark') || 'light';
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('ustazone_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ustazone_lang', lang);
  }, [lang]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const t = (key: keyof typeof translations['uz']): string => {
    return translations[lang][key] || translations['uz'][key] || key;
  };

  return (
    <AppContext.Provider value={{ lang, setLang, theme, toggleTheme, notification, showNotification, t }}>
      {children}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl font-medium shadow-xl animate-slide-in-right ${
          notification.type === 'success'
            ? 'bg-success text-success-foreground'
            : 'bg-destructive text-destructive-foreground'
        }`}>
          <span className="text-xl">{notification.type === 'success' ? '✓' : '✕'}</span>
          {notification.message}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
