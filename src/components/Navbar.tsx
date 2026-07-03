import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Sun, Moon, Globe, Menu, X, User, LogOut, LayoutDashboard,
  ShieldCheck, Search, Crown
} from 'lucide-react';
import { Language } from '@/lib/i18n';
import NotificationBell from '@/components/NotificationBell';
import logoImg from '@/assets/logo.png';

export default function Navbar() {
  const { lang, setLang, theme, toggleTheme, t } = useApp();
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/map', label: lang === 'ru' ? '🗺️ Карта' : lang === 'en' ? '🗺️ Map' : '🗺️ Xarita' },
    { href: '/masters', label: t('allMastersPage') },
    { href: '/find-master', label: t('findMaster') },
    { href: '/categories', label: t('categories') },
  ];

  const langs: { code: Language; label: string }[] = [
    { code: 'uz', label: "O'zbek" },
    { code: 'ru', label: 'Русский' },
    { code: 'en', label: 'English' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <img src={logoImg} alt="UstaZone" className="h-9 w-9 sm:h-10 sm:w-10 object-contain transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-110" />
            <span className="font-black text-lg sm:text-xl tracking-tight whitespace-nowrap">
              <span className="text-gradient">Usta</span>
              <span className="text-foreground">Zone</span>
            </span>
          </Link>

          {/* Desktop nav — only on lg+ to avoid tablet overlap */}
          <nav className="hidden lg:flex items-center gap-0.5 min-w-0 flex-1 justify-center">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`relative px-3 xl:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 group ${
                  isActive(link.href)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="relative z-10">{link.label}</span>
                <span className={`absolute inset-0 rounded-lg bg-primary/10 transition-all duration-300 ${
                  isActive(link.href) ? 'scale-100 opacity-100' : 'scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100'
                }`} />
              </Link>
            ))}
          </nav>


          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 hover:rotate-12 transition-transform duration-300">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {langs.map(l => (
                  <DropdownMenuItem
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={lang === l.code ? 'bg-primary/10 text-primary font-medium' : ''}
                  >
                    {l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle */}
            <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 group" onClick={toggleTheme}>
              {theme === 'light'
                ? <Moon className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />
                : <Sun className="h-4 w-4 transition-transform duration-500 group-hover:rotate-45 group-hover:scale-110" />}
            </Button>

            {user ? (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="rounded-xl gap-2 pl-1.5 pr-2 sm:pr-3 h-9">
                      <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium hidden xl:block max-w-[120px] truncate">
                        {profile?.full_name || 'User'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={() => navigate(
                      isAdmin ? '/admin' : profile?.role === 'master' ? '/dashboard/master' : '/dashboard/client'
                    )}>
                      {isAdmin ? <ShieldCheck className="mr-2 h-4 w-4" /> : <LayoutDashboard className="mr-2 h-4 w-4" />}
                      {isAdmin ? t('adminPanel') : t('dashboard')}
                    </DropdownMenuItem>
                    {profile?.role === 'master' && (
                      <DropdownMenuItem onClick={() => navigate('/subscription')}>
                        <Crown className="mr-2 h-4 w-4 text-amber-500" />
                        Obuna / Tarif
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-1.5">
                <Button variant="ghost" size="sm" className="rounded-xl h-9" onClick={() => navigate('/login')}>
                  {t('login')}
                </Button>
                <Button size="sm" className="rounded-xl btn-hero h-9 !px-4 !py-2 text-sm whitespace-nowrap" onClick={() => navigate('/register')}>
                  {t('register')}
                </Button>
              </div>
            )}

            {/* Mobile menu — visible below lg */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-lg h-9 w-9"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5 animate-scale-in" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border/60 py-3 space-y-1 animate-fade-in-up">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                to={link.href}
                style={{ animationDelay: `${i * 40}ms` }}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 animate-fade-in-up ${
                  isActive(link.href) ? 'bg-primary/10 text-primary translate-x-1' : 'text-foreground hover:bg-muted hover:translate-x-1'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <div className="flex gap-2 pt-2 px-1">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { navigate('/login'); setMobileOpen(false); }}>
                  {t('login')}
                </Button>
                <Button className="flex-1 rounded-xl btn-hero" onClick={() => { navigate('/register'); setMobileOpen(false); }}>
                  {t('register')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

